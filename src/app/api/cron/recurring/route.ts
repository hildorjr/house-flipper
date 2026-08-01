import { generateAllPendingExpenses } from "@/server/data/recurring";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

async function generate(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const created = await generateAllPendingExpenses();
  return Response.json({ created });
}

export const GET = generate;
export const POST = generate;
