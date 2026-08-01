import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const rootDir = path.join(process.cwd(), ".data", "uploads");

function resolveSafe(storagePath: string) {
  const normalized = storagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Invalid storage path");
  }
  const full = path.resolve(rootDir, normalized);
  if (!full.startsWith(path.resolve(rootDir))) {
    throw new Error("Invalid storage path");
  }
  return full;
}

export async function mockWriteFile(storagePath: string, data: Buffer) {
  const full = resolveSafe(storagePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

export async function mockReadFile(storagePath: string) {
  return readFile(resolveSafe(storagePath));
}

export async function mockDeleteFile(storagePath: string) {
  try {
    await unlink(resolveSafe(storagePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function mockUploadUrl(storagePath: string) {
  const token = Buffer.from(storagePath, "utf8").toString("base64url");
  return `/api/mock-storage/upload?token=${token}`;
}

export function mockDownloadUrl(storagePath: string) {
  const token = Buffer.from(storagePath, "utf8").toString("base64url");
  return `/api/mock-storage/file?token=${token}`;
}

export function decodeStorageToken(token: string) {
  return Buffer.from(token, "base64url").toString("utf8");
}
