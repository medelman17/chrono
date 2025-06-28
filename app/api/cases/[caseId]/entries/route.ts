import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cases/[caseId]/entries - Get all entries for a case
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user has access to this case
    const case_ = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId: user.id,
      },
    });

    if (!case_) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const entries = await prisma.chronologyEntry.findMany({
      where: {
        caseId: caseId,
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
      orderBy: {
        date: 'asc',
      },
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

// POST /api/cases/[caseId]/entries - Create a new entry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await req.json();
    
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user has access to this case
    const case_ = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId: user.id,
      },
    });

    if (!case_) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Convert date string to DateTime
    const entryDate = new Date(body.date);
    
    const newEntry = await prisma.chronologyEntry.create({
      data: {
        date: entryDate,
        time: body.time || null,
        parties: body.parties,
        title: body.title,
        summary: body.summary,
        source: body.source || null,
        category: body.category,
        legalSignificance: body.legalSignificance || null,
        relatedEntries: body.relatedEntries || null,
        caseId: caseId,
        userId: user.id,
      },
    });

    // Link documents to the entry if document IDs were provided
    if (body.documentIds && body.documentIds.length > 0) {
      await prisma.document.updateMany({
        where: {
          id: { in: body.documentIds },
          caseId: caseId, // Ensure documents belong to the same case
        },
        data: {
          entryId: newEntry.id,
        },
      });
    }

    // Fetch the entry with documents included
    const entryWithDocuments = await prisma.chronologyEntry.findUnique({
      where: { id: newEntry.id },
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

    return NextResponse.json(entryWithDocuments, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}