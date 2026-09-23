// OposDipu backend — auth API + static frontend serving.
// Node 20, ESM.
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extraerArticulo,
  parseCita,
  resolverLey,
  tituloDocumento,
} from "./lib/articulos.js";

const here = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(here, "data");
const USERS_FILE = join(DATA_DIR, "users.json");

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error(
    "[auth] FATAL: JWT_SECRET no está configurado. El servidor no arranca sin " +
      "un secreto JWT. Define JWT_SECRET como variable de entorno."
  );
  process.exit(1);
}

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL = "7d";

// ---- User store (users.json, atomic writes) ----
function loadUsers() {
  try {
    const raw = readFileSync(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  mkdirSync(DATA_DIR, { recursive: true });
  // Atomic write: write to temp file, then rename over the target.
  const tmp = `${USERS_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(users, null, 2), "utf8");
  renameSync(tmp, USERS_FILE);
}

function validateCredentials(username, password) {
  const errors = [];
  if (typeof username !== "string" || username.trim().length < 3) {
    errors.push("username must be at least 3 characters");
  }
  if (typeof password !== "string" || password.length < 6) {
    errors.push("password must be at least 6 characters");
  }
  return errors;
}

// ---- Seed user (development default; overridable via env) ----
// Default credentials exist for local development convenience only.
// Set SEED_USER/SEED_PASS (or disable via NO_SEED=1) and JWT_SECRET in production.
function seedUser() {
  const seedUser = process.env.SEED_USER || "admin";
  const seedPass = process.env.SEED_PASS || "oposdipu-2026";
  const usedDefault = !process.env.SEED_USER || !process.env.SEED_PASS;
  if (process.env.NO_SEED === "1") return false;
  const users = loadUsers();
  if (users[seedUser]) return false;
  users[seedUser] = {
    hash: bcrypt.hashSync(seedPass, BCRYPT_ROUNDS),
    createdAt: new Date().toISOString(),
  };
  saveUsers(users);
  if (usedDefault) {
    console.warn(
      "[seed] Created default dev user 'admin' / 'oposdipu-2026' (development only). " +
        "Override with SEED_USER/SEED_PASS or disable with NO_SEED=1."
    );
  } else {
    console.log(`[seed] Created seed user '${seedUser}'.`);
  }
  return true;
}

// ---- App ----
export const app = express();
// Detrás del proxy inverso de Easypanel: necesario para que el rate limiting
// vea la IP real del cliente en lugar de la del proxy.
app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));

// ---- Rate limiting en auth (anti fuerza bruta / registro masivo) ----
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "demasiados intentos, inténtalo de nuevo más tarde" },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 registros por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "demasiados registros, inténtalo de nuevo más tarde" },
});

// ---- Auth routes ----
app.post("/api/auth/register", registerLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};
  const errors = validateCredentials(username, password);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }
  const name = username.trim();
  const users = loadUsers();
  if (users[name]) {
    return res.status(409).json({ error: "user already exists" });
  }
  users[name] = {
    hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    createdAt: new Date().toISOString(),
  };
  saveUsers(users);
  const token = jwt.sign({ username: name }, jwtSecret, { expiresIn: TOKEN_TTL });
  return res.status(201).json({ username: name, token });
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};
  const name = typeof username === "string" ? username.trim() : "";
  const users = loadUsers();
  const user = users[name];
  const ok =
    user &&
    typeof password === "string" &&
    (await bcrypt.compare(password, user.hash));
  if (!ok) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  const token = jwt.sign({ username: name }, jwtSecret, { expiresIn: TOKEN_TTL });
  return res.json({ token });
});

function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing or invalid Authorization header" });
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

app.get("/api/auth/me", requireAuth, (req, res) => {
  return res.json({ username: req.user.username });
});

// ---- Texto de artículos del corpus legal local ----
// GET /api/articulo?ley=<nombre citado>&articulo=<cita: "art. 1.3", "arts. 68, 71 y 82"...>
app.get("/api/articulo", (req, res) => {
  const { ley, articulo } = req.query;
  if (
    typeof ley !== "string" ||
    !ley.trim() ||
    typeof articulo !== "string" ||
    !articulo.trim() ||
    ley.length > 300 ||
    articulo.length > 200
  ) {
    return res.status(400).json({
      error: "parametros_requeridos",
      message: "Indica los parámetros 'ley' y 'articulo'.",
    });
  }

  const leyRes = resolverLey(ley.trim());
  if (!leyRes) {
    return res.status(404).json({
      error: "ley_no_encontrada",
      message: `La ley "${ley.trim()}" no está en el corpus local.`,
    });
  }
  if (!leyRes.archivo) {
    return res.status(404).json({
      error: "ley_sin_corpus",
      message: `La ley "${leyRes.nombre}" no tiene texto disponible en el corpus local.`,
      motivo: leyRes.motivo || "fuente fuera del corpus",
    });
  }

  const refs = parseCita(articulo.trim());
  if (!refs) {
    return res.status(400).json({
      error: "cita_no_valida",
      message: `La cita "${articulo.trim()}" no referencia artículos concretos.`,
    });
  }

  const articulos = [];
  const noEncontrados = [];
  for (const r of refs) {
    const art = extraerArticulo(leyRes.archivo, r.numero);
    if (art && art.texto) {
      articulos.push({
        numero: art.numero,
        sub: r.sub,
        titulo: art.titulo,
        texto: art.texto,
      });
    } else {
      noEncontrados.push(r.numero);
    }
  }

  if (articulos.length === 0) {
    return res.status(404).json({
      error: "articulo_no_encontrado",
      message: `El artículo ${refs.map((r) => r.numero).join(", ")} no se encontró en "${leyRes.nombre}".`,
      noEncontrados,
    });
  }

  return res.json({
    ley: leyRes.nombre,
    cita: articulo.trim(),
    titulo: tituloDocumento(leyRes.archivo),
    articulos,
    noEncontrados,
  });
});

// Unknown API routes → JSON 404 (must come before the static fallback).
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "not found" });
});

// ---- Static frontend ----
const distDir = resolve(here, "../app/dist");
app.use(express.static(distDir, { index: false }));
// SPA fallback for non-API routes.
app.get("*", (req, res) => {
  res.sendFile(join(distDir, "index.html"));
});

// ---- Server start ----
export function start({ port = process.env.PORT ? Number(process.env.PORT) : 3000 } = {}) {
  const seeded = seedUser();
  const server = app.listen(port, () => {
    const addr = server.address();
    const actualPort = typeof addr === "object" && addr ? addr.port : port;
    console.log(`[server] OposDipu listening on port ${actualPort} (seed applied: ${seeded})`);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start();
}
