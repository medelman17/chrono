import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, Settings, Star } from 'lucide-react';
import Link from 'next/link';
import { PartiesList } from '@/components/dashboard/parties-list';

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { caseId } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const case_ = await prisma.case.findFirst({
    where: {
      id: caseId,
      OR: [
        { userId: user.id },
        { shares: { some: { userId: user.id } } }
      ]
    },
    include: {
      chronologies: {
        include: {
          _count: {
            select: {
              entries: true
            }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      },
      parties: {
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      }
    }
  });

  if (!case_) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{case_.name}</h1>
          <p className="text-muted-foreground">
            {case_.description || 'No description'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/cases/${caseId}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/cases/${caseId}/chronologies/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Chronology
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Parties Section */}
        <PartiesList 
          caseId={caseId} 
          parties={case_.parties.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString()
          }))} 
        />

        {/* Chronologies Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Chronologies</h2>
        
        {case_.chronologies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chronologies yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first chronology to start organizing events
              </p>
              <Button asChild>
                <Link href={`/dashboard/cases/${caseId}/chronologies/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Chronology
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {case_.chronologies.map((chronology) => (
              <Card key={chronology.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {chronology.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {chronology.description || 'No description'}
                      </CardDescription>
                    </div>
                    {chronology.isDefault && (
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <FileText className="h-4 w-4" />
                    <span>{chronology._count.entries} entries</span>
                    {chronology.type && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{chronology.type}</span>
                      </>
                    )}
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/cases/${caseId}/chronologies/${chronology.id}`}>
                      View Chronology
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}