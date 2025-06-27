# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for the Chrono application.

## Prerequisites

Before starting, make sure you have:
- A Clerk account (sign up at https://clerk.com)
- Access to your Supabase database

## Step 1: Create a Clerk Application

1. Log in to your Clerk Dashboard
2. Click "Create application"
3. Give your application a name (e.g., "Chrono")
4. Select authentication methods (recommended: Email, Google, GitHub)
5. Click "Create application"

## Step 2: Get Your API Keys

After creating your application, you'll see your API keys:

1. **Publishable Key**: Starts with `pk_test_` or `pk_live_`
2. **Secret Key**: Starts with `sk_test_` or `sk_live_`

## Step 3: Configure Environment Variables

Update your `.env.local` file with your Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

The other Clerk environment variables are already configured:
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/cases`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/cases`

## Step 4: Set Up Webhooks

Webhooks are needed to sync Clerk users with your database:

1. In Clerk Dashboard, go to "Webhooks" in the left sidebar
2. Click "Add Endpoint"
3. Set the endpoint URL to: `https://YOUR_DOMAIN/api/webhooks/clerk`
4. Select these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Click "Create"
6. Copy the "Signing Secret" (starts with `whsec_`)
7. Add it to your `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

## Step 5: Customize Appearance (Optional)

1. In Clerk Dashboard, go to "Customization"
2. Customize colors, logos, and branding to match your application
3. You can also customize the sign-in/sign-up forms

## Step 6: Configure OAuth Providers (Optional)

If you want to enable social login:

1. Go to "User & Authentication" → "Social Connections"
2. Enable providers like Google, GitHub, etc.
3. Follow the setup instructions for each provider

## Step 7: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000
3. Click "Sign In" or "Get Started"
4. Create a test account
5. Verify that:
   - You can sign up/sign in
   - You're redirected to `/cases` after authentication
   - Your email appears in the navigation bar
   - The webhook creates a user in your database

## Troubleshooting

### Users not syncing to database

1. Check that your webhook endpoint is receiving requests in Clerk Dashboard
2. Verify your `CLERK_WEBHOOK_SECRET` is correct
3. Check your application logs for webhook errors

### Authentication not working

1. Ensure all environment variables are set correctly
2. Check that middleware is properly configured
3. Verify your Clerk application is active

### Getting 401 errors

1. Make sure you're signed in
2. Check that the middleware is protecting the correct routes
3. Verify API routes are using `getCurrentUser()` correctly

## Production Deployment

When deploying to production:

1. Use production API keys from Clerk
2. Update the webhook URL to your production domain
3. Ensure all environment variables are set in your hosting platform
4. Test the authentication flow in production

## Next Steps

After setting up Clerk authentication, you can:
- Customize user profiles
- Add role-based access control
- Implement team features
- Add multi-factor authentication

For more information, visit the [Clerk documentation](https://clerk.com/docs).