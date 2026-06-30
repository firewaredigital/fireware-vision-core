import { useState, useEffect , useCallback } from 'react';
import { Plus, Pin, PinOff, Edit, Trash2, FileText, MoreHorizontal } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Note {
  id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface NotesWidgetProps {
  accountId?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  className?: string;
  compact?: boolean;
}

export function NotesWidget({
  accountId,
  contactId,
  leadId,
  opportunityId,
  className = '',
  compact = false,
}: NotesWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  

  const fetchNotes = useCallback( async () => {
    setLoading(true);
    let query = supabase
      .from('notes')
      .select(`
        *,
        owner:profiles!notes_owner_id_fkey(first_name, last_name, email)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (accountId) query = query.eq('account_id', accountId);
    if (contactId) query = query.eq('contact_id', contactId);
    if (leadId) query = query.eq('lead_id', leadId);
    if (opportunityId) query = query.eq('opportunity_id', opportunityId);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  }, [accountId, contactId, leadId, opportunityId, profile?.organization_id]);

  useEffect(() => {
    fetchNotes();
  }, [accountId, contactId, leadId, opportunityId, fetchNotes]);

  const handleSave = async () => {
    if (!noteContent.trim()) return;
    
    setSaving(true);

    // Get user's profile for organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user?.id)
      .single();

    if (!profile?.organization_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Organização não encontrada' });
      setSaving(false);
      return;
    }

    if (editingNote) {
      // Update existing note
      const { error } = await supabase
        .from('notes')
        .update({ content: noteContent.trim() })
        .eq('id', editingNote.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar nota' });
      } else {
        toast({ title: 'Nota atualizada' });
        setShowAddDialog(false);
        setEditingNote(null);
        setNoteContent('');
        fetchNotes();
      }
    } else {
      // Create new note
      const { error } = await supabase.from('notes').insert({
        content: noteContent.trim(),
        organization_id: profile.organization_id,
        owner_id: user?.id || '',
        is_pinned: false,
        account_id: accountId || null,
        contact_id: contactId || null,
        lead_id: leadId || null,
        opportunity_id: opportunityId || null,
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar nota' });
      } else {
        toast({ title: 'Nota adicionada' });
        setShowAddDialog(false);
        setNoteContent('');
        fetchNotes();
      }
    }

    setSaving(false);
  };

  const togglePin = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .update({ is_pinned: !note.is_pinned })
      .eq('id', note.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar nota' });
    } else {
      fetchNotes();
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir nota' });
    } else {
      toast({ title: 'Nota excluída' });
      fetchNotes();
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setShowAddDialog(true);
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingNote(null);
    setNoteContent('');
  };

  const getOwnerName = (note: Note) => {
    if (note.owner) {
      if (note.owner.first_name || note.owner.last_name) {
        return `${note.owner.first_name || ''} ${note.owner.last_name || ''}`.trim();
      }
      return note.owner.email;
    }
    return 'Unknown';
  };

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Notas ({notes.length})</h4>
          <Button size="sm" variant="ghost" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma nota ainda</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notes.slice(0, 3).map((note) => (
              <div key={note.id} className="text-sm p-2 bg-muted/50 rounded-md">
                <p className="line-clamp-2">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(note.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
            {notes.length > 3 && (
              <p className="text-xs text-muted-foreground">+{notes.length - 3} more</p>
            )}
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Editar Nota' : 'Adicionar Nota'}</DialogTitle>
              <DialogDescription>
                {editingNote ? 'Atualize sua nota abaixo.' : 'Escreva uma nota sobre este registro.'}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Digite sua nota aqui..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !noteContent.trim()}>
                {saving ? 'Salvando...' : editingNote ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notas</CardTitle>
          <CardDescription>Notas e comentários internos</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Nota
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Carregando notas...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2" />
            <p>Nenhuma nota ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.is_pinned ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {note.is_pinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="h-3 w-3 mr-1" />
                          Fixado
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {getOwnerName(note)} • {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    {note.updated_at !== note.created_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Editado em {format(new Date(note.updated_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  {note.owner_id === user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePin(note)}>
                          {note.is_pinned ? (
                            <>
                              <PinOff className="mr-2 h-4 w-4" />
                              Desafixar
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 h-4 w-4" />
                              Fixar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(note)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Editar Nota' : 'Adicionar Nota'}</DialogTitle>
              <DialogDescription>
                {editingNote ? 'Atualize sua nota abaixo.' : 'Escreva uma nota sobre este registro.'}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Digite sua nota aqui..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !noteContent.trim()}>
                {saving ? 'Salvando...' : editingNote ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
