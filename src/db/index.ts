import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// El driver serverless de Neon usa WebSockets para soportar transacciones
// interactivas (necesarias para setear el contexto RLS por transacción).
// En Node < 22 con fetch nativo igual hace falta el polyfill de ws.
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type Db = typeof db;
export { schema };
