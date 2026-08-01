import { decodeStorageToken, mockWriteFile } from "@/lib/mock/storage";
import { isMockThirdParty } from "@/lib/mock/enabled";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!isMockThirdParty()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  try {
    const storagePath = decodeStorageToken(token);
    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return Response.json({ error: "File too large" }, { status: 413 });
    }
    await mockWriteFile(storagePath, bytes);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 400 },
    );
  }
}
