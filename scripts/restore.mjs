// Deja la base de datos exactamente como estaba en una copia de backups/.
// Uso: FECHA=2026-10-07 node scripts/restore.mjs   (FECHA=latest para la última; DRY_RUN=1 para solo ver qué haría)
import { readFileSync } from "node:fs";
import { COLLECTIONS, createDoc, deleteDoc, readAll, same, signIn } from "./firestore.mjs";

const fecha = (process.env.FECHA || "").trim();
if (!/^(latest|\d{4}-\d{2}-\d{2})$/.test(fecha)) throw new Error(`Fecha no válida: "${fecha}". Usa AAAA-MM-DD o latest.`);
const backup = JSON.parse(readFileSync(new URL(`../backups/${fecha}.json`, import.meta.url), "utf8"));
const dryRun = process.env.DRY_RUN === "1";
const token = dryRun ? null : await signIn();

for (const c of COLLECTIONS) {
  const current = await readAll(c);
  const wanted = backup[c] || {};
  const toDelete = Object.keys(current).filter((id) => !(id in wanted) || !same(current[id], wanted[id]));
  const toCreate = Object.keys(wanted).filter((id) => !(id in current) || !same(current[id], wanted[id]));
  console.log(`${c}: ${toDelete.length} a borrar, ${toCreate.length} a recuperar${dryRun ? " (simulación)" : ""}`);
  if (dryRun) continue;
  for (const id of toDelete) await deleteDoc(c, id, token);
  for (const id of toCreate) await createDoc(c, id, wanted[id], token);
}
console.log(dryRun ? "Simulación terminada: no se ha cambiado nada." : `Restaurada la copia ${fecha}.`);
