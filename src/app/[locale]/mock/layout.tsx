import { requireUser } from "@/server/auth";
import { isMockThirdParty } from "@/lib/mock/enabled";
import { notFound } from "next/navigation";
import { MockModeBanner } from "@/components/mock/mock-mode-banner";

export default async function MockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isMockThirdParty()) notFound();
  await requireUser();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <MockModeBanner />
      {children}
    </div>
  );
}
