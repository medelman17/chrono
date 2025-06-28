# App Router Migration Plan

## Current State Analysis

The application currently has a monolithic `LitigationChronologyManager` component (1188 lines) that handles:
- All state management locally
- Data fetching with useEffect
- Multiple sub-features (entries, documents, filtering, export, print, etc.)
- Form handling
- Claude AI integration

## Migration Goals

1. **Leverage Server Components** for initial data loading
2. **Use Server Actions** for mutations
3. **Split into focused components** with single responsibilities
4. **Implement proper loading/error boundaries**
5. **Optimize client/server component boundaries**
6. **Support multiple chronologies per case**

## Proposed Architecture

### Route Structure
```
app/
├── cases/
│   ├── [caseId]/
│   │   ├── page.tsx (Case overview - Server Component)
│   │   ├── chronologies/
│   │   │   ├── page.tsx (List chronologies)
│   │   │   ├── new/
│   │   │   │   └── page.tsx (Create chronology)
│   │   │   └── [chronologyId]/
│   │   │       ├── page.tsx (Chronology detail)
│   │   │       ├── entries/
│   │   │       │   ├── new/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [entryId]/
│   │   │       │       └── edit/
│   │   │       │           └── page.tsx
│   │   │       ├── loading.tsx
│   │   │       └── error.tsx
│   │   └── settings/
│   │       └── page.tsx
```

### Component Breakdown

#### Server Components
1. **CaseLayout** - Fetches case data, provides context
2. **ChronologyList** - Lists all chronologies for a case
3. **ChronologyDetail** - Displays entries with filtering
4. **EntryList** - Renders chronology entries

#### Client Components
1. **ChronologyFilters** - Search, category, date filters
2. **EntryForm** - Add/edit entry form
3. **DocumentUploader** - File upload handling
4. **ClaudeAnalyzer** - AI document analysis
5. **ExportButtons** - Export/print functionality
6. **CaseContextEditor** - Edit case context/settings

### Server Actions
```typescript
// app/actions/chronology.ts
async function createChronology(caseId: string, data: ChronologyInput)
async function updateChronology(id: string, data: ChronologyInput)
async function deleteChronology(id: string)

// app/actions/entries.ts
async function createEntry(chronologyId: string, data: EntryInput)
async function updateEntry(id: string, data: EntryInput)
async function deleteEntry(id: string)

// app/actions/documents.ts
async function uploadDocument(formData: FormData)
async function analyzeDocument(documentId: string)
```

### Data Fetching Strategy

1. **Server Components** fetch data directly:
   ```typescript
   // app/cases/[caseId]/chronologies/[chronologyId]/page.tsx
   export default async function ChronologyPage({ params }) {
     const chronology = await getChronology(params.chronologyId)
     const entries = await getEntries(params.chronologyId)
     
     return (
       <ChronologyView chronology={chronology}>
         <EntryList entries={entries} />
       </ChronologyView>
     )
   }
   ```

2. **Client Components** use Server Actions for mutations:
   ```typescript
   // components/EntryForm.tsx
   'use client'
   import { createEntry } from '@/app/actions/entries'
   
   export function EntryForm({ chronologyId }) {
     async function handleSubmit(formData: FormData) {
       await createEntry(chronologyId, formData)
     }
   }
   ```

### Database Schema Updates

Add `Chronology` model:
```prisma
model Chronology {
  id           String            @id @default(cuid())
  name         String
  description  String?
  type         String?           // e.g., "financial", "medical", "communication"
  caseId       String
  userId       String
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  
  case         Case              @relation(fields: [caseId], references: [id], onDelete: Cascade)
  user         User              @relation(fields: [userId], references: [id])
  entries      ChronologyEntry[]
  
  @@index([caseId])
  @@index([userId])
}
```

Update `ChronologyEntry`:
```prisma
model ChronologyEntry {
  // ... existing fields ...
  chronologyId  String
  chronology    Chronology  @relation(fields: [chronologyId], references: [id], onDelete: Cascade)
  
  @@index([chronologyId])
}
```

## Implementation Steps

### Phase 1: Database & API Updates
1. Create migration for Chronology table
2. Update Prisma schema
3. Create data migration for existing entries
4. Update API routes

### Phase 2: Server Components & Actions
1. Create server actions for all mutations
2. Build server component pages
3. Implement loading/error states

### Phase 3: Component Decomposition
1. Extract filters into ChronologyFilters component
2. Extract entry form into EntryForm component
3. Extract document handling into DocumentUploader
4. Extract AI analysis into ClaudeAnalyzer
5. Create reusable EntryCard component

### Phase 4: Client Interactivity
1. Add optimistic updates with useOptimistic
2. Implement real-time search with useTransition
3. Add proper form validation
4. Enhance UX with loading states

### Phase 5: Testing & Optimization
1. Add proper TypeScript types
2. Implement error boundaries
3. Add loading skeletons
4. Test all user flows
5. Optimize bundle size

## Benefits

1. **Better Performance**: Server-side rendering, smaller client bundles
2. **Improved SEO**: Server-rendered content
3. **Better DX**: Clearer separation of concerns
4. **Scalability**: Easier to add features
5. **Type Safety**: Better TypeScript integration
6. **Multiple Chronologies**: Support complex cases with separate timelines