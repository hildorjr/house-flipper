import { prisma } from "@/lib/prisma";
import type { Prisma, TradeType } from "@/generated/prisma/client";

export type ContactFilters = {
  trade?: TradeType;
  city?: string;
  favorites?: boolean;
};

type ContactCreateData = Omit<
  Prisma.ContactUncheckedCreateInput,
  "id" | "ownerId"
>;
type ContactUpdateData = Omit<
  Prisma.ContactUncheckedUpdateInput,
  "id" | "ownerId"
>;

export async function listContacts(userId: string, filters: ContactFilters = {}) {
  return prisma.contact.findMany({
    where: {
      ownerId: userId,
      trade: filters.trade,
      city: filters.city,
      isFavorite: filters.favorites,
    },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
  });
}

export async function getContact(userId: string, contactId: string) {
  return prisma.contact.findFirst({ where: { id: contactId, ownerId: userId } });
}

export async function createContact(userId: string, data: ContactCreateData) {
  return prisma.contact.create({ data: { ...data, ownerId: userId } });
}

export async function updateContact(
  userId: string,
  contactId: string,
  data: ContactUpdateData,
) {
  const contact = await getContact(userId, contactId);
  if (!contact) throw new Error("CONTACT_NOT_FOUND");
  return prisma.contact.update({ where: { id: contactId }, data });
}

export async function deleteContact(userId: string, contactId: string) {
  const contact = await getContact(userId, contactId);
  if (!contact) throw new Error("CONTACT_NOT_FOUND");
  return prisma.contact.delete({ where: { id: contactId } });
}
