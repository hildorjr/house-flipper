import { getSessionUser } from "@/server/auth";
import { listExpenses } from "@/server/data/expenses";
import { getProfile } from "@/server/data/profiles";
import { getProperty } from "@/server/data/properties";

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { propertyId } = await params;
  const [property, profile] = await Promise.all([
    getProperty(user.id, propertyId),
    getProfile(user.id),
  ]);
  if (!property) return Response.json({ error: "Not found" }, { status: 404 });

  const locale = profile?.locale ?? "pt-BR";
  const expenses = await listExpenses(user.id, { propertyId });
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: property.currency,
  });
  const dates = new Intl.DateTimeFormat(locale);
  const rows = [
    ["Date", "Description", "Category", "Group", "Status", "Amount"],
    ...expenses.map((expense) => [
      dates.format(expense.incurredOn),
      expense.description,
      expense.category.name ?? expense.category.key ?? "",
      expense.category.group,
      expense.status,
      money.format(expense.amountCents / 100),
    ]),
  ];
  const content = `\uFEFF${rows.map((row) => row.map(csvValue).join(",")).join("\r\n")}`;

  return new Response(content, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="expenses-${propertyId}.csv"`,
    },
  });
}
