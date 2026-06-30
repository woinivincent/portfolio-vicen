import path from "path";
import type BetterSQLite3 from "better-sqlite3";

// En Lambda (Netlify/AWS), process.cwd() es read-only; /tmp es el único directorio
// escribible. En desarrollo usamos un archivo local en la raíz del proyecto.
const DB_PATH =
  process.env.DB_PATH ??
  (process.env.NODE_ENV === "production"
    ? "/tmp/portfolio.db"
    : path.join(process.cwd(), "portfolio.db"));

type DBInstance = BetterSQLite3.Database;

declare global {
  // eslint-disable-next-line no-var
  var __portfolioDB: DBInstance | null | undefined;
}

// Devuelve la instancia de DB, o null si el módulo nativo no pudo cargarse.
// Si la DB no está disponible (p. ej. cold start raro), el sitio cae a SEED.
function getDB(): DBInstance | null {
  if (typeof globalThis.__portfolioDB !== "undefined") {
    return globalThis.__portfolioDB ?? null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3") as new (p: string) => DBInstance;
    const db = new Database(DB_PATH);
    initSchema(db);
    seedIfEmpty(db);
    globalThis.__portfolioDB = db;
  } catch (e) {
    console.error("[db] SQLite no disponible, usando datos de ejemplo:", String(e));
    globalThis.__portfolioDB = null;
  }
  return globalThis.__portfolioDB ?? null;
}

function initSchema(db: DBInstance) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      titulo      TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'done',
      statusLabel TEXT NOT NULL DEFAULT 'Entregado',
      problem     TEXT NOT NULL DEFAULT '',
      features    TEXT NOT NULL DEFAULT '[]',
      stack       TEXT NOT NULL DEFAULT '[]',
      linkUrl     TEXT NOT NULL DEFAULT '',
      linkLabel   TEXT NOT NULL DEFAULT '',
      orden       INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = "live" | "prod" | "done";

export interface Project {
  id: string;
  titulo: string;
  role: string;
  status: ProjectStatus;
  statusLabel: string;
  problem: string;
  features: string[];
  stack: string[];
  linkUrl: string;
  linkLabel: string;
  orden: number;
}

type ProjectRow = Omit<Project, "features" | "stack"> & {
  features: string;
  stack: string;
};

function rowToProject(r: ProjectRow): Project {
  return {
    ...r,
    status: r.status as ProjectStatus,
    features: safeParseArray(r.features),
    stack: safeParseArray(r.stack),
  };
}

function safeParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  const db = getDB();
  if (!db) return SEED_PROJECTS;
  const rows = db
    .prepare("SELECT * FROM projects ORDER BY orden ASC, titulo ASC")
    .all() as ProjectRow[];
  return rows.map(rowToProject);
}

export function getProject(id: string): Project | undefined {
  const db = getDB();
  if (!db) return SEED_PROJECTS.find((p) => p.id === id);
  const row = db.prepare("SELECT * FROM projects WHERE id=?").get(id) as
    | ProjectRow
    | undefined;
  return row ? rowToProject(row) : undefined;
}

