/**
 * Migration script to create default chronologies for existing cases
 * and associate existing entries with them
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration to chronologies...');

  try {
    // Get all cases that have entries
    const casesWithEntries = await prisma.case.findMany({
      where: {
        entries: {
          some: {}
        }
      },
      include: {
        entries: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    console.log(`Found ${casesWithEntries.length} cases with entries to migrate`);

    for (const caseItem of casesWithEntries) {
      console.log(`Processing case: ${caseItem.name} (${caseItem.id})`);

      // Create a default chronology for this case
      const defaultChronology = await prisma.chronology.create({
        data: {
          name: 'Main Chronology',
          description: 'Default chronology migrated from existing entries',
          type: 'general',
          caseId: caseItem.id,
          userId: caseItem.userId,
          isDefault: true
        }
      });

      console.log(`Created default chronology: ${defaultChronology.id}`);

      // Update all entries for this case to belong to the default chronology
      const updateResult = await prisma.chronologyEntry.updateMany({
        where: {
          caseId: caseItem.id,
          chronologyId: null
        },
        data: {
          chronologyId: defaultChronology.id
        }
      });

      console.log(`Updated ${updateResult.count} entries for case ${caseItem.name}`);
    }

    // Verify migration
    const entriesWithoutChronology = await prisma.chronologyEntry.count({
      where: {
        chronologyId: null
      }
    });

    if (entriesWithoutChronology > 0) {
      console.warn(`Warning: ${entriesWithoutChronology} entries still don't have a chronology`);
    } else {
      console.log('✓ All entries have been successfully migrated to chronologies');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();