import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Send,
  Paperclip,
  X,
  FileText,
  Image,
  File,
  RefreshCcw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { PortalLayout } from './PortalLayout';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

const categories = [
  { id: 'technical', name: 'Suporte Técnico', description: 'Problemas com o sistema, bugs, erros' },
  { id: 'billing', name: 'Financeiro', description: 'Faturamento, pagamentos, notas fiscais' },
  { id: 'account', name: 'Minha Conta', description: 'Cadastro, senha, permissões' },
  { id: 'feature', name: 'Solicitação', description: 'Novas funcionalidades, melhorias' },
  { id: 'other', name: 'Outros', description: 'Assuntos gerais' },
];

const priorities = [
  { id: 'low', name: 'Baixa', description: 'Não urgente' },
  { id: 'medium', name: 'Média', description: 'Pode aguardar algumas horas' },
  { id: 'high', name: 'Alta', description: 'Preciso de ajuda rápida' },
  { id: 'critical', name: 'Crítica', description: 'Sistema parado/inacessível' },
];

const suggestedArticles = [
  { id: '1', title: 'Como redefinir minha senha', views: 1234 },
  { id: '2', title: 'Problemas de login mais comuns', views: 987 },
  { id: '3', title: 'Guia de primeiros passos', views: 2341 },
];

export default function PortalNewTicket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium',
  });
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: AttachedFile[] = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual ticket creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Ticket criado com sucesso!',
        description: 'Você receberá atualizações por email.',
      });
      navigate('/portal/tickets');
    } catch (error) {
      toast({
        title: 'Erro ao criar ticket',
        description: 'Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.subject.trim() && formData.description.trim() && formData.category;

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/tickets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Novo Ticket</h1>
            <p className="text-muted-foreground">
              Descreva seu problema e nossa equipe entrará em contato
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div>
                              <span className="font-medium">{cat.name}</span>
                              <span className="text-muted-foreground ml-2">- {cat.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Resumo do seu problema ou solicitação"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.subject.length}/200
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva seu problema em detalhes. Quanto mais informações, mais rápido poderemos ajudar."
                      className="min-h-[150px]"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="font-medium">{p.name}</span>
                            <span className="text-muted-foreground ml-2">- {p.description}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <Label>Anexos</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Paperclip className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clique para anexar arquivos ou arraste aqui
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, PNG, JPG até 10MB
                        </p>
                      </label>
                    </div>
                    
                    {attachments.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {attachments.map((file) => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <div
                              key={file.id}
                              className="flex items-center gap-3 p-3 border rounded-lg"
                            >
                              <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAttachment(file.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/portal/tickets')}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={!isValid || isSubmitting}>
                      {isSubmitting ? (
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Dicas para um bom ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Seja específico no assunto</p>
                <p>• Descreva os passos para reproduzir o problema</p>
                <p>• Inclua capturas de tela quando possível</p>
                <p>• Mencione quando o problema começou</p>
              </CardContent>
            </Card>

            {/* Suggested Articles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Artigos que podem ajudar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedArticles.map((article) => (
                  <Button
                    key={article.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2"
                    onClick={() => navigate(`/portal/knowledge/${article.id}`)}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {article.views.toLocaleString()} visualizações
                      </p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}