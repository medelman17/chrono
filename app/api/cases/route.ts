import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cases - Get all cases for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    console.log('GET /api/cases - Current user:', user);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cases = await prisma.case.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, keyParties, caseContext, instructions } = body;

    const newCase = await prisma.case.create({
      data: {
        name,
        description,
        keyParties,
        context: caseContext,
        instructions,
        userId: user.id,
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}