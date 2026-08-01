"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { sendEmailOtp, sendPhoneOtp } from "@/server/actions/auth";
import { useRouter } from "@/i18n/navigation";
import { FieldLabel } from "@/components/field";
import { MaskedInput } from "@/components/masked-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import { toE164 } from "@/lib/masks";

type LoginFormProps = {
  phoneEnabled: boolean;
};

export function LoginForm({ phoneEnabled }: LoginFormProps) {
  const t = useTranslations("auth");
  const th = useTranslations("fieldHelp");
  const tPlaceholders = useTranslations("placeholders");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();

  function sendEmail() {
    startTransition(async () => {
      const result = await sendEmailOtp(email);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("codeSent"));
      router.push({ pathname: "/verify", query: { email } });
    });
  }

  function sendPhone() {
    startTransition(async () => {
      const e164 = toE164(phone);
      const result = await sendPhoneOtp(e164);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("codeSent"));
      router.push({ pathname: "/verify", query: { phone: e164 } });
    });
  }

  return (
    <Card className="w-full max-w-md rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="tracking-tight">{t("loginTitle")}</CardTitle>
        <CardDescription>{t("loginSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            sendEmail();
          }}
        >
          <FieldLabel label={t("email")} help={th("email")} />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={tPlaceholders("email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {t("sendCode")}
          </Button>
          <FillFormButton
            className="w-full"
            onFill={() => {
              setEmail(mockFixtures.auth.email);
              setPhone(mockFixtures.auth.phone);
            }}
          />
        </form>
        {phoneEnabled && (
          <form
            className="space-y-3 border-t pt-6"
            onSubmit={(event) => {
              event.preventDefault();
              sendPhone();
            }}
          >
            <FieldLabel label={t("phone")} help={th("phoneIntl")} />
            <MaskedInput
              id="phone"
              mask="phoneIntl"
              type="tel"
              autoComplete="tel"
              placeholder={tPlaceholders("phoneIntl")}
              value={phone}
              onValueChange={setPhone}
              required
            />
            <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
              {t("sendCode")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
