import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const maxUploadSize = 20 * 1024 * 1024;

function extensionFromName(name: string) {
  const extension = path.extname(name).toLowerCase();
  return extension && extension.length <= 12 ? extension : "";
}

function safeBaseName(name: string) {
  const parsed = path.parse(name);
  const base = parsed.name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 64);

  return base || "document";
}

export function isUsableFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function saveDocumentUpload(file: File) {
  if (file.size > maxUploadSize) {
    throw new Error("Upload exceeds 20MB limit");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
  const extension = extensionFromName(file.name);
  const storedName = `${safeBaseName(file.name)}-${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), bytes);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: `/uploads/documents/${storedName}`,
    mimeType: file.type || "application/octet-stream",
  };
}
