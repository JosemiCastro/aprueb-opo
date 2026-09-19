// Tests del endpoint GET /api/articulo — node:test + node:assert, sin frameworks.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "oposdipu-test-art-"));
process.env.JWT_SECRET = "test-secret-articulo";
process.env.PORT = "0";

const { start } = await import("../index.js");

let server;
let base;

before(async () => {
  server = start({ port: 0 });
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(process.env.DATA_DIR, { recursive: true, force: true });
});

async function get(path) {
  const res = await fetch(`${base}${path}`);
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { res, json };
}

const q = (o) => new URLSearchParams(o).toString();

test("artículo existente: CE art. 1.3 devuelve el texto del artículo 1", async () => {
  const { res, json } = await get(
    `/api/articulo?${q({ ley: "Constitución Española de 1978", articulo: "art. 1.3" })}`
  );
  assert.equal(res.status, 200);
  assert.equal(json.ley, "Constitución Española de 1978");
  assert.equal(json.cita, "art. 1.3");
  assert.equal(json.articulos.length, 1);
  assert.equal(json.articulos[0].numero, 1);
  assert.equal(json.articulos[0].sub, "3");
  assert.match(json.articulos[0].texto, /Monarquía parlamentaria/);
});

test("varios artículos: Ley 39/2015 arts. 68, 71 y 82", async () => {
  const { res, json } = await get(
    `/api/articulo?${q({
      ley: "Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas",
      articulo: "arts. 68, 71 y 82",
    })}`
  );
  assert.equal(res.status, 200);
  assert.deepEqual(
    json.articulos.map((a) => a.numero),
    [68, 71, 82]
  );
  for (const a of json.articulos) assert.ok(a.texto.length > 20);
});

test("artículo inexistente → 404", async () => {
  const { res, json } = await get(
    `/api/articulo?${q({ ley: "Constitución Española de 1978", articulo: "art. 9999" })}`
  );
  assert.equal(res.status, 404);
  assert.equal(json.error, "articulo_no_encontrado");
});

test("ley fuera del corpus (normativa de Diputación) → 404 con motivo", async () => {
  const { res, json } = await get(
    `/api/articulo?${q({
      ley: "Acuerdo Marco de Concertación de la Diputación de Huelva",
      articulo: "art. 5",
    })}`
  );
  assert.equal(res.status, 404);
  assert.equal(json.error, "ley_sin_corpus");
  assert.ok(json.motivo);
});

test("ley desconocida → 404", async () => {
  const { res, json } = await get(
    `/api/articulo?${q({ ley: "Ley de la Selva", articulo: "art. 1" })}`
  );
  assert.equal(res.status, 404);
  assert.equal(json.error, "ley_no_encontrada");
});

test("cita no válida → 400", async () => {
  const { res, json } = await get(
    `/api/articulo?${q({ ley: "Constitución Española de 1978", articulo: "—" })}`
  );
  assert.equal(res.status, 400);
  assert.equal(json.error, "cita_no_valida");
});

test("sin parámetros → 400", async () => {
  const { res } = await get("/api/articulo");
  assert.equal(res.status, 400);
});
