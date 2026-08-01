import { notFound } from "next/navigation";
import { TaskBoard } from "@/components/tasks/task-board";
import { requireUser } from "@/server/auth";
import { listContacts } from "@/server/data/contacts";
import { getProperty } from "@/server/data/properties";
import { listTasks } from "@/server/data/tasks";

type TasksPageProps = {
  params: Promise<{ propertyId: string }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const { propertyId } = await params;
  const user = await requireUser();
  const [property, tasks, contacts] = await Promise.all([
    getProperty(user.id, propertyId),
    listTasks(user.id, { propertyId }),
    listContacts(user.id),
  ]);
  if (!property) notFound();

  return (
    <TaskBoard
      propertyId={propertyId}
      currency={property.currency}
      contacts={contacts.map(({ id, name }) => ({ id, name }))}
      tasks={tasks}
    />
  );
}
