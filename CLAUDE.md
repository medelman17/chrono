# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrono is a Litigation Chronology Manager designed to help attorneys create, manage, and analyze case chronologies using AI-powered document analysis. Currently in early development phase with an MVP component ready for integration into the Next.js framework.

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build the application for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required environment variables in `.env.local`:
```
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# AI Services
ANTHROPIC_API_KEY=your_api_key_here           # Claude AI for document analysis
LLAMA_CLOUD_API_KEY=your_llama_parse_key_here # LlamaParse for PDF/image processing

# File Settings
MAX_FILE_SIZE=52428800                        # Maximum file size (50MB default)
```

## Database Commands

```bash
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema to database (development)
npx prisma migrate dev  # Create and apply migrations
npx prisma studio       # Open Prisma Studio (database GUI)
```

## Architecture Overview

### Current State
- Next.js 15.3.4 application bootstrapped with create-next-app
- TypeScript with strict mode enabled
- Tailwind CSS v4 for styling
- MVP React component (`mvp_version.tsx`) containing the core chronology manager functionality

### Planned Architecture (per tdd.md)

The application will evolve into a full-stack Next.js 15 implementation with:

**Frontend**: Next.js App Router, React Server Components, TypeScript, Tailwind CSS
**Backend**: Next.js Route Handlers, Prisma ORM, PostgreSQL (Supabase)
**File Storage**: AWS S3
**Authentication**: Clerk
**AI Integration**: Anthropic Claude API

### Key Components

1. **MVP Component (`components/LitigationChronologyManager.tsx`)**
   - Comprehensive litigation chronology manager with state management
   - Claude AI integration for document analysis
   - File upload support with server-side processing
   - Search, filtering, and export capabilities
   - Case context management for improved AI analysis

2. **Document Processing (`app/api/documents/upload/route.ts`)**
   - LlamaParse integration for PDF and image processing (with OCR)
   - Mammoth for Word document extraction
   - Native support for text and email files
   - Fallback error handling for unsupported formats

3. **Planned Route Structure**
   ```
   app/
   ├── (auth)/          # Authentication flows
   ├── (dashboard)/     # Main application
   │   └── cases/       # Case management
   └── api/             # API endpoints
   ```

4. **Database Schema (planned)**
   - Users (with Clerk integration)
   - Cases (litigation cases)
   - ChronologyEntries (timeline entries)
   - Documents (uploaded files)
   - CaseShares (multi-user access)

## Integration Notes

When integrating the MVP component:
1. The component expects to communicate with Claude AI API - ensure API key configuration
2. File processing includes various document types - implement proper file upload handling
3. State management is currently local - will need migration to database persistence
4. Export functionality generates formatted text - consider additional export formats

## Key Features to Preserve

- Document analysis with Claude AI
- Multi-format file support
- Advanced filtering (category, party, date range, text search)
- Case context for improved AI analysis
- Chronology entry management (add, edit, delete)
- Export capabilities for legal proceedings