export function createProject(data: Omit<Project, "id" | "orden"> & { id?: string }): string {
  const db = getDB();
  if (!db) throw new Error("Base de datos no disponible");
  const id = data.id?.trim() || `proj-${Date.now()}`;
  const maxOrden = (db.prepare("SELECT MAX(orden) as m FROM projects").get() as {
    m: number | null;
  }).m;
  const orden = (maxOrden ?? 0) + 1;
  db.prepare(
    `INSERT INTO projects (id,titulo,role,status,statusLabel,problem,features,stack,linkUrl,linkLabel,orden)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    data.titulo,
    data.role,
    data.status,
    data.statusLabel,
    data.problem,
    JSON.stringify(data.features),
    JSON.stringify(data.stack),
    data.linkUrl,
    data.linkLabel,
    orden
  );
  return id;
}

export function updateProject(id: string, data: Omit<Project, "id" | "orden">): void {
  const db = getDB();
  if (!db) throw new Error("Base de datos no disponible");
  db.prepare(
    `UPDATE projects SET titulo=?,role=?,status=?,statusLabel=?,problem=?,features=?,stack=?,linkUrl=?,linkLabel=? WHERE id=?`
  ).run(
    data.titulo,
    data.role,
    data.status,
    data.statusLabel,
    data.problem,
    JSON.stringify(data.features),
    JSON.stringify(data.stack),
    data.linkUrl,
    data.linkLabel,
    id
  );
}

export function deleteProject(id: string): void {
  const db = getDB();
  if (!db) throw new Error("Base de datos no disponible");
  db.prepare("DELETE FROM projects WHERE id=?").run(id);
}

export function moveProject(id: string, dir: "up" | "down"): void {
  const db = getDB();
  if (!db) throw new Error("Base de datos no disponible");
  const all = db
    .prepare("SELECT id, orden FROM projects ORDER BY orden ASC, titulo ASC")
    .all() as { id: string; orden: number }[];
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  const a = all[idx];
  const b = all[swap];
  const tx = db.transaction(() => {
    db.prepare("UPDATE projects SET orden=? WHERE id=?").run(b.orden, a.id);
    db.prepare("UPDATE projects SET orden=? WHERE id=?").run(a.orden, b.id);
  });
  tx();
}

// ─── Config (textos del sitio) ─────────────────────────────────────────────────

export function getAllConfig(): Record<string, string> {
  const db = getDB();
  if (!db) return { ...SEED_CONFIG };
  const rows = db.prepare("SELECT key, value FROM config").all() as {
    key: string;
    value: string;
  }[];
  // Mezclamos con SEED para que claves nuevas (tras un deploy) tengan default.
  return { ...SEED_CONFIG, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

export function getConfigValue(key: string): string {
  return getAllConfig()[key] ?? "";
}

export function setConfigValues(data: Record<string, string>): void {
  const db = getDB();
  if (!db) throw new Error("Base de datos no disponible");
  const stmt = db.prepare(
    "INSERT INTO config (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  );
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(data)) stmt.run(key, value);
  });
  tx();
}

// ─── Seed ──────────────────────────────────────────────────────────────────────

function seedIfEmpty(db: DBInstance) {
  const projCount = (db.prepare("SELECT COUNT(*) as c FROM projects").get() as {
    c: number;
  }).c;
  if (projCount === 0) {
    const ins = db.prepare(
      `INSERT INTO projects (id,titulo,role,status,statusLabel,problem,features,stack,linkUrl,linkLabel,orden)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    );
    SEED_PROJECTS.forEach((p, i) => {
      ins.run(
        p.id,
        p.titulo,
        p.role,
        p.status,
        p.statusLabel,
        p.problem,
        JSON.stringify(p.features),
        JSON.stringify(p.stack),
        p.linkUrl,
        p.linkLabel,
        i + 1
      );
    });
  }

  const cfgCount = (db.prepare("SELECT COUNT(*) as c FROM config").get() as {
    c: number;
  }).c;
  if (cfgCount === 0) {
    const ins = db.prepare("INSERT INTO config (key,value) VALUES (?,?)");
    for (const [key, value] of Object.entries(SEED_CONFIG)) ins.run(key, value);
  }
}

// ─── Seed data (contenido inicial = portfolio estático original) ────────────────

const SEED_PROJECTS: Project[] = [
  {
    id: "flandes",
    titulo: "Campo Escuela Flandes",
    role: "Plataforma para ONG scout · full-stack + deploy",
    status: "done",
    statusLabel: "Entregado",
    problem:
      "Una ONG scout sin presencia web, que coordinaba a mano las altas de socios, las reservas y la información del campamento: todo disperso y dependiente del contacto manual.",
    features: [
      "Área privada de socios con registro y login (JWT + hashing) y reservas autogestionadas",
      "Panel de administración con dos roles diferenciados",
      "Mapa aéreo del campamento, fichas de flora por QR y biblioteca digital",
      "Integración con WhatsApp",
    ],
    stack: ["Next.js", "React", "TypeScript", "node:sqlite", "jose · JWT", "bcrypt"],
    linkUrl: "",
    linkLabel: "",
    orden: 1,
  },
  {
    id: "nasello",
    titulo: "Nasello Cables",
    role: "Sitio corporativo · desarrollo + deploy",
    status: "live",
    statusLabel: "En vivo",
    problem:
      "Poner el sitio a andar sobre el hosting compartido del cliente (cPanel) traía una cadena de problemas de producción —ruteo, API, carga de archivos— que había que resolver para dejarlo estable.",
    features: [
      "Static export de Next.js corriendo sobre cPanel",
      "Ruteo, endpoints y carga de archivos resueltos en producción",
    ],
    stack: ["Next.js", "Static export", "cPanel"],
    linkUrl: "https://nasellocables.com",
    linkLabel: "nasellocables.com",
    orden: 2,
  },
  {
    id: "pos",
    titulo: "Punto de venta — Nueva Siembra",
    role: "Software de escritorio · full-stack",
    status: "prod",
    statusLabel: "En producción",
    problem:
      "El comercio cargaba ventas de forma lenta y manual. Hacía falta cobrar rápido en el mostrador, manejar varios medios de pago y tener los datos ordenados para administrar el negocio.",
    features: [
      "Grilla de productos, carrito, impuestos y múltiples medios de pago",
      "Atajos de teclado F1–F6 para operar sin mouse",
      "Exportaciones profesionales a Excel y gestión de imágenes",
    ],
    stack: ["Electron", "React", "TypeScript", "SQLite", "ExcelJS"],
    linkUrl: "",
    linkLabel: "",
    orden: 3,
  },
  {
    id: "asistente",
    titulo: "Asistente con IA",
    role: "Chatbot multi-herramienta · backend",
    status: "done",
    statusLabel: "Funcional",
    problem:
      "Las consultas repetitivas y las operaciones sobre datos del negocio consumían tiempo. Hacía falta un asistente que entendiera el contexto y ejecutara acciones reales, no respuestas genéricas.",
    features: [
      "Function calling y loop de agente con varias herramientas",
      "Recuperación aumentada (RAG) sobre datos propios",
      "Memoria persistente entre sesiones",
    ],
    stack: ["API de Anthropic", "RAG", "Agentes"],
    linkUrl: "",
    linkLabel: "",
    orden: 4,
  },
  {
    id: "materiales",
    titulo: "App de pedidos de materiales",
    role: "Aplicación móvil · full-stack",
    status: "done",
    statusLabel: "Entregado",
    problem:
      "Los pedidos de materiales de riego y construcción se tomaban de forma informal, sin catálogo claro ni historial, lo que generaba errores y reprocesos.",
    features: [
      "Catálogo, carrito e historial de pedidos",
      "Ruteo dinámico y estado global con Context API",
      "Datos en almacenamiento local (uso sin conexión)",
    ],
    stack: ["React Native", "Context API", "AsyncStorage"],
    linkUrl: "",
    linkLabel: "",
    orden: 5,
  },
];

