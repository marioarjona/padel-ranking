// Guarda en backups/ una copia de jugadores y partidos. Si nada ha cambiado desde la última, no escribe nada.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { COLLECTIONS, readAll, sortDeep } from "./firestore.mjs";

const snapshot = {};
for (const c of COLLECTIONS) snapshot[c] = await readAll(c);
const body = JSON.stringify(sortDeep(snapshot), null, 2) + "\n";

const dir = new URL("../backups/", import.meta.url);
mkdirSync(dir, { recursive: true });
const latest = new URL("latest.json", dir);
const summary = COLLECTIONS.map((c) => `${Object.keys(snapshot[c]).length} ${c}`).join(", ");

if (existsSync(latest) && readFileSync(latest, "utf8") === body) {
  console.log(`Sin cambios desde la última copia (${summary}).`);
} else {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  writeFileSync(new URL(`${today}.json`, dir), body);
  writeFileSync(latest, body);
  console.log(`Copia ${today} guardada (${summary}).`);
}
