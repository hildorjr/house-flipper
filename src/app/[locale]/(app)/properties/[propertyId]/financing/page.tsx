import { notFound } from "next/navigation";
import { FinancingManager } from "@/components/financing/financing-manager";
import { requireUser } from "@/server/auth";
import { listLoans } from "@/server/data/loans";
import { getProperty } from "@/server/data/properties";

type FinancingPageProps = {
  params: Promise<{ propertyId: string }>;
};

export default async function FinancingPage({ params }: FinancingPageProps) {
  const { propertyId } = await params;
  const user = await requireUser();
  const [property, loans] = await Promise.all([
    getProperty(user.id, propertyId),
    listLoans(user.id, propertyId),
  ]);
  if (!property) notFound();

  return <FinancingManager propertyId={propertyId} currency={property.currency} loans={loans} />;
}
