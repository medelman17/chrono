# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for document uploads in the Chrono application.

## Prerequisites

- Supabase project already created
- Database connection working
- Access to Supabase dashboard

## Step 1: Create Storage Bucket

### Option A: Using the Setup Script (Recommended)

1. Run the setup script:
   ```bash
   npx tsx scripts/setup-storage.ts
   ```

2. This will create a bucket named `case-documents` with:
   - 50MB file size limit
   - Restricted file types for security
   - Private access (requires authentication)

### Option B: Manual Setup in Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure:
   - Name: `case-documents`
   - Public: **OFF** (keep it private)
   - File size limit: `52428800` (50MB)
   - Allowed MIME types:
     ```
     application/pdf
     image/jpeg
     image/png
     image/gif
     image/webp
     text/plain
     message/rfc822
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     application/msword
     ```

## Step 2: Set Up Storage Policies

Storage policies control who can access files. You need to set up RLS (Row Level Security) policies.

1. In Supabase Dashboard, go to **Storage** → **Policies**
2. Select the `case-documents` bucket
3. Create the following policies:

### Policy 1: Authenticated users can upload files
```sql
-- Policy name: Authenticated users can upload
-- Allowed operation: INSERT

WITH authenticated AS (
  SELECT auth.uid() IS NOT NULL AS is_authenticated
)
SELECT is_authenticated FROM authenticated WHERE is_authenticated;
```

### Policy 2: Users can view their own files
```sql
-- Policy name: Users can view own files
-- Allowed operation: SELECT

WITH user_files AS (
  SELECT 
    name,
    SPLIT_PART(name, '/', 1) AS user_id
  FROM storage.objects
  WHERE bucket_id = 'case-documents'
)
SELECT 
  auth.uid()::text = user_id 
FROM user_files 
WHERE storage.filename() = name;
```

### Policy 3: Users can delete their own files
```sql
-- Policy name: Users can delete own files
-- Allowed operation: DELETE

WITH user_files AS (
  SELECT 
    name,
    SPLIT_PART(name, '/', 1) AS user_id
  FROM storage.objects
  WHERE bucket_id = 'case-documents'
)
SELECT 
  auth.uid()::text = user_id 
FROM user_files 
WHERE storage.filename() = name;
```

## Step 3: Alternative Simple Policies

If the above policies are too complex, you can use these simpler ones:

### Simple Policy: Authenticated users only
1. Click **New Policy**
2. Select **For authenticated users only**
3. Allow: SELECT, INSERT, DELETE
4. Save

**Note**: This allows any authenticated user to access any file. Use this only for testing.

## Step 4: Test Storage

1. Sign in to your application
2. Go to a case detail page
3. Upload a document using the file analysis feature
4. Check the Documents tab to see uploaded files
5. Try downloading a file

## File Organization

Files are stored with the following structure:
```
case-documents/
├── {userId}/
│   └── {caseId}/
│       └── {timestamp}-{filename}
```

This ensures:
- Files are organized by user and case
- Filename conflicts are avoided with timestamps
- Easy to implement access control

## Troubleshooting

### "Failed to upload file" error
1. Check that the bucket exists
2. Verify storage policies are set up
3. Check Supabase service role key is configured
4. Look at browser console for detailed errors

### "new row violates row-level security policy"
1. The storage policies aren't configured correctly
2. Use the simple authenticated-only policy for testing
3. Check that auth.uid() is returning the correct user ID

### Files upload but can't download
1. Check the SELECT policy is configured
2. Verify the file path structure matches the policy
3. Try using a signed URL instead of public URL

## Best Practices

1. **File Size Limits**: Keep the 50MB limit to prevent abuse
2. **File Types**: Only allow necessary file types for security
3. **Naming**: The app automatically sanitizes filenames
4. **Cleanup**: Delete files from storage when documents are deleted from the database
5. **Monitoring**: Check Storage usage in Supabase dashboard regularly

## Next Steps

After setting up storage:
1. Test file uploads with different file types
2. Verify file analysis works with uploaded documents
3. Monitor storage usage
4. Consider implementing file compression for large documents
5. Add virus scanning for uploaded files (advanced)