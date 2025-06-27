# Quick Fix for Storage Bucket Error

The storage bucket needs to be created manually in your Supabase dashboard.

## UPDATE: If Still Getting "Bucket not found" After Creating Bucket

If you're still getting the error after creating the bucket, you might need the service role key:

1. Go to your Supabase project settings
2. Navigate to API settings
3. Copy the **service_role** key (NOT the anon key)
4. Add it to your `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
5. Restart your development server

The service role key has full access to storage and bypasses RLS policies.

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