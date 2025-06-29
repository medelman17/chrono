import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cases/[caseId]/chronologies - Get all chronologies for a case
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
        OR: [
          { userId: user.id },
          { shares: { some: { userId: user.id } } }
        ]
      },
    });

    if (!case_) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const chronologies = await prisma.chronology.findMany({
      where: {
        caseId: caseId,
      },
      include: {
        _count: {
          select: {
            entries: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    // Transform to include entriesCount
    const chronologiesWithCount = chronologies.map(chronology => ({
      ...chronology,
      entriesCount: chronology._count.entries,
      _count: undefined
    }));

    return NextResponse.json(chronologiesWithCount);
  } catch (error) {
    console.error('Error fetching chronologies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chronologies' },
      { status: 500 }
    );
  }
}

// POST /api/cases/[caseId]/chronologies - Create a new chronology
export async function POST(
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
        OR: [
          { userId: user.id },
          { shares: { some: { userId: user.id } } }
        ]
      },
    });

    if (!case_) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, description, type } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if this is the first chronology for the case
    const existingCount = await prisma.chronology.count({
      where: { caseId }
    });

    const chronology = await prisma.chronology.create({
      data: {
        name,
        description,
        type,
        caseId,
        userId: user.id,
        isDefault: existingCount === 0
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
      ...chronology,
      entriesCount: chronology._count.entries,
      _count: undefined
    });
  } catch (error) {
    console.error('Error creating chronology:', error);
    return NextResponse.json(
      { error: 'Failed to create chronology' },
      { status: 500 }
    );
  }
}