import { ContactsManager } from "@/components/contacts/contacts-manager";
import { requireUser } from "@/server/auth";
import { listContacts } from "@/server/data/contacts";

export default async function ContactsPage() {
  const user = await requireUser();
  const contacts = await listContacts(user.id);
  return <ContactsManager contacts={contacts} />;
}
