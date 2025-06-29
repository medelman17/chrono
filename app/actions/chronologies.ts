'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ChronologyInput } from '@/types/chronology';

export async function createChronology(caseId: string, data: ChronologyInput) {
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

  // If this is the first chronology for the case, make it default
  const existingChronologies = await prisma.chronology.count({
    where: { caseId }
  });

  const chronology = await prisma.chronology.create({
    data: {
      ...data,
      caseId,
      userId,
      isDefault: existingChronologies === 0
    }
  });

  revalidatePath(`/cases/${caseId}/chronologies`);
  return chronology;
}

export async function updateChronology(id: string, data: ChronologyInput) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access to the chronology
  const chronology = await prisma.chronology.findFirst({
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

  if (!chronology) {
    throw new Error('Chronology not found or access denied');
  }

  const updated = await prisma.chronology.update({
    where: { id },
    data
  });

  revalidatePath(`/cases/${chronology.caseId}/chronologies`);
  revalidatePath(`/cases/${chronology.caseId}/chronologies/${id}`);
  return updated;
}

export async function deleteChronology(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access and chronology is not default
  const chronology = await prisma.chronology.findFirst({
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

  if (!chronology) {
    throw new Error('Chronology not found or access denied');
  }

  if (chronology.isDefault) {
    throw new Error('Cannot delete the default chronology');
  }

  await prisma.chronology.delete({
    where: { id }
  });

  revalidatePath(`/cases/${chronology.caseId}/chronologies`);
  return { success: true };
}

export async function setDefaultChronology(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user has access
  const chronology = await prisma.chronology.findFirst({
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

  if (!chronology) {
    throw new Error('Chronology not found or access denied');
  }

  // Remove default from other chronologies in this case
  await prisma.chronology.updateMany({
    where: {
      caseId: chronology.caseId,
      isDefault: true
    },
    data: {
      isDefault: false
    }
  });

  // Set this chronology as default
  const updated = await prisma.chronology.update({
    where: { id },
    data: { isDefault: true }
  });

  revalidatePath(`/cases/${chronology.caseId}/chronologies`);
  return updated;
}