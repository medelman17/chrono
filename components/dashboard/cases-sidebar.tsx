'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen, Plus } from 'lucide-react';
import Link from 'next/link';

interface Case {
  id: string;
  name: string;
  description: string | null;
  _count: {
    chronologies: number;
    entries: number;
  };
}

interface CasesSidebarProps {
  collapsed: boolean;
}

export function CasesSidebar({ collapsed }: CasesSidebarProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const currentCaseId = params.caseId as string;

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center space-y-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-10 w-10"
          title="New Case"
        >
          <Link href="/dashboard/cases/new">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-2">
          {loading ? (
            <Skeleton className="h-10 w-10 rounded-md" />
          ) : (
            cases.slice(0, 5).map((case_) => (
              <Button
                key={case_.id}
                variant={currentCaseId === case_.id ? 'default' : 'ghost'}
                size="icon"
                className="h-10 w-10"
                onClick={() => router.push(`/dashboard/cases/${case_.id}`)}
                title={case_.name}
              >
                <FolderOpen className="h-5 w-5" />
              </Button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <Button asChild className="w-full">
          <Link href="/dashboard/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {loading ? (
            <>
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No cases yet
            </div>
          ) : (
            cases.map((case_) => (
              <Button
                key={case_.id}
                variant={currentCaseId === case_.id ? 'secondary' : 'ghost'}
                className="w-full justify-start h-auto py-3 px-3"
                onClick={() => router.push(`/dashboard/cases/${case_.id}`)}
              >
                <div className="text-left w-full">
                  <div className="font-medium line-clamp-1">{case_.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {case_._count.chronologies} chronologies • {case_._count.entries} entries
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}