import { AppShell } from "@/components/layout/app-shell";
import { MockModeBanner } from "@/components/mock/mock-mode-banner";
import { getEntitlements } from "@/lib/entitlements";
import { ensureProfile, requireUser } from "@/server/auth";
import { countActiveProperties } from "@/server/data/properties";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await requireUser();

  await ensureProfile(user.id, user.email);

  const [entitlements, propertyCount] = await Promise.all([
    getEntitlements(user.id),
    countActiveProperties(user.id),
  ]);

  return (
    <>
      <MockModeBanner />
      <AppShell
        showUpgradeBanner={
          !entitlements.isPro &&
          propertyCount > entitlements.editablePropertyIds.length
        }
      >
        {children}
      </AppShell>
    </>
  );
}
