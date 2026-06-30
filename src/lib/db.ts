import "server-only";
import path from "path";

// ──────────────────────────────────────────────────────────────────────────────
// Persistencia del CONTENIDO (proyectos + textos) como un único documento JSON.
//   • Producción (Netlify): Netlify Blobs  → persistente y compartido entre
//     instancias. Las ediciones del admin se guardan de verdad.
//   • Desarrollo local: archivo portfolio-data.json en la raíz del proyecto.
// Las imágenes se guardan aparte (ver src/lib/images.ts) en otro store de Blobs.
// ──────────────────────────────────────────────────────────────────────────────

const BLOB_STORE = "site-data";
const BLOB_KEY = "content";
const LOCAL_FILE = path.join(process.cwd(), "portfolio-data.json");

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
}

export interface ContentData {
  projects: Project[];
  config: Record<string, string>;
}

// ─── Backend (Blobs en prod / archivo local en dev) ─────────────────────────────

async function readRaw(): Promise<ContentData | null> {
  try {
    if (process.env.NETLIFY) {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore(BLOB_STORE);
      const json = await store.get(BLOB_KEY, { type: "json" });
      return (json as ContentData) ?? null;
    }
    const { readFile } = await import("fs/promises");
    const txt = await readFile(LOCAL_FILE, "utf8");
    return JSON.parse(txt) as ContentData;
  } catch {
    return null;
  }
}

async function writeRaw(data: ContentData): Promise<void> {
  if (process.env.NETLIFY) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore(BLOB_STORE);
    await store.setJSON(BLOB_KEY, data);
    return;
  }
  const { writeFile } = await import("fs/promises");
  await writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), "utf8");
}

function normalizeProject(p: Partial<Project>): Project {
  return {
    id: String(p.id ?? ""),
    titulo: String(p.titulo ?? ""),
    role: String(p.role ?? ""),
    status: (["live", "prod", "done"].includes(p.status as string)
      ? p.status
      : "done") as ProjectStatus,
    statusLabel: String(p.statusLabel ?? "Entregado"),
    problem: String(p.problem ?? ""),
    features: Array.isArray(p.features) ? p.features.map(String) : [],
    stack: Array.isArray(p.stack) ? p.stack.map(String) : [],
    linkUrl: String(p.linkUrl ?? ""),
    linkLabel: String(p.linkLabel ?? ""),
  };
}

// Carga el documento; si no existe, lo siembra. Mezcla SEED_CONFIG para que las
// claves nuevas (tras un deploy) tengan default sin pisar lo editado.
async function loadData(): Promise<ContentData> {
  const existing = await readRaw();
  if (existing && Array.isArray(existing.projects)) {
    return {
      projects: existing.projects.map(normalizeProject),
      config: { ...SEED_CONFIG, ...(existing.config ?? {}) },
    };
  }
  const seeded: ContentData = {
    projects: SEED_PROJECTS.map(normalizeProject),
    config: { ...SEED_CONFIG },
  };
  // Best-effort: si el backend no está disponible (p. ej. durante el build),
  // igual servimos el seed en memoria sin romper.
  try {
    await writeRaw(seeded);
  } catch {
    /* ignore */
  }
  return seeded;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { projects } = await loadData();
  return projects;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { projects } = await loadData();
  return projects.find((p) => p.id === id);
}

export async function createProject(
  data: Omit<Project, "id"> & { id: string }
): Promise<string> {
  const dataDoc = await loadData();
  const id = data.id;
  if (dataDoc.projects.some((p) => p.id === id)) {
    throw new Error("Ya existe un proyecto con ese identificador");
  }
  dataDoc.projects.push(normalizeProject({ ...data, id }));
  await writeRaw(dataDoc);
  return id;
}

export async function updateProject(
  id: string,
  data: Omit<Project, "id">
): Promise<void> {
  const dataDoc = await loadData();
  const idx = dataDoc.projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Proyecto no encontrado");
  dataDoc.projects[idx] = normalizeProject({ ...data, id });
  await writeRaw(dataDoc);
}

export async function deleteProject(id: string): Promise<void> {
  const dataDoc = await loadData();
  dataDoc.projects = dataDoc.projects.filter((p) => p.id !== id);
  await writeRaw(dataDoc);
}

export async function moveProject(id: string, dir: "up" | "down"): Promise<void> {
  const dataDoc = await loadData();
  const idx = dataDoc.projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= dataDoc.projects.length) return;
  const arr = dataDoc.projects;
  [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
  await writeRaw(dataDoc);
}

// ─── Config (textos del sitio) ──────────────────────────────────────────────────

export async function getAllConfig(): Promise<Record<string, string>> {
  const { config } = await loadData();
  return config;
}

export async function getConfigValue(key: string): Promise<string> {
  const { config } = await loadData();
  return config[key] ?? "";
}

export async function setConfigValues(data: Record<string, string>): Promise<void> {
  const dataDoc = await loadData();
  dataDoc.config = { ...dataDoc.config, ...data };
  await writeRaw(dataDoc);
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
