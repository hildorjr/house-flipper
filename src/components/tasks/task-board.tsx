"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { MoneyDisplay } from "@/components/money-display";
import { MoneyInput } from "@/components/money-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { Button } from "@/components/ui/button";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/server/actions/tasks";

const statuses = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
type Status = (typeof statuses)[number];
type Contact = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  plannedBudgetCents: number | null;
  contactId: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  contact: Contact | null;
  expenses: { amountCents: number }[];
};
type TaskBoardProps = { propertyId: string; currency: string; contacts: Contact[]; tasks: Task[] };

function dateValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function TaskBoard({ propertyId, currency, contacts, tasks }: TaskBoardProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tasks");
  const th = useTranslations("fieldHelp");
  const tCommon = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");
  const tStatus = useTranslations("taskStatus");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("TODO");
  const [plannedBudgetCents, setPlannedBudgetCents] = useState<number | null>(null);
  const [contactId, setContactId] = useState("");
  const [startDate, setStartDate] = useState(dateValue());
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setShowForm(false);
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPlannedBudgetCents(null);
    setContactId("");
    setStartDate(dateValue());
    setDueDate("");
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createTaskAction({
        propertyId,
        title,
        description: description || null,
        status,
        plannedBudgetCents,
        contactId: contactId || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      reset();
      router.refresh();
    });
  }

  function move(task: Task, next: Status) {
    startTransition(async () => {
      const result = await updateTaskAction(task.id, { status: next });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(taskId: string) {
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2"><FillFormButton onFill={() => { const mock = mockFixtures.task; setShowForm(true); setTitle(mock.title); setDescription(mock.description); setStatus(mock.status); setPlannedBudgetCents(mock.plannedBudgetCents); setStartDate(mock.startDate); setDueDate(mock.dueDate); if (contacts[0]) setContactId(contacts[0].id); }} /><Button onClick={() => setShowForm(true)} disabled={isPending}><Plus />{t("add")}</Button></div>
      {showForm && <form onSubmit={save} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <Field label={t("title")} help={th("taskTitle")}><input value={title} placeholder={tPlaceholders("taskTitle")} onChange={(event) => setTitle(event.target.value)} required /></Field>
        <Field label={tStatus(status)} help={th("taskStatus")}><select value={status} onChange={(event) => setStatus(event.target.value as Status)}>{statuses.map((value) => <option key={value} value={value}>{tStatus(value)}</option>)}</select></Field>
        <Field label={t("assignee")} help={th("assignee")}><select value={contactId} onChange={(event) => setContactId(event.target.value)}><option value="">{tCommon("none")}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></Field>
        <Field label={t("budget")} help={th("taskBudget")}><MoneyInput value={plannedBudgetCents} currency={currency} onValueChange={setPlannedBudgetCents} /></Field>
        <Field label={t("dueDate")} help={th("taskDue")}><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
        <Field label={t("startDate")} help={th("taskStart")}><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></Field>
        <Field label={t("description")} help={th("taskDescription")} className="sm:col-span-2"><textarea value={description} placeholder={tPlaceholders("taskDescription")} onChange={(event) => setDescription(event.target.value)} className="min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 dark:bg-muted/60" /></Field>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={isPending}>{tCommon("save")}</Button><FillFormButton onFill={() => { const mock = mockFixtures.task; setTitle(mock.title); setDescription(mock.description); setStatus(mock.status); setPlannedBudgetCents(mock.plannedBudgetCents); setStartDate(mock.startDate); setDueDate(mock.dueDate); if (contacts[0]) setContactId(contacts[0].id); }} /><Button type="button" variant="outline" onClick={reset}>{tCommon("cancel")}</Button></div>
      </form>}
      {tasks.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : <><div className="hidden grid-cols-4 gap-4 lg:grid">{statuses.map((current) => <section key={current} className="space-y-3 rounded-xl bg-muted/40 p-3"><h2 className="text-sm font-semibold">{tStatus(current)}</h2>{tasks.filter((task) => task.status === current).map((task) => <TaskCard key={task.id} task={task} currency={currency} locale={locale} t={t} tCommon={tCommon} tStatus={tStatus} isPending={isPending} onMove={move} onRemove={remove} />)}</section>)}</div><div className="space-y-2 lg:hidden">{tasks.map((task) => <TaskCard key={task.id} task={task} currency={currency} locale={locale} t={t} tCommon={tCommon} tStatus={tStatus} isPending={isPending} onMove={move} onRemove={remove} />)}</div></>}
    </div>
  );
}

function TaskCard({ task, currency, locale, t, tCommon, tStatus, isPending, onMove, onRemove }: { task: Task; currency: string; locale: string; t: ReturnType<typeof useTranslations>; tCommon: ReturnType<typeof useTranslations>; tStatus: ReturnType<typeof useTranslations>; isPending: boolean; onMove: (task: Task, status: Status) => void; onRemove: (taskId: string) => void }) {
  const spent = task.expenses.reduce((total, expense) => total + expense.amountCents, 0);
  const next = statuses[statuses.indexOf(task.status) + 1];
  return <article className="space-y-2 rounded-lg border bg-background p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{tStatus(task.status)}{task.contact && ` · ${task.contact.name}`}</p></div><Button size="icon-sm" variant="ghost" onClick={() => onRemove(task.id)} disabled={isPending}><Trash2 /><span className="sr-only">{tCommon("delete")}</span></Button></div>{task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}{task.plannedBudgetCents !== null && <p className="text-xs">{t("spent")}: <MoneyDisplay cents={spent} currency={currency} locale={locale} /> · {t("budget")}: <MoneyDisplay cents={task.plannedBudgetCents} currency={currency} locale={locale} /></p>}{task.dueDate && <p className="text-xs text-muted-foreground">{t("dueDate")}: {new Intl.DateTimeFormat(locale).format(new Date(task.dueDate))}</p>}{next && <Button size="sm" variant="outline" className="w-full" onClick={() => onMove(task, next)} disabled={isPending}>{tStatus(next)}<ChevronRight /></Button>}</article>;
}
