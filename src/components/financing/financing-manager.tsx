"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoneyDisplay } from "@/components/money-display";
import { Field } from "@/components/field";
import { MoneyInput } from "@/components/money-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { Button } from "@/components/ui/button";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import {
  createLoanAction,
  deleteLoanAction,
  markInstallmentPaidAction,
  unmarkInstallmentPaidAction,
} from "@/server/actions/loans";

type Installment = {
  id: string;
  number: number;
  dueDate: Date;
  principalCents: number;
  interestCents: number;
  feesCents: number;
  totalCents: number;
  paidOn: Date | null;
};
type Loan = {
  id: string;
  lender: string;
  principalCents: number;
  annualRateBps: number;
  termMonths: number;
  system: "SAC" | "PRICE";
  firstDueDate: Date;
  monthlyInsuranceCents: number;
  monthlyAdminFeeCents: number;
  originationFeeCents: number;
  installments: Installment[];
};
type FinancingManagerProps = { propertyId: string; currency: string; loans: Loan[] };

function dateValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function FinancingManager({ propertyId, currency, loans }: FinancingManagerProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("financing");
  const th = useTranslations("fieldHelp");
  const tCommon = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");
  const tAmortization = useTranslations("amortization");
  const [showForm, setShowForm] = useState(false);
  const [lender, setLender] = useState("");
  const [principalCents, setPrincipalCents] = useState<number | null>(null);
  const [annualRate, setAnnualRate] = useState("");
  const [termMonths, setTermMonths] = useState("360");
  const [system, setSystem] = useState<"SAC" | "PRICE">("SAC");
  const [firstDueDate, setFirstDueDate] = useState(dateValue());
  const [insuranceCents, setInsuranceCents] = useState<number | null>(0);
  const [adminFeeCents, setAdminFeeCents] = useState<number | null>(0);
  const [originationFeeCents, setOriginationFeeCents] = useState<number | null>(0);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setShowForm(false);
    setLender("");
    setPrincipalCents(null);
    setAnnualRate("");
    setTermMonths("360");
    setSystem("SAC");
    setFirstDueDate(dateValue());
    setInsuranceCents(0);
    setAdminFeeCents(0);
    setOriginationFeeCents(0);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!principalCents) return;
    startTransition(async () => {
      const result = await createLoanAction({
        propertyId,
        lender,
        principalCents,
        annualRateBps: Math.round(Number(annualRate) * 100),
        termMonths: Number(termMonths),
        system,
        firstDueDate,
        monthlyInsuranceCents: insuranceCents ?? 0,
        monthlyAdminFeeCents: adminFeeCents ?? 0,
        originationFeeCents: originationFeeCents ?? 0,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      reset();
      router.refresh();
    });
  }

  function setPaid(installment: Installment) {
    startTransition(async () => {
      const result = installment.paidOn
        ? await unmarkInstallmentPaidAction(installment.id)
        : await markInstallmentPaidAction(installment.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(loanId: string) {
    startTransition(async () => {
      const result = await deleteLoanAction(loanId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <FillFormButton
          onFill={() => {
            const mock = mockFixtures.loan;
            setShowForm(true);
            setLender(mock.lender);
            setPrincipalCents(mock.principalCents);
            setAnnualRate(mock.annualRate);
            setTermMonths(mock.termMonths);
            setSystem(mock.system);
            setFirstDueDate(mock.firstDueDate);
            setInsuranceCents(mock.insuranceCents);
            setAdminFeeCents(mock.adminFeeCents);
            setOriginationFeeCents(mock.originationFeeCents);
          }}
        />
        <Button onClick={() => setShowForm(true)} disabled={isPending}>
          <Plus />
          {t("add")}
        </Button>
      </div>
      {showForm && (
        <form onSubmit={save} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <Field label={t("lender")} help={th("lender")}><input value={lender} placeholder={tPlaceholders("lender")} onChange={(event) => setLender(event.target.value)} required /></Field>
          <Field label={t("principal")} help={th("principal")}><MoneyInput value={principalCents} currency={currency} onValueChange={setPrincipalCents} required /></Field>
          <Field label={t("rate")} help={th("ratePercent")}><input type="number" min="0" step="0.01" placeholder={tPlaceholders("ratePercent")} value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} required /></Field>
          <Field label={t("term")} help={th("termMonths")}><input type="number" min="1" placeholder={tPlaceholders("termMonths")} value={termMonths} onChange={(event) => setTermMonths(event.target.value)} required /></Field>
          <Field label={t("system")} help={th("amortization")}><select value={system} onChange={(event) => setSystem(event.target.value as typeof system)}><option value="SAC">{tAmortization("SAC")}</option><option value="PRICE">{tAmortization("PRICE")}</option></select></Field>
          <Field label={t("firstDue")} help={th("firstDue")}><input type="date" value={firstDueDate} onChange={(event) => setFirstDueDate(event.target.value)} required /></Field>
          <Field label={t("insurance")} help={th("insurance")}><MoneyInput value={insuranceCents} currency={currency} onValueChange={setInsuranceCents} /></Field>
          <Field label={t("adminFee")} help={th("adminFee")}><MoneyInput value={adminFeeCents} currency={currency} onValueChange={setAdminFeeCents} /></Field>
          <Field label={t("origination")} help={th("origination")}><MoneyInput value={originationFeeCents} currency={currency} onValueChange={setOriginationFeeCents} /></Field>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={isPending || !principalCents}>{tCommon("save")}</Button>
            <FillFormButton
              onFill={() => {
                const mock = mockFixtures.loan;
                setLender(mock.lender);
                setPrincipalCents(mock.principalCents);
                setAnnualRate(mock.annualRate);
                setTermMonths(mock.termMonths);
                setSystem(mock.system);
                setFirstDueDate(mock.firstDueDate);
                setInsuranceCents(mock.insuranceCents);
                setAdminFeeCents(mock.adminFeeCents);
                setOriginationFeeCents(mock.originationFeeCents);
              }}
            />
            <Button type="button" variant="outline" onClick={reset}>{tCommon("cancel")}</Button>
          </div>
        </form>
      )}
      {loans.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : loans.map((loan) => (
        <section key={loan.id} className="space-y-4 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{loan.lender}</h2><p className="text-sm text-muted-foreground">{tAmortization(loan.system)} · {loan.termMonths} · {(loan.annualRateBps / 100).toFixed(2)}%</p></div><Button size="icon-sm" variant="ghost" onClick={() => remove(loan.id)} disabled={isPending}><Trash2 /><span className="sr-only">{tCommon("delete")}</span></Button></div>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div className="bg-primary" style={{ width: `${(loan.installments.filter((item) => item.paidOn).length / loan.installments.length) * 100}%` }} />
          </div>
          <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th>#</th><th>{t("firstDue")}</th><th>{t("principalLabel")}</th><th>{t("interest")}</th><th>{t("fees")}</th><th>{t("total")}</th><th /></tr></thead><tbody>{loan.installments.map((item) => <tr key={item.id} className="border-t"><td className="py-2">{item.number}</td><td>{new Intl.DateTimeFormat(locale).format(new Date(item.dueDate))}</td><td><MoneyDisplay cents={item.principalCents} currency={currency} locale={locale} /></td><td><MoneyDisplay cents={item.interestCents} currency={currency} locale={locale} /></td><td><MoneyDisplay cents={item.feesCents} currency={currency} locale={locale} /></td><td><MoneyDisplay cents={item.totalCents} currency={currency} locale={locale} /></td><td><Button size="sm" variant={item.paidOn ? "outline" : "default"} onClick={() => setPaid(item)} disabled={isPending}>{item.paidOn && <Check />}{item.paidOn ? t("paid") : t("markPaid")}</Button></td></tr>)}</tbody></table></div>
          <div className="space-y-2 md:hidden">{loan.installments.map((item) => <div key={item.id} className="flex items-center justify-between border-t pt-2 text-sm"><div><p>#{item.number} · {new Intl.DateTimeFormat(locale).format(new Date(item.dueDate))}</p><p className="text-muted-foreground"><MoneyDisplay cents={item.principalCents} currency={currency} locale={locale} /> + <MoneyDisplay cents={item.interestCents} currency={currency} locale={locale} /></p></div><Button size="sm" variant={item.paidOn ? "outline" : "default"} onClick={() => setPaid(item)} disabled={isPending}>{item.paidOn ? t("paid") : t("markPaid")}</Button></div>)}</div>
        </section>
      ))}
    </div>
  );
}
