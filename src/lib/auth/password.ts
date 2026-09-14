import bcrypt from "bcryptjs";

/**
 * Hashing de contraseñas con bcrypt (bcryptjs: JS puro, sin binarios
 * nativos, corre igual en Vercel y en scripts locales).
 * Cost 11 ≈ 100 ms por hash: suficiente contra fuerza bruta offline y
 * aceptable en un serverless.
 */
const COST = 11;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash real de una contraseña que nadie conoce. Se usa para comparar
 * cuando el email no existe, así el tiempo de respuesta es el mismo que
 * con un usuario real y no se puede enumerar cuentas por timing.
 */
let dummyHash: string | null = null;
export async function getDummyHash(): Promise<string> {
  if (!dummyHash) dummyHash = await bcrypt.hash("viraling-dummy-password", COST);
  return dummyHash;
}
