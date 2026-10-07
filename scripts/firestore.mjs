// Acceso mínimo a Firestore por REST, con la misma configuración pública que usa la web.
import { readFileSync } from "node:fs";

const cfg = readFileSync(new URL("../firebase-config.js", import.meta.url), "utf8");
const pick = (key) => (cfg.match(new RegExp(key + ':\\s*"([^"]+)"')) || [])[1];
const API_KEY = pick("apiKey");
const PROJECT = pick("projectId");
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

export const COLLECTIONS = ["players", "matches"];

async function call(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${options.method || "GET"} ${url} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

function fromValue(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
  throw new Error("Tipo de dato no soportado: " + JSON.stringify(v));
}
const fromFields = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromValue(v)]));

function toValue(x) {
  if (x === null) return { nullValue: null };
  if (typeof x === "string") return { stringValue: x };
  if (typeof x === "boolean") return { booleanValue: x };
  if (typeof x === "number") return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (Array.isArray(x)) return { arrayValue: { values: x.map(toValue) } };
  return { mapValue: { fields: toFields(x) } };
}
const toFields = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]));

// JSON estable (claves ordenadas) para comparar y para que los diffs de git sean limpios.
export function sortDeep(x) {
  if (Array.isArray(x)) return x.map(sortDeep);
  if (x && typeof x === "object") return Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortDeep(x[k])]));
  return x;
}
export const same = (a, b) => JSON.stringify(sortDeep(a)) === JSON.stringify(sortDeep(b));

export async function readAll(collection) {
  const out = {};
  let pageToken = "";
  do {
    const page = await call(`${BASE}/${collection}?pageSize=300${pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : ""}`);
    for (const doc of page.documents || []) out[doc.name.split("/").pop()] = fromFields(doc.fields || {});
    pageToken = page.nextPageToken || "";
  } while (pageToken);
  return out;
}

export async function signIn() {
  const r = await call(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }),
  });
  return r.idToken;
}

const auth = (token) => ({ "Content-Type": "application/json", Authorization: "Bearer " + token });

export const createDoc = (collection, id, data, token) =>
  call(`${BASE}/${collection}?documentId=${encodeURIComponent(id)}`, { method: "POST", headers: auth(token), body: JSON.stringify({ fields: toFields(data) }) });

export const deleteDoc = (collection, id, token) =>
  call(`${BASE}/${collection}/${encodeURIComponent(id)}`, { method: "DELETE", headers: auth(token) });
