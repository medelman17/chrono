import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient, STORAGE_BUCKETS } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import mammoth from 'mammoth';
import { LlamaParse } from 'llama-parse';
import Anthropic from '@anthropic-ai/sdk';
import exifr from 'exifr';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ImageMetadata {
  Make?: string;
  Model?: string;
  Software?: string;
  DateTimeOriginal?: Date | string;
  CreateDate?: Date | string;
  ModifyDate?: Date | string;
  ImageWidth?: number;
  ImageHeight?: number;
  ExifImageWidth?: number;
  ExifImageHeight?: number;
  Orientation?: number;
  ISO?: number;
  FNumber?: number;
  ExposureTime?: number | string;
  FocalLength?: number;
  Flash?: number | string;
  latitude?: number;
  longitude?: number;
  GPSAltitude?: number;
  GPSTimeStamp?: string;
  Artist?: string;
  Copyright?: string;
  Description?: string;
  ImageDescription?: string;
  Keywords?: string | string[];
  Subject?: string | string[];
}

async function extractImageMetadata(buffer: Buffer, filename: string) {
  try {
    console.log(`[DEBUG] Extracting metadata from ${filename}`);
    
    // Extract EXIF and other metadata
    const metadata = await exifr.parse(buffer, {
      // Request all available data
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      // Include GPS data
      gps: true,
    });
    
    if (!metadata) {
      console.log(`[DEBUG] No metadata found in ${filename}`);
      return null;
    }
    
    console.log(`[DEBUG] Metadata extracted from ${filename}:`, metadata);
    
    // Format metadata for readability
    const formattedMetadata: Partial<ImageMetadata> = {
      // Camera/Device info
      Make: metadata.Make,
      Model: metadata.Model,
      Software: metadata.Software,
      
      // Date/Time info
      DateTimeOriginal: metadata.DateTimeOriginal,
      CreateDate: metadata.CreateDate,
      ModifyDate: metadata.ModifyDate,
      
      // Image properties
      ImageWidth: metadata.ImageWidth || metadata.ExifImageWidth,
      ImageHeight: metadata.ImageHeight || metadata.ExifImageHeight,
      Orientation: metadata.Orientation,
      
      // Camera settings
      ISO: metadata.ISO,
      FNumber: metadata.FNumber,
      ExposureTime: metadata.ExposureTime,
      FocalLength: metadata.FocalLength,
      Flash: metadata.Flash,
      
      // GPS Location
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      GPSAltitude: metadata.GPSAltitude,
      GPSTimeStamp: metadata.GPSTimeStamp,
      
      // Other useful info
      Artist: metadata.Artist,
      Copyright: metadata.Copyright,
      Description: metadata.Description || metadata.ImageDescription,
      Keywords: metadata.Keywords,
      Subject: metadata.Subject,
    };
    
    // Remove null/undefined values
    Object.keys(formattedMetadata).forEach(key => {
      const typedKey = key as keyof ImageMetadata;
      if (formattedMetadata[typedKey] === null || formattedMetadata[typedKey] === undefined) {
        delete formattedMetadata[typedKey];
      }
    });
    
    return formattedMetadata;
  } catch (error) {
    console.error(`[DEBUG] Error extracting metadata from ${filename}:`, error);
    return null;
  }
}

