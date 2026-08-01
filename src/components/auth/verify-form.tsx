"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  sendEmailOtp,
  sendPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "@/server/actions/auth";
import { useRouter } from "@/i18n/navigation";
import { FieldLabel } from "@/components/field";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockFixtures } from "@/lib/mock/form-fixtures";

type VerifyFormProps = {
  email?: string;
  phone?: string;
  mockOtpCode?: string;
};

export function VerifyForm({ email, phone, mockOtpCode }: VerifyFormProps) {
  const t = useTranslations("auth");
  const th = useTranslations("fieldHelp");
  const tPlaceholders = useTranslations("placeholders");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [isPending, startTransition] = useTransition();
  const recipient = email ?? phone;

  useEffect(() => {
    if (seconds === 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  function verify() {
    if (!recipient) return;

    startTransition(async () => {
      const result = email
        ? await verifyEmailOtp(email, code)
        : await verifyPhoneOtp(phone!, code);

      if (!result.ok) {
        toast.error(t("invalidCode"));
        return;
      }
      router.replace("/properties");
      router.refresh();
    });
  }

  function resend() {
    if (!recipient || seconds > 0) return;

    startTransition(async () => {
      const result = email ? await sendEmailOtp(email) : await sendPhoneOtp(phone!);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSeconds(60);
      toast.success(t("codeSent"));
    });
  }

  return (
    <Card className="w-full max-w-md rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="tracking-tight">{t("verifyTitle")}</CardTitle>
        <CardDescription>
          {t("verifySubtitle")}
          {recipient && <span className="mt-1 block font-medium text-foreground">{recipient}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recipient ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              verify();
            }}
          >
            <FieldLabel label={t("code")} help={th("otp")} />
            {mockOtpCode && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {t("mockCodeHint", { code: mockOtpCode })}
              </p>
            )}
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={tPlaceholders("otp")}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em]"
              required
            />
            <Button type="submit" className="w-full" disabled={isPending || code.length !== 6}>
              {t("verify")}
            </Button>
            <FillFormButton
              className="w-full"
              onFill={() => setCode(mockOtpCode ?? mockFixtures.auth.otp)}
            />
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isPending || seconds > 0}
              onClick={resend}
            >
              {seconds > 0 ? t("resendIn", { seconds }) : t("resend")}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-destructive">{t("missingRecipient")}</p>
        )}
      </CardContent>
    </Card>
  );
}
