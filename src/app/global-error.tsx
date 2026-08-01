"use client";

import { hasLocale, NextIntlClientProvider, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import en from "../../messages/en.json";
import ptBR from "../../messages/pt-BR.json";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import "./globals.css";

const messages = { "pt-BR": ptBR, en };

function GlobalErrorContent({ retry }: { retry: () => void }) {
  const t = useTranslations("errors");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      <Button className="rounded-xl" onClick={retry}>
        {t("retry")}
      </Button>
    </main>
  );
}

export default function GlobalError({
  unstable_retry,
}: {
  unstable_retry: () => void;
}) {
  const segment = usePathname()?.split("/")[1];
  const locale = hasLocale(routing.locales, segment)
    ? segment
    : routing.defaultLocale;

  return (
    <html lang={locale}>
      <body className="font-sans">
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
          <GlobalErrorContent retry={unstable_retry} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
