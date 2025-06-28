'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import { Party, PartyInput } from '@/types/chronology';
import { createParty, updateParty, deleteParty } from '@/app/actions/parties';
import { useRouter } from 'next/navigation';

const PARTY_ROLES = [
  'Plaintiff',
  'Defendant',
  'Co-Plaintiff',
  'Co-Defendant',
  'Third-Party Defendant',
  'Cross-Defendant',
  'Witness',
  'Expert Witness',
  'Attorney',
  'Judge',
  'Mediator',
  'Other'
];

interface PartiesListProps {
  caseId: string;
  parties: Party[];
}

export function PartiesList({ caseId, parties: initialParties }: PartiesListProps) {
  const [parties, setParties] = useState(initialParties);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [formData, setFormData] = useState<PartyInput>({
    name: '',
    role: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    setIsSubmitting(true);
    try {
      if (editingParty) {
        const updated = await updateParty(editingParty.id, formData);
        setParties(parties.map(p => p.id === updated.id ? updated : p));
        setEditingParty(null);
      } else {
        const newParty = await createParty(caseId, formData);
        setParties([...parties, newParty]);
        setIsAddDialogOpen(false);
      }
      
      setFormData({ name: '', role: '', description: '' });
      router.refresh();
    } catch (error) {
      console.error('Error saving party:', error);
      alert('Failed to save party. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this party?')) return;

    try {
      await deleteParty(id);
      setParties(parties.filter(p => p.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Error deleting party:', error);
      alert('Failed to delete party. Please try again.');
    }
  };

  const startEdit = (party: Party) => {
    setEditingParty(party);
    setFormData({
      name: party.name,
      role: party.role,
      description: party.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingParty(null);
    setFormData({ name: '', role: '', description: '' });
  };

  // Group parties by role
  const partiesByRole = parties.reduce((acc, party) => {
    if (!acc[party.role]) {
      acc[party.role] = [];
    }
    acc[party.role].push(party);
    return acc;
  }, {} as Record<string, Party[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Case Parties</CardTitle>
          <CardDescription>People and organizations involved in this case</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Party</DialogTitle>
              <DialogDescription>
                Add a person or organization involved in this case
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith or ABC Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTY_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this party..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setFormData({ name: '', role: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Party'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {parties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No parties added yet</p>
            <p className="text-sm">Add parties to track who&apos;s involved in this case</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(partiesByRole).map(([role, roleParties]) => (
              <div key={role}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{role}</h4>
                <div className="space-y-2">
                  {roleParties.map((party) => (
                    <div
                      key={party.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-muted/10"
                    >
                      {editingParty?.id === party.id ? (
                        <form onSubmit={handleSubmit} className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Name"
                              required
                            />
                            <Select
                              value={formData.role}
                              onValueChange={(value) => setFormData({ ...formData, role: value })}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PARTY_ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                              Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={isSubmitting}>
                              {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-medium">{party.name}</p>
                            {party.description && (
                              <p className="text-sm text-muted-foreground mt-1">{party.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEdit(party)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(party.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}