'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PartyInput } from '@/types/chronology';

export async function createParty(caseId: string, data: PartyInput) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the case
  const caseAccess = await prisma.case.findFirst({
    where: {
      id: caseId,
      OR: [
        { userId },
        { shares: { some: { userId } } }
      ]
    }
  });

  if (!caseAccess) {
    throw new Error('Case not found or access denied');
  }

  const party = await prisma.party.create({
    data: {
      ...data,
      caseId
    }
  });

  revalidatePath(`/dashboard/cases/${caseId}`);
  return {
    ...party,
    createdAt: party.createdAt.toISOString(),
    updatedAt: party.updatedAt.toISOString()
  };
}

export async function updateParty(id: string, data: PartyInput) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the party's case
  const party = await prisma.party.findFirst({
    where: {
      id,
      case: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    }
  });

  if (!party) {
    throw new Error('Party not found or access denied');
  }

  const updated = await prisma.party.update({
    where: { id },
    data
  });

  revalidatePath(`/dashboard/cases/${party.caseId}`);
  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString()
  };
}

export async function deleteParty(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the party's case
  const party = await prisma.party.findFirst({
    where: {
      id,
      case: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    }
  });

  if (!party) {
    throw new Error('Party not found or access denied');
  }

  await prisma.party.delete({
    where: { id }
  });

  revalidatePath(`/dashboard/cases/${party.caseId}`);
  return { success: true };
}

export async function getPartiesForCase(caseId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the case
  const caseAccess = await prisma.case.findFirst({
    where: {
      id: caseId,
      OR: [
        { userId },
        { shares: { some: { userId } } }
      ]
    }
  });

  if (!caseAccess) {
    throw new Error('Case not found or access denied');
  }

  const parties = await prisma.party.findMany({
    where: { caseId },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' }
    ]
  });

  return parties;
}