async function analyzeImageWithClaude(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  try {
    console.log(`[DEBUG] Analyzing image with Claude Vision: ${filename}`);
    
    // Extract metadata first
    const metadata = await extractImageMetadata(buffer, filename);
    
    // Convert buffer to base64
    const base64Image = buffer.toString('base64');
    
    // Map MIME types to Claude's accepted formats
    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
    if (mimeType === "image/png") mediaType = "image/png";
    else if (mimeType === "image/gif") mediaType = "image/gif";
    else if (mimeType === "image/webp") mediaType = "image/webp";
    
    // Build metadata context for Claude
    let metadataContext = "";
    if (metadata) {
      metadataContext = "\n\nIMAGE METADATA:\n";
      
      if (metadata.DateTimeOriginal) {
        metadataContext += `- Original Date/Time: ${new Date(metadata.DateTimeOriginal).toLocaleString()}\n`;
      }
      if (metadata.Make && metadata.Model) {
        metadataContext += `- Camera/Device: ${metadata.Make} ${metadata.Model}\n`;
      }
      if (metadata.latitude && metadata.longitude) {
        metadataContext += `- GPS Location: ${metadata.latitude}, ${metadata.longitude}\n`;
      }
      if (metadata.ImageWidth && metadata.ImageHeight) {
        metadataContext += `- Dimensions: ${metadata.ImageWidth} x ${metadata.ImageHeight}\n`;
      }
      if (metadata.Software) {
        metadataContext += `- Software: ${metadata.Software}\n`;
      }
      if (metadata.Artist) {
        metadataContext += `- Artist/Creator: ${metadata.Artist}\n`;
      }
      if (metadata.Description) {
        metadataContext += `- Embedded Description: ${metadata.Description}\n`;
      }
    }
    
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this image and provide a detailed description of what you see. This image is being used as evidence in a litigation case, so please be thorough and objective in your description.${metadataContext}

Please include:
1. What type of document or image this appears to be
2. Any visible text, numbers, dates, or identifying information
3. The overall content and context of the image
4. Any notable details that might be legally relevant
5. The quality and condition of the image/document
6. Analysis of the metadata in context with the image content (if metadata was provided)

Format your response as a clear, professional description that could be used in legal documentation.`
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image
              }
            }
          ]
        }
      ]
    });
    
    const description = message.content[0].type === "text" ? message.content[0].text : "";
    console.log(`[DEBUG] Claude Vision analysis complete for ${filename}`);
    
    // Build the final output including metadata
    let output = `[Image Analysis of ${filename}]\n\n`;
    
    // Add metadata section if available
    if (metadata && Object.keys(metadata).length > 0) {
      output += "METADATA:\n";
      output += `Filename: ${filename}\n`;
      
      if (metadata.DateTimeOriginal) {
        output += `Date Taken: ${new Date(metadata.DateTimeOriginal).toLocaleString()}\n`;
      }
      if (metadata.Make && metadata.Model) {
        output += `Device: ${metadata.Make} ${metadata.Model}\n`;
      }
      if (metadata.latitude && metadata.longitude) {
        output += `GPS Coordinates: ${metadata.latitude}, ${metadata.longitude}\n`;
      }
      if (metadata.ImageWidth && metadata.ImageHeight) {
        output += `Dimensions: ${metadata.ImageWidth} x ${metadata.ImageHeight} pixels\n`;
      }
      if (metadata.ISO) {
        output += `Camera Settings: ISO ${metadata.ISO}`;
        if (metadata.FNumber) output += `, f/${metadata.FNumber}`;
        if (metadata.ExposureTime) output += `, ${metadata.ExposureTime}s`;
        if (metadata.FocalLength) output += `, ${metadata.FocalLength}mm`;
        output += "\n";
      }
      if (metadata.Software) {
        output += `Software: ${metadata.Software}\n`;
      }
      if (metadata.Artist) {
        output += `Creator: ${metadata.Artist}\n`;
      }
      if (metadata.Copyright) {
        output += `Copyright: ${metadata.Copyright}\n`;
      }
      
      output += "\n";
    }
    
    output += "VISUAL ANALYSIS:\n" + description;
    
    return output;
  } catch (error) {
    console.error(`[DEBUG] Claude Vision error for ${filename}:`, error);
    throw error;
  }
}

async function parseFileContent(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop() || '';

  try {
    // Use Claude Vision for image files
    const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'];
    if (imageTypes.includes(ext)) {
      try {
        return await analyzeImageWithClaude(buffer, filename, mimeType);
      } catch (claudeError) {
        console.error(`Claude Vision error for ${filename}:`, claudeError);
        return `[Image Processing Error] Unable to analyze image: ${filename}. Please describe the content manually.`;
      }
    }
    
    // Use LlamaParse for PDFs (text extraction)
    if (ext === 'pdf' && process.env.LLAMA_CLOUD_API_KEY) {
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
        return `[PDF Processing Error] Unable to process PDF: ${filename}. Please copy and paste the content manually.`;
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
  console.log('[DEBUG] Document upload API called');
  
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

    console.log('[DEBUG] Upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      caseId,
      userId: user.id,
    });

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
    console.log('[DEBUG] Text extraction complete:', {
      contentLength: textContent.length,
      preview: textContent.substring(0, 200),
    });
    
    // Extract metadata for images
    let imageMetadata = null;
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'];
    if (imageTypes.includes(ext)) {
      imageMetadata = await extractImageMetadata(buffer, file.name);
    }

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
          ...(imageMetadata ? { exif: imageMetadata } : {}),
        },
        caseId: caseId,
        uploadedBy: user.id,
      },
    });
    
    console.log('[DEBUG] Document saved to database:', {
      documentId: document.id,
      filename: document.filename,
      caseId: document.caseId,
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