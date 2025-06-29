'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ChronologyFormData } from '@/types/chronology';

export async function createEntry(chronologyId: string, data: ChronologyFormData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the chronology
  const chronology = await prisma.chronology.findFirst({
    where: {
      id: chronologyId,
      case: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    }
  });

  if (!chronology) {
    throw new Error('Chronology not found or access denied');
  }

  const entry = await prisma.chronologyEntry.create({
    data: {
      ...data,
      date: new Date(data.date),
      chronologyId,
      caseId: chronology.caseId,
      userId
    }
  });

  revalidatePath(`/cases/${chronology.caseId}/chronologies/${chronologyId}`);
  return entry;
}

export async function updateEntry(id: string, data: ChronologyFormData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the entry
  const entry = await prisma.chronologyEntry.findFirst({
    where: {
      id,
      case: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    },
    include: {
      chronology: true
    }
  });

  if (!entry) {
    throw new Error('Entry not found or access denied');
  }

  const updated = await prisma.chronologyEntry.update({
    where: { id },
    data: {
      ...data,
      date: new Date(data.date)
    }
  });

  if (entry.chronology) {
    revalidatePath(`/cases/${entry.caseId}/chronologies/${entry.chronologyId}`);
  }
  return updated;
}

export async function deleteEntry(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the entry
  const entry = await prisma.chronologyEntry.findFirst({
    where: {
      id,
      case: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    },
    include: {
      chronology: true
    }
  });

  if (!entry) {
    throw new Error('Entry not found or access denied');
  }

  await prisma.chronologyEntry.delete({
    where: { id }
  });

  if (entry.chronology) {
    revalidatePath(`/cases/${entry.caseId}/chronologies/${entry.chronologyId}`);
  }
  return { success: true };
}

export async function bulkCreateEntries(chronologyId: string, entries: ChronologyFormData[]) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the chronology
  const chronology = await prisma.chronology.findFirst({
    where: {
      id: chronologyId,
      case: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      }
    }
  });

  if (!chronology) {
    throw new Error('Chronology not found or access denied');
  }

  const createdEntries = await prisma.chronologyEntry.createMany({
    data: entries.map(entry => ({
      ...entry,
      date: new Date(entry.date),
      chronologyId,
      caseId: chronology.caseId,
      userId
    }))
  });

  revalidatePath(`/cases/${chronology.caseId}/chronologies/${chronologyId}`);
  return createdEntries;
}