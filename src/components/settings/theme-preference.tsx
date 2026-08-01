"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemePreference() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <Label>{t("theme")}</Label>
      <Select
        value={theme ?? "system"}
        onValueChange={(value) => value && setTheme(value)}
        items={{
          system: t("system"),
          light: t("light"),
          dark: t("dark"),
        }}
      >
        <SelectTrigger className="w-full min-h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">{t("system")}</SelectItem>
          <SelectItem value="light">{t("light")}</SelectItem>
          <SelectItem value="dark">{t("dark")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
