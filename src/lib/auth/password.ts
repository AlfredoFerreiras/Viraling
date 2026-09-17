import bcrypt from "bcryptjs";

/**
 * Password hashing with bcrypt (bcryptjs: pure JS, no native
 * binaries, runs the same on Vercel and in local scripts).
 * Cost 11 is roughly 100 ms per hash: enough against offline brute force and
 * acceptable in a serverless environment.
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
 * Real hash of a password nobody knows. Used to compare against
 * when the email does not exist, so the response time matches that of
 * a real user and accounts cannot be enumerated by timing.
 */
let dummyHash: string | null = null;
export async function getDummyHash(): Promise<string> {
  if (!dummyHash) dummyHash = await bcrypt.hash("viraling-dummy-password", COST);
  return dummyHash;
}
