import { logError } from "@/lib/logger";
import { pingDatabase } from "@/server/data/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pingDatabase();
    return Response.json({ ok: true, database: "up", timestamp: new Date().toISOString() });
  } catch (error) {
    logError("Health check failed", { error });
    return Response.json(
      { ok: false, database: "down", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
