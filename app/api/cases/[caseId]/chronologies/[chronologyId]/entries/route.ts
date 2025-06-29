import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cases/[caseId]/chronologies/[chronologyId]/entries - Get entries for a chronology
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string; chronologyId: string }> }
) {
  try {
    const { caseId, chronologyId } = await params;
    
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify access to chronology
    const chronology = await prisma.chronology.findFirst({
      where: {
        id: chronologyId,
        caseId: caseId,
        case: {
          OR: [
            { userId: user.id },
            { shares: { some: { userId: user.id } } }
          ]
        }
      },
    });

    if (!chronology) {
      return NextResponse.json(
        { error: 'Chronology not found' },
        { status: 404 }
      );
    }

    const entries = await prisma.chronologyEntry.findMany({
      where: {
        chronologyId: chronologyId,
      },
      include: {
        documents: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            fileSize: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST /api/cases/[caseId]/chronologies/[chronologyId]/entries - Create a new entry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string; chronologyId: string }> }
) {
  try {
    const { caseId, chronologyId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify access to chronology
    const chronology = await prisma.chronology.findFirst({
      where: {
        id: chronologyId,
        caseId: caseId,
        case: {
          OR: [
            { userId: user.id },
            { shares: { some: { userId: user.id } } }
          ]
        }
      },
    });

    if (!chronology) {
      return NextResponse.json(
        { error: 'Chronology not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { documentIds, ...entryData } = body;

    // Create the entry
    const entry = await prisma.chronologyEntry.create({
      data: {
        ...entryData,
        date: new Date(entryData.date),
        chronologyId,
        caseId,
        userId: user.id,
      },
      include: {
        documents: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            fileSize: true,
          },
        },
      },
    });

    // If documentIds are provided, link them to the entry
    if (documentIds && documentIds.length > 0) {
      await prisma.document.updateMany({
        where: {
          id: { in: documentIds },
          caseId: caseId,
        },
        data: {
          entryId: entry.id,
        },
      });

      // Fetch the updated entry with documents
      const updatedEntry = await prisma.chronologyEntry.findUnique({
        where: { id: entry.id },
        include: {
          documents: {
            select: {
              id: true,
              filename: true,
              fileType: true,
              fileSize: true,
            },
          },
        },
      });

      return NextResponse.json(updatedEntry);
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}