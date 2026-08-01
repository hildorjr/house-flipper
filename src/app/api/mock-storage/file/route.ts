import { decodeStorageToken, mockReadFile } from "@/lib/mock/storage";
import { isMockThirdParty } from "@/lib/mock/enabled";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isMockThirdParty()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  try {
    const storagePath = decodeStorageToken(token);
    const bytes = await mockReadFile(storagePath);
    return new Response(bytes, {
      headers: {
        "content-type": "application/octet-stream",
        "cache-control": "private, max-age=60",
      },
    });
  } catch {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
}
