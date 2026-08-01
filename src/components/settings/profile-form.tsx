"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { saveProfile } from "@/server/actions/profiles";
import { FieldLabel } from "@/components/field";
import { MaskedInput } from "@/components/masked-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockFixtures } from "@/lib/mock/form-fixtures";

type ProfileFormProps = {
  fullName: string | null;
  phone: string | null;
  locale: string;
  currency: string;
  email: string | null;
};

export function ProfileForm({
  fullName,
  phone,
  locale,
  currency,
  email,
}: ProfileFormProps) {
  const t = useTranslations("settings");
  const th = useTranslations("fieldHelp");
  const tc = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(fullName ?? "");
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [localeValue, setLocaleValue] = useState(locale);
  const [currencyValue, setCurrencyValue] = useState(currency);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await saveProfile({
            fullName: name || null,
            phone: phoneValue || null,
            locale: localeValue as "pt-BR" | "en",
            currency: currencyValue,
          });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(tc("success"));
        });
      }}
    >
      <div className="space-y-2">
        <FieldLabel label={t("email")} help={th("email")} />
        <Input id="email" value={email ?? ""} disabled />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t("fullName")} help={th("fullName")} />
        <Input
          id="fullName"
          placeholder={tPlaceholders("fullName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t("phone")} help={th("phone")} />
        <MaskedInput
          id="phone"
          mask="phone"
          type="tel"
          inputMode="tel"
          placeholder={tPlaceholders("phone")}
          value={phoneValue}
          onValueChange={setPhoneValue}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("locale")}</Label>
        <Select
          value={localeValue}
          onValueChange={(value) => value && setLocaleValue(value)}
          items={{
            "pt-BR": t("localePtBr"),
            en: t("localeEn"),
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">{t("localePtBr")}</SelectItem>
            <SelectItem value="en">{t("localeEn")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("currency")}</Label>
        <Select
          value={currencyValue}
          onValueChange={(value) => value && setCurrencyValue(value)}
          items={{ BRL: "BRL", USD: "USD", EUR: "EUR" }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BRL">BRL</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} className="min-h-11">
          {tc("save")}
        </Button>
        <FillFormButton
          className="min-h-11"
          onFill={() => {
            const mock = mockFixtures.profile;
            setName(mock.fullName);
            setPhoneValue(mock.phone);
            setLocaleValue(mock.locale);
            setCurrencyValue(mock.currency);
          }}
        />
      </div>
    </form>
  );
}
