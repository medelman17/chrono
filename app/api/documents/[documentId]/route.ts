import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient, STORAGE_BUCKETS } from '@/lib/supabase-server';

// GET /api/documents/[documentId] - Get document details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document with case info to verify access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        case: {
          userId: user.id,
        },
      },
      include: {
        case: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient();

    // Get a temporary signed URL for secure download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .createSignedUrl(document.storageKey!, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize,
      content: document.content,
      metadata: document.metadata,
      caseId: document.caseId,
      caseName: document.case.name,
      uploadedAt: document.createdAt,
      downloadUrl: signedUrlData.signedUrl,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[documentId] - Delete a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document to verify access and get storage key
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        case: {
          userId: user.id,
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient();

    // Delete from Supabase Storage
    if (document.storageKey) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .remove([document.storageKey]);

      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}