const SEED_CONFIG: Record<string, string> = {
  "site.brand": "vicenw.com",
  "site.title": "Vicente Woinilowicz — Desarrollador full-stack",
  "site.description":
    "Desarrollador full-stack. Construyo y pongo en producción sistemas web completos: del frontend al deploy. Next.js, React, TypeScript, Node, Electron, React Native.",

  "hero.eyebrow": "Desarrollador full-stack · Web & Software",
  "hero.titleBefore": "Construyo sistemas que pasan a",
  "hero.titleAccent": "producción",
  "hero.titleAfter": "y se usan todos los días.",
  "hero.lede":
    "Tomo un problema, diseño la solución, la desarrollo y la dejo funcionando — del frontend al deploy, solo, de punta a punta.",
  "hero.chips": JSON.stringify([
    "Next.js",
    "React",
    "TypeScript",
    "Node",
    "SQLite · PostgreSQL",
    "Electron",
    "React Native",
  ]),
  "hero.ctaPrimary": "Ver proyectos",
  "hero.ctaSecondaryLabel": "Ver un sitio en vivo ↗",
  "hero.ctaSecondaryUrl": "https://nasellocables.com",

  "approach.tag": "// cómo trabajo",
  "approach.heading": "End-to-end, sin pasar la pelota.",
  "approach.intro":
    "No me especializo en una sola capa. Lo que recibe el cliente es un sistema terminado y andando, no una entrega que después hay que ensamblar entre varios.",
  "approach.cells": JSON.stringify([
    {
      title: "Diseño y desarrollo",
      text: "De la interfaz al modelo de datos. Frontend prolijo, lógica de backend, autenticación y panel de administración.",
    },
    {
      title: "Puesta en producción",
      text: "Deploy real y resolución de los problemas que aparecen recién en producción: hosting, exports, permisos, hand-off.",
    },
    {
      title: "Web, escritorio y móvil",
      text: "Mismo criterio en plataformas web, apps de escritorio (Electron) y aplicaciones móviles (React Native).",
    },
  ]),

  "projects.tag": "// trabajos seleccionados",
  "projects.heading": "Proyectos",
  "projects.intro":
    "Una muestra del tipo de sistemas que armo: plataformas con usuarios, paneles de gestión, software de comercio y soluciones con IA.",

  "stack.tag": "// herramientas",
  "stack.heading": "Stack y capacidades",
  "stack.intro": "Tecnologías con las que trabajo a diario, agrupadas por dónde las uso.",
  "stack.groups": JSON.stringify([
    { title: "Frontend", items: ["React", "Next.js (App Router)", "TypeScript", "React Native"] },
    {
      title: "Backend & datos",
      items: ["Node.js", "SQLite", "PostgreSQL", "APIs REST", "JWT / NextAuth", "bcrypt"],
    },
    { title: "Escritorio & Python", items: ["Electron", "Python", "PyQt6", "Flask"] },
    { title: "IA & automatización", items: ["API de Anthropic", "Function calling", "RAG", "Agentes"] },
    { title: "Integraciones", items: ["WhatsApp", "Twilio", "Excel · ExcelJS", "QR"] },
    {
      title: "Seguridad & deploy",
      items: ["Prevención SQLi / XSS / CSRF", "Análisis de logs", "Vercel", "Netlify", "cPanel"],
    },
  ]),

  "contact.tag": "// hablemos",
  "contact.heading": "¿Armamos algo juntos?",
  "contact.intro":
    "Disponible para proyectos web, software a medida y colaboraciones. Te respondo rápido.",
  "contact.email": "vicendev@protonmail.com",
  "contact.whatsapp": "5492323462300",
  "contact.github": "https://github.com/Woinivincent",

  "footer.left": "© 2026 Vicente Woinilowicz · vicenw.com",
  "footer.right": "Hecho con Next.js · React · TypeScript",
};
