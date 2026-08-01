"use client";

import { useRef, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { FormSection, FormSectionGroup } from "@/components/form-section";
import { MaskedInput } from "@/components/masked-input";
import { MoneyInput } from "@/components/money-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { PercentInput } from "@/components/percent-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  isPostalCodeComplete,
  lookupAddress,
} from "@/lib/address-lookup";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import {
  createPropertyAction,
  updatePropertyAction,
} from "@/server/actions/properties";
import {
  propertyInputSchema,
  type PropertyInput,
} from "@/lib/validators/property";
import { useRouter } from "@/i18n/navigation";

type PropertyFormProps = {
  propertyId?: string;
  initialValues?: Partial<PropertyInput>;
  readOnly?: boolean;
};

const statusValues = [
  "PROSPECT",
  "UNDER_CONTRACT",
  "OWNED_RENOVATING",
  "LISTED",
  "SOLD",
  "ARCHIVED",
] as const;
const typeValues = ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"] as const;
const channelValues = [
  "JUDICIAL_AUCTION",
  "EXTRAJUDICIAL_AUCTION",
  "BANK_DIRECT_SALE",
  "PRIVATE_SALE",
  "INHERITANCE",
  "OTHER",
] as const;

const defaultValues: PropertyInput = {
  label: "",
  type: "HOUSE",
  status: "PROSPECT",
  acquisitionChannel: "JUDICIAL_AUCTION",
  currency: "BRL",
  street: null,
  number: null,
  complement: null,
  district: null,
  city: null,
  state: null,
  postalCode: null,
  country: "BR",
  areaTotalM2: null,
  areaBuiltM2: null,
  bedrooms: null,
  bathrooms: null,
  parkingSpots: null,
  yearBuilt: null,
  purchasePriceCents: null,
  purchaseDate: null,
  appraisedValueCents: null,
  marketValueCents: null,
  targetSalePriceCents: null,
  itbiRateBps: null,
  auctionCommissionBps: null,
  soldPriceCents: null,
  soldDate: null,
  brokerCommissionBps: null,
  capitalGainsRateBps: null,
  notes: null,
};

