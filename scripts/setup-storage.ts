import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const STORAGE_BUCKETS = { DOCUMENTS: 'case-documents' };

async function setupStorage() {
  try {
    // Create the case-documents bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKETS.DOCUMENTS);
    
    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKETS.DOCUMENTS, {
        public: false, // Files require authentication to access
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'text/plain',
          'message/rfc822', // .eml files
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/msword', // .doc
        ]
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Bucket created successfully:', data);
      }
    } else {
      console.log('Bucket already exists');
    }
    
    // Set up storage policies
    // Note: You may need to set these up in the Supabase dashboard
    console.log('\nStorage bucket setup complete!');
    console.log('Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > Policies');
    console.log('3. Add policies for authenticated users to:');
    console.log('   - INSERT files to their own case folders');
    console.log('   - SELECT files from their own cases');
    console.log('   - DELETE files from their own cases');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupStorage();