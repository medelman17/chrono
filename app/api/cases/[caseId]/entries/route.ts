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

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}