export function PropertyForm({
  propertyId,
  initialValues,
  readOnly = false,
}: PropertyFormProps) {
  const t = useTranslations("properties");
  const tCommon = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");
  const th = useTranslations("fieldHelp");
  const tStatus = useTranslations("propertyStatus");
  const tType = useTranslations("propertyType");
  const tChannel = useTranslations("acquisitionChannel");
  const tSale = useTranslations("sale");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLookingUpAddress, setIsLookingUpAddress] = useState(false);
  const lastPostalLookup = useRef("");
  const addressLookupInFlight = useRef(false);
  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertyInputSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const country = useWatch({ control: form.control, name: "country" }) ?? "BR";

  const values = { ...defaultValues, ...initialValues };
  const hasAddress = Boolean(
    values.street || values.city || values.district || values.postalCode,
  );
  const hasSpecs = Boolean(
    values.areaTotalM2 ||
      values.areaBuiltM2 ||
      values.bedrooms ||
      values.bathrooms ||
      values.parkingSpots ||
      values.yearBuilt,
  );
  const hasDeal = Boolean(
    values.purchasePriceCents ||
      values.appraisedValueCents ||
      values.marketValueCents ||
      values.targetSalePriceCents,
  );
  const hasSale = Boolean(
    values.soldPriceCents ||
      values.brokerCommissionBps ||
      values.capitalGainsRateBps,
  );

  const submit = form.handleSubmit((formValues) => {
    startTransition(async () => {
      if (propertyId) {
        const result = await updatePropertyAction(propertyId, formValues);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(tCommon("success"));
        router.refresh();
        return;
      }

      const result = await createPropertyAction(formValues);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(tCommon("success"));
      router.push(`/properties/${result.data.id}`);
    });
  });

  async function fillAddressFromPostal(postalCode: string, nextCountry = country) {
    if (readOnly || !isPostalCodeComplete(nextCountry, postalCode)) return;

    const lookupKey = `${nextCountry}:${postalCode}`;
    if (lookupKey === lastPostalLookup.current || addressLookupInFlight.current) {
      return;
    }

    lastPostalLookup.current = lookupKey;
    addressLookupInFlight.current = true;
    setIsLookingUpAddress(true);
    try {
      const result = await lookupAddress(nextCountry, postalCode);
      if (!result) {
        toast.error(t("postalNotFound"));
        return;
      }

      if (result.country === "BR") {
        form.setValue("street", result.street, { shouldDirty: true });
        form.setValue("complement", result.complement, { shouldDirty: true });
        form.setValue("district", result.district, { shouldDirty: true });
      }
      form.setValue("city", result.city, { shouldDirty: true });
      form.setValue("state", result.state, { shouldDirty: true });
      if (result.postalCode) {
        form.setValue("postalCode", result.postalCode, { shouldDirty: true });
      }
    } catch {
      toast.error(t("postalLookupFailed"));
      lastPostalLookup.current = "";
    } finally {
      addressLookupInFlight.current = false;
      setIsLookingUpAddress(false);
    }
  }

  const numberField = (
    name:
      | "areaTotalM2"
      | "areaBuiltM2"
      | "bedrooms"
      | "bathrooms"
      | "parkingSpots"
      | "yearBuilt",
    label: string,
    help: string,
    placeholder?: string,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field label={label} help={help} error={form.formState.errors[name]?.message}>
          <Input
            type="number"
            disabled={readOnly}
            placeholder={placeholder}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
          />
        </Field>
      )}
    />
  );

  const percentField = (
    name:
      | "itbiRateBps"
      | "auctionCommissionBps"
      | "brokerCommissionBps"
      | "capitalGainsRateBps",
    label: string,
    help: string,
    placeholder?: string,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field label={label} help={help} error={form.formState.errors[name]?.message}>
          <PercentInput
            disabled={readOnly}
            placeholder={placeholder}
            valueBps={field.value ?? null}
            onBlur={field.onBlur}
            onValueChange={field.onChange}
          />
        </Field>
      )}
    />
  );

  const moneyField = (
    name:
      | "purchasePriceCents"
      | "appraisedValueCents"
      | "marketValueCents"
      | "targetSalePriceCents"
      | "soldPriceCents",
    label: string,
    help: string,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field label={label} help={help} error={form.formState.errors[name]?.message}>
          <MoneyInput
            disabled={readOnly}
            value={field.value ?? null}
            onBlur={field.onBlur}
            onValueChange={field.onChange}
          />
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={submit}>
      <FormSectionGroup>
      <FormSection
        title={t("sectionBasics")}
        description={t("sectionBasicsHint")}
        defaultOpen
        columns={1}
      >
        <Field
          label={t("label")}
          help={th("propertyLabel")}
          error={form.formState.errors.label?.message}
        >
          <Input
            disabled={readOnly}
            placeholder={tPlaceholders("propertyLabel")}
            {...form.register("label")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Field label={t("type")} help={th("propertyType")}>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={readOnly}
                  items={Object.fromEntries(
                    typeValues.map((value) => [value, tType(value)]),
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {tType(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Field label={t("status")} help={th("propertyStatus")}>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={readOnly}
                  items={Object.fromEntries(
                    statusValues.map((value) => [value, tStatus(value)]),
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {tStatus(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="acquisitionChannel"
          render={({ field }) => (
            <Field label={t("channel")} help={th("channel")}>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={readOnly}
                items={Object.fromEntries(
                  channelValues.map((value) => [value, tChannel(value)]),
                )}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channelValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tChannel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </FormSection>

      <FormSection
        title={t("sectionDeal")}
        description={t("sectionDealHint")}
        defaultOpen={!propertyId || hasDeal}
      >
        {moneyField("purchasePriceCents", t("purchasePrice"), th("purchasePrice"))}
        <Field label={t("purchaseDate")} help={th("purchaseDate")}>
          <Input
            type="date"
            disabled={readOnly}
            {...form.register("purchaseDate")}
          />
        </Field>
        {moneyField("targetSalePriceCents", t("targetSale"), th("targetSale"))}
        {moneyField("appraisedValueCents", t("appraisedValue"), th("appraisedValue"))}
        {moneyField("marketValueCents", t("marketValue"), th("marketValue"))}
        {percentField("itbiRateBps", t("itbiRate"), th("itbiRate"), tPlaceholders("percent"))}
        {percentField(
          "auctionCommissionBps",
          t("auctionCommission"),
          th("auctionCommission"),
          tPlaceholders("auctionPercent"),
        )}
      </FormSection>

      <FormSection
        title={t("sectionAddress")}
        description={t("sectionAddressHint")}
        defaultOpen={hasAddress}
      >
        <Controller
          control={form.control}
          name="country"
          render={({ field }) => (
            <Field label={t("country")} help={th("country")}>
              <Select
                disabled={readOnly}
                value={field.value}
                onValueChange={(value) => {
                  const next = value ?? "BR";
                  field.onChange(next);
                  lastPostalLookup.current = "";
                  form.setValue("postalCode", null);
                }}
                items={{
                  BR: t("countryBR"),
                  US: t("countryUS"),
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">{t("countryBR")}</SelectItem>
                  <SelectItem value="US">{t("countryUS")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <Field
              label={country === "US" ? t("zip") : t("cep")}
              help={country === "US" ? th("zip") : th("cep")}
            >
              <MaskedInput
                mask={country === "US" ? "zip" : "cep"}
                disabled={readOnly || isLookingUpAddress}
                inputMode="numeric"
                placeholder={
                  country === "US"
                    ? tPlaceholders("zip")
                    : tPlaceholders("postalCode")
                }
                value={field.value ?? ""}
                onValueChange={(value) => {
                  const next = value || null;
                  field.onChange(next);
                  if (next && isPostalCodeComplete(country, next)) {
                    void fillAddressFromPostal(next);
                  }
                }}
                onBlur={() => {
                  field.onBlur();
                  if (field.value) void fillAddressFromPostal(field.value);
                }}
              />
            </Field>
          )}
        />
        <Field label={t("street")} help={th("street")} className="sm:col-span-2">
          <Input
            disabled={readOnly || isLookingUpAddress}
            placeholder={tPlaceholders("street")}
            {...form.register("street")}
          />
        </Field>
        <Field label={t("number")} help={th("number")}>
          <Input
            disabled={readOnly}
            placeholder={tPlaceholders("number")}
            {...form.register("number")}
          />
        </Field>
        <Field label={t("complement")} help={th("complement")}>
          <Input
            disabled={readOnly || isLookingUpAddress}
            placeholder={tPlaceholders("complement")}
            {...form.register("complement")}
          />
        </Field>
        <Field label={t("district")} help={th("district")}>
          <Input
            disabled={readOnly || isLookingUpAddress}
            placeholder={tPlaceholders("district")}
            {...form.register("district")}
          />
        </Field>
        <Field label={t("city")} help={th("city")}>
          <Input
            disabled={readOnly || isLookingUpAddress}
            placeholder={tPlaceholders("city")}
            {...form.register("city")}
          />
        </Field>
        <Controller
          control={form.control}
          name="state"
          render={({ field }) => (
            <Field label={t("state")} help={th("state")}>
              <MaskedInput
                mask="uf"
                disabled={readOnly || isLookingUpAddress}
                placeholder={tPlaceholders("state")}
                value={field.value ?? ""}
                onValueChange={(value) => field.onChange(value || null)}
                onBlur={field.onBlur}
              />
            </Field>
          )}
        />
      </FormSection>

      <FormSection
        title={t("sectionSpecs")}
        description={t("sectionSpecsHint")}
        defaultOpen={hasSpecs}
      >
        {numberField("areaTotalM2", t("areaTotal"), th("areaTotal"), tPlaceholders("area"))}
        {numberField("areaBuiltM2", t("areaBuilt"), th("areaBuilt"), tPlaceholders("area"))}
        {numberField("bedrooms", t("bedrooms"), th("bedrooms"), tPlaceholders("rooms"))}
        {numberField("bathrooms", t("bathrooms"), th("bathrooms"), tPlaceholders("rooms"))}
        {numberField("parkingSpots", t("parking"), th("parking"), tPlaceholders("rooms"))}
        {numberField("yearBuilt", t("yearBuilt"), th("yearBuilt"), tPlaceholders("yearBuilt"))}
      </FormSection>

      <FormSection
        title={t("sectionSaleDefaults")}
        description={t("sectionSaleDefaultsHint")}
        defaultOpen={hasSale}
      >
        {moneyField("soldPriceCents", tSale("soldPrice"), th("soldPrice"))}
        <Field label={tSale("soldDate")} help={th("soldDate")}>
          <Input
            type="date"
            disabled={readOnly}
            {...form.register("soldDate")}
          />
        </Field>
        {percentField(
          "brokerCommissionBps",
          tSale("brokerCommission"),
          th("brokerCommission"),
          tPlaceholders("brokerPercent"),
        )}
        {percentField(
          "capitalGainsRateBps",
          tSale("capitalGainsRate"),
          th("capitalGains"),
          tPlaceholders("capitalGainsPercent"),
        )}
      </FormSection>

      <FormSection title={t("sectionNotes")} defaultOpen={Boolean(values.notes)} columns={1}>
        <Field label={t("notes")} help={th("notes")}>
          <Textarea
            disabled={readOnly}
            rows={3}
            placeholder={tPlaceholders("notes")}
            {...form.register("notes")}
          />
        </Field>
      </FormSection>
      </FormSectionGroup>

      {!readOnly && (
        <div className="sticky bottom-20 z-10 mt-3 flex animate-in fade-in slide-in-from-bottom-2 flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur duration-300 md:bottom-4">
          <Button type="submit" className="w-full min-h-11 rounded-xl sm:w-auto" disabled={isPending}>
            {propertyId ? tCommon("save") : tCommon("create")}
          </Button>
          <FillFormButton
            onFill={() => {
              lastPostalLookup.current = "";
              form.reset({ ...defaultValues, ...initialValues, ...mockFixtures.property });
            }}
          />
        </div>
      )}
    </form>
  );
}
