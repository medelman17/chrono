import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { LlamaParse } from 'llama-parse';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

// Disable body parsing, we'll handle it with formidable
export const dynamic = 'force-dynamic';


async function parseFile(filepath: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  const buffer = await fs.readFile(filepath);

  try {
    // Check if we should use LlamaParse for this file type
    const llamaParseTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp'];
    if (llamaParseTypes.includes(ext) && process.env.LLAMA_CLOUD_API_KEY) {
      try {
        // Initialize LlamaParse
        const parser = new LlamaParse({
          apiKey: process.env.LLAMA_CLOUD_API_KEY,
        });

        // Create a Blob from the buffer
        const blob = new Blob([buffer], { type: `application/${ext.substring(1)}` });
        
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
        // Fall back to basic handling if LlamaParse fails
        if (ext === '.pdf') {
          return `[PDF Processing Error] Unable to process PDF: ${filename}. Please copy and paste the content manually.`;
        } else {
          return `[Image Processing Error] Unable to process image: ${filename}. Please describe the content manually.`;
        }
      }
    }

    // Handle other file types
    switch (ext) {
      case '.doc':
      case '.docx':
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;

      case '.txt':
      case '.eml':
        return buffer.toString('utf-8');

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Create a temporary directory for uploads
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Since we can't directly use formidable with NextRequest,
    // we'll need to handle the file upload differently
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const parsedFiles = [];
    
    for (const file of files) {
      try {
        // Create a temporary file path
        const tempPath = path.join(uploadDir, `${Date.now()}-${file.name}`);
        
        // Convert File to Buffer and save
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(tempPath, buffer);
        
        // Parse the file content
        const content = await parseFile(tempPath, file.name);
        
        parsedFiles.push({
          name: file.name,
          fileSize: file.size,
          fileType: file.type,
          content: content
        });
        
        // Clean up the temporary file
        await fs.unlink(tempPath);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        parsedFiles.push({
          name: file.name,
          fileSize: file.size,
          fileType: file.type,
          content: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Clean up the upload directory
    try {
      await fs.rm(uploadDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up upload directory:', error);
    }
    
    return NextResponse.json({
      success: true,
      files: parsedFiles
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}