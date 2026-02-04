import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  File,
  FileText,
  Image,
  Trash2,
  Download,
  Eye,
  MoreHorizontal,
  RefreshCw,
  X,
  Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  mime_type: string | null;
  category: string | null;
  description: string | null;
  created_at: string;
  uploaded_by: string;
  uploader?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface AttachmentsWidgetProps {
  entityType: string;
  entityId: string;
  accountId?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  quoteId?: string;
  contractId?: string;
}

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return <File className="h-4 w-4" />;
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AttachmentsWidget({
  entityType,
  entityId,
  accountId,
  contactId,
  leadId,
  opportunityId,
  quoteId,
  contractId,
}: AttachmentsWidgetProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const fetchAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attachments')
      .select(`
        *,
        uploader:profiles!attachments_uploaded_by_fkey(first_name, last_name)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
    } else {
      setAttachments(data || []);
    }
    setLoading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!profile?.organization_id) return;

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${profile.organization_id}/${entityType}/${entityId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Create attachment record
        const { error: dbError } = await supabase.from('attachments').insert([{
          organization_id: profile.organization_id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: fileExt,
          mime_type: file.type,
          entity_type: entityType,
          entity_id: entityId,
          account_id: accountId,
          contact_id: contactId,
          lead_id: leadId,
          opportunity_id: opportunityId,
          quote_id: quoteId,
          contract_id: contractId,
          uploaded_by: profile.id,
        }]);

        if (dbError) {
          console.error('DB error:', dbError);
          // Try to clean up the uploaded file
          await supabase.storage.from('attachments').remove([filePath]);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast({
        title: 'Arquivos enviados',
        description: `${successCount} arquivo(s) enviado(s) com sucesso.`,
      });
      fetchAttachments();
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha no envio',
        description: 'Não foi possível enviar os arquivos. Tente novamente.',
      });
    }
  };

  const deleteAttachment = async (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (!attachment) return;

    // Delete from storage
    await supabase.storage.from('attachments').remove([attachment.file_path]);

    // Delete from database
    const { error } = await supabase.from('attachments').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir anexo',
      });
    } else {
      toast({
        title: 'Anexo excluído',
        description: 'O arquivo foi excluído com sucesso.',
      });
      fetchAttachments();
    }
    setDeleteAttachmentId(null);
  };

  const downloadAttachment = async (attachment: Attachment) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .download(attachment.file_path);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao baixar arquivo',
      });
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewAttachmentFile = async (attachment: Attachment) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(attachment.file_path, 3600);

    if (error || !data) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao visualizar arquivo',
      });
      return;
    }

    setPreviewUrl(data.signedUrl);
    setPreviewAttachment(attachment);
  };

  const isPreviewable = (mimeType: string | null) => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anexos
              </CardTitle>
              <CardDescription>
                {attachments.length} arquivo{attachments.length !== 1 ? 's' : ''} anexado{attachments.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
          />

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Arraste e solte arquivos aqui, ou{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  procure
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Word, Excel, Imagens (máx. 50MB)
              </p>
            </div>
          </div>

          {/* Attachments List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum anexo ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-muted rounded-lg">
                    {getFileIcon(attachment.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{format(new Date(attachment.created_at), "d 'de' MMM yyyy", { locale: ptBR })}</span>
                      {attachment.uploader && (
                        <>
                          <span>•</span>
                          <span>
                            {attachment.uploader.first_name} {attachment.uploader.last_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isPreviewable(attachment.mime_type) && (
                        <DropdownMenuItem onClick={() => previewAttachmentFile(attachment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => downloadAttachment(attachment)}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteAttachmentId(attachment.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => { setPreviewUrl(null); setPreviewAttachment(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewAttachment?.file_name}</DialogTitle>
            <DialogDescription>
              {formatFileSize(previewAttachment?.file_size ?? null)} • {previewAttachment?.mime_type}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewAttachment?.mime_type?.startsWith('image/') ? (
              <img
                src={previewUrl!}
                alt={previewAttachment.file_name}
                className="max-w-full h-auto mx-auto"
              />
            ) : previewAttachment?.mime_type === 'application/pdf' ? (
              <iframe
                src={previewUrl!}
                className="w-full h-[70vh]"
                title={previewAttachment.file_name}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAttachmentId} onOpenChange={() => setDeleteAttachmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Anexo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este anexo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAttachmentId && deleteAttachment(deleteAttachmentId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
