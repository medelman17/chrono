import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/cases/[caseId]/entries/[entryId] - Update an entry
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string; entryId: string }> }
) {
  try {
    const { caseId, entryId } = await params;
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

    const updatedEntry = await prisma.chronologyEntry.update({
      where: {
        id: entryId,
        caseId: caseId,
      },
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
      },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[caseId]/entries/[entryId] - Delete an entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string; entryId: string }> }
) {
  try {
    const { caseId, entryId } = await params;
    
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

    await prisma.chronologyEntry.delete({
      where: {
        id: entryId,
        caseId: caseId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}