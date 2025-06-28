import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function CasesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const cases = await prisma.case.findMany({
    where: {
      OR: [
        { userId: user.id },
        { shares: { some: { userId: user.id } } }
      ]
    },
    include: {
      _count: {
        select: {
          chronologies: true,
          entries: true,
          documents: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">
            Manage your litigation cases and chronologies
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first case to start building chronologies
            </p>
            <Button asChild>
              <Link href="/dashboard/cases/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Case
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{case_.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {case_.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{case_._count.chronologies} chronologies</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{case_._count.entries} entries</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/cases/${case_.id}`}>
                    View Case
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}