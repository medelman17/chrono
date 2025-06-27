import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient, STORAGE_BUCKETS } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import mammoth from 'mammoth';
import { LlamaParse } from 'llama-parse';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

async function parseFileContent(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop() || '';

  try {
    // Check if we should use LlamaParse for this file type
    const llamaParseTypes = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp'];
    if (llamaParseTypes.includes(ext) && process.env.LLAMA_CLOUD_API_KEY) {
      try {
        const parser = new LlamaParse({
          apiKey: process.env.LLAMA_CLOUD_API_KEY,
        });

        // Create a Blob from the buffer
        const blob = new Blob([buffer], { type: mimeType });
        
        // Parse the document
        const result = await parser.parseFile(blob);
        
        // Extract text from the result
        if (result && result.markdown) {
          return result.markdown;
        } else {
          throw new Error('No text extracted from document');
        }
      } catch (llamaError) {
        console.error(`LlamaParse error for ${filename}:`, llamaError);
        // Fall back to error message
        if (ext === 'pdf') {
          return `[PDF Processing Error] Unable to process PDF: ${filename}. Please copy and paste the content manually.`;
        } else {
          return `[Image Processing Error] Unable to process image: ${filename}. Please describe the content manually.`;
        }
      }
    }

    // Handle other file types
    switch (ext) {
      case 'doc':
      case 'docx':
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;

      case 'txt':
      case 'eml':
        return buffer.toString('utf-8');

      default:
        return `[Unsupported File Type] Unable to process ${ext} file: ${filename}`;
    }
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
    return `[Processing Error] Unable to process file: ${filename}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client for this request
    const supabase = createServerSupabaseClient();

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!caseId) {
      return NextResponse.json(
        { error: 'No case ID provided' },
        { status: 400 }
      );
    }

    // Verify user has access to this case
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId: user.id,
      },
    });

    if (!caseRecord) {
      return NextResponse.json(
        { error: 'Case not found or access denied' },
        { status: 404 }
      );
    }

    // Check file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text content for analysis
    const textContent = await parseFileContent(buffer, file.name, file.type);

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${caseId}/${timestamp}-${safeName}`;

    // Debug: List buckets to verify connection
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets);
    console.log('List error:', listError);
    console.log('Trying to upload to bucket:', STORAGE_BUCKETS.DOCUMENTS);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      console.error('Bucket name:', STORAGE_BUCKETS.DOCUMENTS);
      console.error('File path:', filePath);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .getPublicUrl(filePath);

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageKey: filePath,
        content: textContent,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          publicUrl,
        },
        caseId: caseId,
        uploadedBy: user.id,
      },
    });

    return NextResponse.json({
      id: document.id,
      name: file.name,
      content: textContent,
      fileSize: file.size,
      fileType: file.type,
      publicUrl,
      uploadedAt: document.createdAt,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}