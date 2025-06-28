import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cases/[caseId]/chronologies/[chronologyId] - Get a specific chronology
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
      include: {
        _count: {
          select: {
            entries: true
          }
        }
      }
    });

    if (!chronology) {
      return NextResponse.json(
        { error: 'Chronology not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...chronology,
      entriesCount: chronology._count.entries,
      _count: undefined
    });
  } catch (error) {
    console.error('Error fetching chronology:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chronology' },
      { status: 500 }
    );
  }
}

// PUT /api/cases/[caseId]/chronologies/[chronologyId] - Update a chronology
export async function PUT(
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
    const { name, description, type } = body;

    const updated = await prisma.chronology.update({
      where: { id: chronologyId },
      data: {
        name,
        description,
        type
      },
      include: {
        _count: {
          select: {
            entries: true
          }
        }
      }
    });

    return NextResponse.json({
      ...updated,
      entriesCount: updated._count.entries,
      _count: undefined
    });
  } catch (error) {
    console.error('Error updating chronology:', error);
    return NextResponse.json(
      { error: 'Failed to update chronology' },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[caseId]/chronologies/[chronologyId] - Delete a chronology
export async function DELETE(
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

    if (chronology.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete the default chronology' },
        { status: 400 }
      );
    }

    await prisma.chronology.delete({
      where: { id: chronologyId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chronology:', error);
    return NextResponse.json(
      { error: 'Failed to delete chronology' },
      { status: 500 }
    );
  }
}