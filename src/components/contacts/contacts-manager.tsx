"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Phone, Plus, Star, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Field, FieldLabel } from "@/components/field";
import { MaskedInput } from "@/components/masked-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import {
  createContactAction,
  deleteContactAction,
  toggleContactFavoriteAction,
  updateContactAction,
} from "@/server/actions/contacts";

const trades = [
  "MASON",
  "ELECTRICIAN",
  "PLUMBER",
  "PAINTER",
  "CARPENTER",
  "GLAZIER",
  "ROOFER",
  "ARCHITECT",
  "ENGINEER",
  "LAWYER",
  "BROKER",
  "CLEANER",
  "MOVER",
  "GENERAL",
  "OTHER",
] as const;
type Trade = (typeof trades)[number];
type Contact = {
  id: string;
  name: string;
  trade: Trade;
  companyName: string | null;
  taxId: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  isFavorite: boolean;
  notes: string | null;
};
type ContactInput = Omit<Contact, "id">;

const emptyContact: ContactInput = {
  name: "",
  trade: "GENERAL",
  companyName: null,
  taxId: null,
  phone: null,
  whatsapp: null,
  email: null,
  city: null,
  state: null,
  rating: null,
  isFavorite: false,
  notes: null,
};

export function ContactsManager({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const t = useTranslations("contacts");
  const th = useTranslations("fieldHelp");
  const tCommon = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");
  const tTrade = useTranslations("tradeType");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [input, setInput] = useState<ContactInput>(emptyContact);
  const [tradeFilter, setTradeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cities = [
    ...new Set(contacts.map((contact) => contact.city).filter(Boolean)),
  ] as string[];
  const filtered = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          (!tradeFilter || contact.trade === tradeFilter) &&
          (!cityFilter || contact.city === cityFilter) &&
          (!favoritesOnly || contact.isFavorite),
      ),
    [contacts, tradeFilter, cityFilter, favoritesOnly],
  );

  function open(contact?: Contact) {
    setEditing(contact ?? null);
    setInput(contact ? { ...contact } : emptyContact);
    setShowForm(true);
  }

  function update<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = editing
        ? await updateContactAction(editing.id, input)
        : await createContactAction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setShowForm(false);
      router.refresh();
    });
  }

  function remove(contactId: string) {
    startTransition(async () => {
      const result = await deleteContactAction(contactId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function toggleFavorite(contactId: string) {
    startTransition(async () => {
      const result = await toggleContactFavoriteAction(contactId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            <FillFormButton
              onFill={() => {
                setEditing(null);
                setInput({ ...mockFixtures.contact });
                setShowForm(true);
              }}
            />
            <Button className="rounded-xl" onClick={() => open()}>
              <Plus />
              {t("add")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={tradeFilter}
          onChange={(event) => setTradeFilter(event.target.value)}
          className="h-9 rounded-full border border-input bg-card px-3 text-sm dark:bg-muted/60"
        >
          <option value="">{tCommon("all")}</option>
          {trades.map((trade) => (
            <option key={trade} value={trade}>
              {tTrade(trade)}
            </option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
          className="h-9 rounded-full border border-input bg-card px-3 text-sm dark:bg-muted/60"
        >
          <option value="">{tCommon("all")}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant={favoritesOnly ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setFavoritesOnly((value) => !value)}
        >
          <Star fill={favoritesOnly ? "currentColor" : "none"} />
          {t("favorites")}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={save}
          className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2"
        >
          <Field label={t("name")} help={th("contactName")}>
            <input
              value={input.name}
              placeholder={tPlaceholders("contactName")}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </Field>
          <Field label={t("trade")} help={th("trade")}>
            <select
              value={input.trade}
              onChange={(event) => update("trade", event.target.value as Trade)}
            >
              {trades.map((trade) => (
                <option key={trade} value={trade}>
                  {tTrade(trade)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("company")} help={th("company")}>
            <input
              value={input.companyName ?? ""}
              placeholder={tPlaceholders("company")}
              onChange={(event) =>
                update("companyName", event.target.value || null)
              }
            />
          </Field>
          <Field label={t("taxId")} help={th("taxId")}>
            <MaskedInput
              mask="cpfCnpj"
              inputMode="numeric"
              placeholder={tPlaceholders("taxId")}
              value={input.taxId ?? ""}
              onValueChange={(value) => update("taxId", value || null)}
            />
          </Field>
          <Field label={t("phone")} help={th("phone")}>
            <MaskedInput
              mask="phone"
              type="tel"
              inputMode="tel"
              placeholder={tPlaceholders("phone")}
              value={input.phone ?? ""}
              onValueChange={(value) => update("phone", value || null)}
            />
          </Field>
          <Field label={t("whatsapp")} help={th("whatsapp")}>
            <MaskedInput
              mask="phone"
              type="tel"
              inputMode="tel"
              placeholder={tPlaceholders("phone")}
              value={input.whatsapp ?? ""}
              onValueChange={(value) => update("whatsapp", value || null)}
            />
          </Field>
          <Field label={t("email")} help={th("contactEmail")}>
            <input
              type="email"
              value={input.email ?? ""}
              placeholder={tPlaceholders("email")}
              onChange={(event) => update("email", event.target.value || null)}
            />
          </Field>
          <Field label={t("city")} help={th("contactCity")}>
            <input
              value={input.city ?? ""}
              placeholder={tPlaceholders("city")}
              onChange={(event) => update("city", event.target.value || null)}
            />
          </Field>
          <Field label={t("state")} help={th("contactState")}>
            <MaskedInput
              mask="uf"
              placeholder={tPlaceholders("state")}
              value={input.state ?? ""}
              onValueChange={(value) => update("state", value || null)}
            />
          </Field>
          <Field label={t("rating")} help={th("rating")}>
            <select
              value={input.rating ?? ""}
              onChange={(event) =>
                update(
                  "rating",
                  event.target.value ? Number(event.target.value) : null,
                )
              }
            >
              <option value="">{tCommon("none")}</option>
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <FieldLabel label={t("favorite")} help={th("favorite")} />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={input.isFavorite}
                onChange={(event) => update("isFavorite", event.target.checked)}
              />
              {t("favorite")}
            </label>
          </div>
          <Field
            label={t("notes")}
            help={th("contactNotes")}
            className="sm:col-span-2"
          >
            <textarea
              value={input.notes ?? ""}
              placeholder={tPlaceholders("notes")}
              onChange={(event) => update("notes", event.target.value || null)}
              className="min-h-20 rounded-xl border border-input bg-card px-3 py-2 dark:bg-muted/60"
            />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" className="rounded-xl" disabled={isPending}>
              {tCommon("save")}
            </Button>
            <FillFormButton
              onFill={() => setInput({ ...mockFixtures.contact })}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowForm(false)}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          icon={<Users className="size-6" />}
          action={
            <Button className="rounded-xl" onClick={() => open()}>
              <Plus />
              {t("add")}
            </Button>
          }
        />
      ) : (
        <div className="divide-y rounded-2xl border bg-card shadow-sm">
          {filtered.map((contact) => (
            <article
              key={contact.id}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <button
                type="button"
                aria-label={t("favorite")}
                onClick={() => toggleFavorite(contact.id)}
                disabled={isPending}
                className="text-muted-foreground hover:text-amber-500"
              >
                <Star
                  fill={contact.isFavorite ? "currentColor" : "none"}
                  className={contact.isFavorite ? "text-amber-500" : ""}
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{contact.name}</p>
                  {contact.rating && (
                    <span className="text-sm text-amber-500">
                      {"★".repeat(contact.rating)}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {tTrade(contact.trade)}
                  {contact.companyName && ` · ${contact.companyName}`}
                  {contact.city && ` · ${contact.city}`}
                </p>
              </div>
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  aria-label={t("call")}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                  <Phone className="size-4" />
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("message")}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  WA
                </a>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => open(contact)}
                disabled={isPending}
              >
                <Pencil />
                <span className="sr-only">{tCommon("edit")}</span>
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => remove(contact.id)}
                disabled={isPending}
              >
                <Trash2 />
                <span className="sr-only">{tCommon("delete")}</span>
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
