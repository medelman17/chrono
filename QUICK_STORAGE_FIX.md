# Quick Fix for Storage Bucket Error

The storage bucket needs to be created manually in your Supabase dashboard.

## Steps to Create the Bucket:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket" button
   - Enter these settings:
     - **Name**: `case-documents`
     - **Public bucket**: OFF (keep it private)
     - Click "Create bucket"

4. **Set Up Basic Policy** (Quick Fix)
   - Click on the `case-documents` bucket
   - Go to "Policies" tab
   - Click "New policy"
   - Select "Get started quickly"
   - Choose "Allow access for authenticated users only"
   - Enable all operations: SELECT, INSERT, UPDATE, DELETE
   - Click "Review" then "Save policy"

That's it! Your file uploads should now work.

## Alternative: Use SQL Editor

If you prefer, you can run this SQL in the SQL Editor:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents', 
  'case-documents', 
  false, 
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'message/rfc822',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
);

-- Create simple policy for authenticated users
CREATE POLICY "Authenticated users can manage files" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated');
```

After creating the bucket, try uploading a file again!