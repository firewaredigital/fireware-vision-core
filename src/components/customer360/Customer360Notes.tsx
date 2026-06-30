import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StickyNote, Plus, Send, Pin, Trash2 } from '@/components/icons';

interface Customer360NotesProps {
  entityType: string;
  entityId: string;
}

export function Customer360Notes({ entityType, entityId }: Customer360NotesProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Build filter column based on entity type
  const filterColumn = entityType === 'account' ? 'account_id' : 'contact_id';

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['c360-notes', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          author:profiles!notes_owner_id_fkey(id, first_name, last_name, email)
        `)
        .eq(filterColumn, entityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !profile?.id || !newNote.trim()) return;
      const insertData: Record<string, unknown> = {
        organization_id: profile.organization_id,
        content: newNote.trim(),
        owner_id: profile.id,
        [filterColumn]: entityId,
      };
      const { error } = await supabase.from('notes').insert(insertData as unknown);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['c360-notes', entityType, entityId] });
      setNewNote('');
      setShowForm(false);
      toast({ title: 'Nota adicionada' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao adicionar nota.', variant: 'destructive' });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !isPinned })
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['c360-notes', entityType, entityId] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['c360-notes', entityType, entityId] });
      toast({ title: 'Nota removida' });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Notas ({notes.length})
        </CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Nota
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
            <Textarea
              placeholder="Escreva sua nota..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => addNoteMutation.mutate()}
                disabled={!newNote.trim() || addNoteMutation.isPending}
              >
                <Send className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {notes.map((note: unknown) => (
              <div
                key={note.id}
                className={`p-4 border rounded-lg ${note.is_pinned ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {note.author
                          ? `${note.author.first_name?.[0] || ''}${note.author.last_name?.[0] || ''}`.toUpperCase()
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {note.author
                            ? `${note.author.first_name || ''} ${note.author.last_name || ''}`.trim()
                            : 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {note.is_pinned && (
                          <Badge variant="outline" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Fixada
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => togglePinMutation.mutate({ noteId: note.id, isPinned: note.is_pinned })}
                    >
                      <Pin className={`h-3 w-3 ${note.is_pinned ? 'text-primary' : ''}`} />
                    </Button>
                    {note.owner_id === profile?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {notes.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-8">Nenhuma nota registrada</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
