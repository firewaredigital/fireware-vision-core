import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Copy,
  Type, Image, Link, Minus, Square, Columns, Star, Share2,
  Play, LayoutTemplate, Code, RefreshCw, ChevronUp, ChevronDown,
  Heading1, AlignLeft, MousePointer, Video, Mail,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TemplateSection {
  id: string;
  section_type: string;
  display_order: number;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  is_locked: boolean;
  is_visible: boolean;
}

interface TemplateForm {
  name: string;
  description: string;
  category: string;
  subject: string;
  preview_text: string;
  layout: string;
  tags: string[];
  is_shared: boolean;
}

const SECTION_TYPES = [
  { type: 'header', label: 'Cabeçalho', icon: Heading1, defaults: { logo_url: '', title: 'Seu Título', subtitle: '', bg_color: '#f8f9fa' } },
  { type: 'text', label: 'Texto', icon: AlignLeft, defaults: { text: '<p>Escreva seu texto aqui...</p>', alignment: 'left' } },
  { type: 'image', label: 'Imagem', icon: Image, defaults: { src: '', alt: '', width: '100%', link: '' } },
  { type: 'button', label: 'Botão', icon: MousePointer, defaults: { text: 'Clique Aqui', url: '#', bg_color: '#3b82f6', text_color: '#ffffff', alignment: 'center', border_radius: '6px' } },
  { type: 'divider', label: 'Divisor', icon: Minus, defaults: { color: '#e5e7eb', width: '100%', style: 'solid' } },
  { type: 'spacer', label: 'Espaçador', icon: Square, defaults: { height: '20px' } },
  { type: 'columns', label: 'Colunas', icon: Columns, defaults: { columns: 2, content: [{ text: 'Coluna 1' }, { text: 'Coluna 2' }] } },
  { type: 'hero', label: 'Hero', icon: Star, defaults: { image: '', title: 'Título Hero', subtitle: 'Subtítulo', button_text: 'Saiba Mais', button_url: '#' } },
  { type: 'social', label: 'Redes Sociais', icon: Share2, defaults: { platforms: [{ name: 'facebook', url: '' }, { name: 'instagram', url: '' }, { name: 'linkedin', url: '' }] } },
  { type: 'video', label: 'Vídeo', icon: Video, defaults: { thumbnail: '', video_url: '', alt: 'Assistir vídeo' } },
  { type: 'footer', label: 'Rodapé', icon: Mail, defaults: { company_name: '', address: '', unsubscribe_text: 'Cancelar inscrição', unsubscribe_url: '{{unsubscribe_url}}' } },
];

const CATEGORIES = ['transactional', 'promotional', 'newsletter', 'onboarding', 'notification', 'retention', 'reactivation'];
const LAYOUTS = ['custom', 'single_column', 'two_column', 'hero_banner', 'minimal'];

const VARIABLES = [
  { key: '{{nome}}', label: 'Nome do contato' },
  { key: '{{email}}', label: 'Email' },
  { key: '{{empresa}}', label: 'Nome da empresa' },
  { key: '{{primeiro_nome}}', label: 'Primeiro nome' },
  { key: '{{sobrenome}}', label: 'Sobrenome' },
  { key: '{{unsubscribe_url}}', label: 'Link de descadastro' },
  { key: '{{view_in_browser_url}}', label: 'Ver no navegador' },
];

export default function EmailTemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<TemplateForm>({
    name: '', description: '', category: 'promotional', subject: '', preview_text: '',
    layout: 'single_column', tags: [], is_shared: false,
  });
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('design');

  

  const fetchTemplate = useCallback( async () => {
    if (!id) return;
    setLoading(true);
    const [templateRes, sectionsRes] = await Promise.all([
      supabase.from('email_templates').select('*').eq('id', id).single(),
      supabase.from('email_template_sections').select('*').eq('template_id', id).order('display_order'),
    ]);

    if (templateRes.error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Template não encontrado' });
      navigate('/marketing');
      return;
    }

    const d = templateRes.data;
    setForm({
      name: d.name || '', description: d.description || '', category: d.category || 'promotional',
      subject: d.subject || '', preview_text: d.preview_text || '', layout: d.layout || 'single_column',
      tags: (d.tags as string[]) || [], is_shared: d.is_shared || false,
    });

    if (sectionsRes.data && sectionsRes.data.length > 0) {
      setSections(sectionsRes.data.map((s: unknown) => ({
        id: s.id, section_type: s.section_type, display_order: s.display_order,
        content: s.content || {}, styles: s.styles || {}, is_locked: s.is_locked || false,
        is_visible: s.is_visible !== false,
      })));
    }
    setLoading(false);
  }, [id, toast, navigate]);

  useEffect(() => {
    if (id) fetchTemplate();
  }, [id, fetchTemplate]);

  const generateHtml = useCallback((): string => {
    const sectionHtml = sections.filter(s => s.is_visible).sort((a, b) => a.display_order - b.display_order).map(s => {
      switch (s.section_type) {
        case 'header':
          return `<div style="background-color:${s.content.bg_color || '#f8f9fa'};padding:30px 20px;text-align:center;">
            ${s.content.logo_url ? `<img src="${s.content.logo_url}" alt="Logo" style="max-height:60px;margin-bottom:16px;" />` : ''}
            <h1 style="margin:0;font-size:24px;color:#1a1a1a;">${s.content.title || ''}</h1>
            ${s.content.subtitle ? `<p style="margin:8px 0 0;color:#666;font-size:14px;">${s.content.subtitle}</p>` : ''}
          </div>`;
        case 'text':
          return `<div style="padding:16px 20px;text-align:${s.content.alignment || 'left'};">${s.content.text || ''}</div>`;
        case 'image':
          return `<div style="padding:16px 20px;text-align:center;">${s.content.link ? `<a href="${s.content.link}">` : ''}<img src="${s.content.src || ''}" alt="${s.content.alt || ''}" style="max-width:${s.content.width || '100%'};height:auto;border-radius:8px;" />${s.content.link ? '</a>' : ''}</div>`;
        case 'button':
          return `<div style="padding:16px 20px;text-align:${s.content.alignment || 'center'};"><a href="${s.content.url || '#'}" style="display:inline-block;padding:12px 32px;background:${s.content.bg_color || '#3b82f6'};color:${s.content.text_color || '#fff'};text-decoration:none;border-radius:${s.content.border_radius || '6px'};font-weight:600;font-size:16px;">${s.content.text || 'Clique'}</a></div>`;
        case 'divider':
          return `<div style="padding:8px 20px;"><hr style="border:none;border-top:1px ${s.content.style || 'solid'} ${s.content.color || '#e5e7eb'};" /></div>`;
        case 'spacer':
          return `<div style="height:${s.content.height || '20px'};"></div>`;
        case 'hero':
          return `<div style="text-align:center;padding:40px 20px;${s.content.image ? `background-image:url(${s.content.image});background-size:cover;background-position:center;` : 'background:#f0f4ff;'}">
            <h1 style="margin:0;font-size:32px;color:${s.content.image ? '#fff' : '#1a1a1a'};">${s.content.title || ''}</h1>
            ${s.content.subtitle ? `<p style="margin:12px 0 24px;font-size:18px;color:${s.content.image ? '#eee' : '#666'};">${s.content.subtitle}</p>` : ''}
            ${s.content.button_text ? `<a href="${s.content.button_url || '#'}" style="display:inline-block;padding:14px 40px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">${s.content.button_text}</a>` : ''}
          </div>`;
        case 'social': {
          const platforms = s.content.platforms || [];
          return `<div style="padding:16px 20px;text-align:center;">${platforms.map((p: unknown) => `<a href="${p.url || '#'}" style="display:inline-block;margin:0 8px;color:#3b82f6;text-decoration:none;font-weight:600;">${p.name}</a>`).join('')}</div>`;
        }
        case 'footer':
          return `<div style="padding:20px;text-align:center;background:#f8f9fa;color:#999;font-size:12px;">
            <p style="margin:0;">${s.content.company_name || ''}</p>
            <p style="margin:4px 0;">${s.content.address || ''}</p>
            <p style="margin:8px 0 0;"><a href="${s.content.unsubscribe_url || '#'}" style="color:#999;">${s.content.unsubscribe_text || 'Cancelar inscrição'}</a></p>
          </div>`;
        default:
          return `<div style="padding:16px 20px;color:#999;">Bloco: ${s.section_type}</div>`;
      }
    }).join('\n');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;}img{max-width:100%;height:auto;}a{color:#3b82f6;}</style>
</head><body><div style="max-width:600px;margin:0 auto;background:#fff;">${sectionHtml}</div></body></html>`;
  }, [sections]);

  const handleSave = async () => {
    if (!profile?.organization_id || !form.name || !form.subject) return;
    setSaving(true);

    const html = generateHtml();
    const vars = VARIABLES.filter(v => html.includes(v.key)).map(v => ({ key: v.key, label: v.label }));

    let savedId = id;
    if (id) {
      const { error } = await supabase.from('email_templates').update({
        name: form.name, description: form.description || null, category: form.category,
        subject: form.subject, preview_text: form.preview_text || null, body_html: html,
        body_json: { sections: sections.map(s => ({ section_type: s.section_type, display_order: s.display_order, content: s.content, styles: s.styles })) } as unknown,
        layout: form.layout, tags: form.tags.length > 0 ? form.tags : null,
        is_shared: form.is_shared, variables: vars as unknown, updated_by: profile.id,
      }).eq('id', id);
      if (error) { toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar template' }); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('email_templates').insert([{
        name: form.name, description: form.description || null, category: form.category,
        subject: form.subject, preview_text: form.preview_text || null, body_html: html,
        body_json: { sections: sections.map(s => ({ section_type: s.section_type, display_order: s.display_order, content: s.content, styles: s.styles })) } as unknown,
        layout: form.layout, tags: form.tags.length > 0 ? form.tags : null,
        is_shared: form.is_shared, organization_id: profile.organization_id,
        variables: vars as unknown, created_by: profile.id,
      }]).select().single();
      if (error) { toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar template' }); setSaving(false); return; }
      savedId = data.id;
    }

    // Salvar seções
    if (savedId) {
      await supabase.from('email_template_sections').delete().eq('template_id', savedId);
      if (sections.length > 0) {
        await supabase.from('email_template_sections').insert(
          sections.map((s, idx) => ({
            template_id: savedId, organization_id: profile.organization_id,
            section_type: s.section_type, display_order: idx,
            content: s.content, styles: s.styles, is_locked: s.is_locked, is_visible: s.is_visible,
          }))
        );
      }
      // Criar versão
      const { data: versions } = await supabase.from('email_template_versions')
        .select('version_number').eq('template_id', savedId).order('version_number', { ascending: false }).limit(1);
      const nextVersion = (versions && versions.length > 0 ? versions[0].version_number : 0) + 1;
      await supabase.from('email_template_versions').insert([{
        template_id: savedId!, organization_id: profile.organization_id,
        version_number: nextVersion, body_html: html,
        body_json: { sections: sections.map(s => ({ section_type: s.section_type, display_order: s.display_order, content: s.content, styles: s.styles })) } as unknown,
        sections: sections as unknown,
        created_by: profile.id,
      }]);
    }

    toast({ title: 'Template salvo', description: `"${form.name}" versão salva com sucesso.` });
    if (!id && savedId) navigate(`/marketing/templates/${savedId}`, { replace: true });
    setSaving(false);
  };

  const addSection = (type: string) => {
    const config = SECTION_TYPES.find(s => s.type === type);
    if (!config) return;
    const newSection: TemplateSection = {
      id: crypto.randomUUID(), section_type: type,
      display_order: sections.length, content: { ...config.defaults },
      styles: {}, is_locked: false, is_visible: true,
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(s => s.id === sectionId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((s, i) => ({ ...s, display_order: i }));
    });
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const dup: TemplateSection = { ...section, id: crypto.randomUUID(), display_order: section.display_order + 1 };
    setSections(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(s => s.id === sectionId);
      arr.splice(idx + 1, 0, dup);
      return arr.map((s, i) => ({ ...s, display_order: i }));
    });
  };

  const updateSectionContent = (sectionId: string, key: string, value: unknown) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content: { ...s.content, [key]: value } } : s));
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/marketing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{isEditing ? 'Editar Template' : 'Novo Template'}</h1>
            <p className="text-sm text-muted-foreground">Editor visual de emails</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="mr-1 h-4 w-4" />{showPreview ? 'Editor' : 'Preview'}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.name || !form.subject}>
            {saving ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Section Palette */}
        <div className="w-56 border-r bg-muted/30 overflow-y-auto shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Blocos</h3>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TYPES.map(({ type, label, icon: Icon }) => (
                <button key={type} onClick={() => addSection(type)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors text-xs text-muted-foreground hover:text-foreground">
                  <Icon className="h-5 w-5" /><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Variáveis</h3>
            <div className="space-y-1">
              {VARIABLES.map(v => (
                <button key={v.key} onClick={() => navigator.clipboard.writeText(v.key)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors">
                  <code className="text-primary">{v.key}</code>
                  <span className="block text-muted-foreground">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Canvas / Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-2 w-fit">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="code">Código HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="flex-1 p-4">
              {showPreview ? (
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant={previewMode === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewMode('desktop')}>Desktop</Button>
                    <Button variant={previewMode === 'mobile' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewMode('mobile')}>Mobile</Button>
                  </div>
                  <div className={`mx-auto bg-background rounded-lg border shadow-sm overflow-hidden ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'}`}>
                    <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b">
                      <strong>Assunto:</strong> {form.subject || '(sem assunto)'}
                      {form.preview_text && <span className="ml-2 text-muted-foreground/60">— {form.preview_text}</span>}
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: generateHtml() }} />
                  </div>
                </div>
              ) : (
                <div className="max-w-[600px] mx-auto space-y-2">
                  {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                      <LayoutTemplate className="h-12 w-12 mb-4 opacity-50" />
                      <p className="font-medium mb-1">Comece adicionando blocos</p>
                      <p className="text-sm">Clique nos blocos à esquerda para montar seu email</p>
                    </div>
                  ) : (
                    sections.sort((a, b) => a.display_order - b.display_order).map((section) => {
                      const config = SECTION_TYPES.find(s => s.type === section.section_type);
                      const Icon = config?.icon || Type;
                      const isSelected = selectedSectionId === section.id;

                      return (
                        <div key={section.id}
                          className={`group relative border rounded-lg transition-all cursor-pointer ${
                            isSelected ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/50'
                          } ${!section.is_visible ? 'opacity-40' : ''}`}
                          onClick={() => setSelectedSectionId(section.id)}>
                          {/* Section toolbar */}
                          <div className="absolute -top-3 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Badge variant="secondary" className="text-xs gap-1 py-0">
                              <Icon className="h-3 w-3" />{config?.label}
                            </Badge>
                          </div>
                          <div className="absolute -top-3 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button variant="secondary" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button variant="secondary" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button variant="secondary" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {/* Section preview */}
                          <div className="p-4 pointer-events-none" dangerouslySetInnerHTML={{
                            __html: (() => {
                              const c = section.content;
                              switch (section.section_type) {
                                case 'header': return `<div style="text-align:center;padding:10px;background:${c.bg_color || '#f8f9fa'};border-radius:6px;"><strong>${c.title || 'Cabeçalho'}</strong>${c.subtitle ? `<br/><small style="color:#666">${c.subtitle}</small>` : ''}</div>`;
                                case 'text': return `<div style="text-align:${c.alignment || 'left'}">${c.text || '<em>Texto vazio</em>'}</div>`;
                                case 'image': return c.src ? `<div style="text-align:center"><img src="${c.src}" style="max-width:100%;max-height:200px;border-radius:6px" /></div>` : '<div style="text-align:center;padding:20px;background:#f3f4f6;border-radius:6px;color:#999">📷 Imagem</div>';
                                case 'button': return `<div style="text-align:${c.alignment || 'center'}"><span style="display:inline-block;padding:8px 24px;background:${c.bg_color || '#3b82f6'};color:${c.text_color || '#fff'};border-radius:${c.border_radius || '6px'};font-weight:600">${c.text || 'Botão'}</span></div>`;
                                case 'divider': return `<hr style="border:none;border-top:1px ${c.style || 'solid'} ${c.color || '#e5e7eb'}" />`;
                                case 'spacer': return `<div style="height:${c.height || '20px'}"></div>`;
                                case 'hero': return `<div style="text-align:center;padding:24px;background:#f0f4ff;border-radius:6px"><strong style="font-size:20px">${c.title || 'Hero'}</strong><br/><span style="color:#666">${c.subtitle || ''}</span></div>`;
                                case 'social': return '<div style="text-align:center;padding:8px;color:#666">🔗 Redes Sociais</div>';
                                case 'footer': return `<div style="text-align:center;padding:12px;background:#f8f9fa;border-radius:6px;color:#999;font-size:12px">${c.company_name || 'Rodapé'}</div>`;
                                default: return `<div style="padding:8px;color:#999">${section.section_type}</div>`;
                              }
                            })()
                          }} />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-4">
              <div className="max-w-xl mx-auto space-y-6">
                <Card>
                  <CardHeader><CardTitle>Informações do Template</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Newsletter Semanal" />
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Descrição interna do template..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Assunto do Email *</Label>
                      <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Ex: {{primeiro_nome}}, confira as novidades!" />
                    </div>
                    <div className="space-y-2">
                      <Label>Preview Text</Label>
                      <Input value={form.preview_text} onChange={e => setForm({ ...form, preview_text: e.target.value })} placeholder="Texto que aparece junto ao assunto na inbox" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Layout</Label>
                        <Select value={form.layout} onValueChange={v => setForm({ ...form, layout: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LAYOUTS.map(l => <SelectItem key={l} value={l}>{l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3 pt-7">
                        <Switch checked={form.is_shared} onCheckedChange={v => setForm({ ...form, is_shared: v })} />
                        <Label>Compartilhar com a equipe</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 p-4">
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" />HTML Gerado</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea value={generateHtml()} rows={30} readOnly className="font-mono text-xs" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Section Properties */}
        {selectedSection && !showPreview && activeTab === 'design' && (
          <div className="w-72 border-l bg-background overflow-y-auto shrink-0">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Propriedades</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedSectionId(null)}>✕</Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={selectedSection.is_visible}
                  onCheckedChange={v => setSections(prev => prev.map(s => s.id === selectedSection.id ? { ...s, is_visible: v } : s))} />
                <Label className="text-xs">Visível</Label>
              </div>
              <Separator />
              {/* Dynamic properties based on section type */}
              {selectedSection.section_type === 'header' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Logo URL</Label><Input value={selectedSection.content.logo_url || ''} onChange={e => updateSectionContent(selectedSection.id, 'logo_url', e.target.value)} placeholder="https://..." className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Título</Label><Input value={selectedSection.content.title || ''} onChange={e => updateSectionContent(selectedSection.id, 'title', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Subtítulo</Label><Input value={selectedSection.content.subtitle || ''} onChange={e => updateSectionContent(selectedSection.id, 'subtitle', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Cor de Fundo</Label><Input type="color" value={selectedSection.content.bg_color || '#f8f9fa'} onChange={e => updateSectionContent(selectedSection.id, 'bg_color', e.target.value)} className="h-8" /></div>
                </div>
              )}
              {selectedSection.section_type === 'text' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Texto (HTML)</Label><Textarea value={selectedSection.content.text || ''} onChange={e => updateSectionContent(selectedSection.id, 'text', e.target.value)} rows={6} className="text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Alinhamento</Label>
                    <Select value={selectedSection.content.alignment || 'left'} onValueChange={v => updateSectionContent(selectedSection.id, 'alignment', v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Direita</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {selectedSection.section_type === 'image' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">URL da Imagem</Label><Input value={selectedSection.content.src || ''} onChange={e => updateSectionContent(selectedSection.id, 'src', e.target.value)} placeholder="https://..." className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Texto Alternativo</Label><Input value={selectedSection.content.alt || ''} onChange={e => updateSectionContent(selectedSection.id, 'alt', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Link (opcional)</Label><Input value={selectedSection.content.link || ''} onChange={e => updateSectionContent(selectedSection.id, 'link', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Largura</Label><Input value={selectedSection.content.width || '100%'} onChange={e => updateSectionContent(selectedSection.id, 'width', e.target.value)} className="h-8 text-xs" /></div>
                </div>
              )}
              {selectedSection.section_type === 'button' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Texto do Botão</Label><Input value={selectedSection.content.text || ''} onChange={e => updateSectionContent(selectedSection.id, 'text', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">URL</Label><Input value={selectedSection.content.url || ''} onChange={e => updateSectionContent(selectedSection.id, 'url', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Cor de Fundo</Label><Input type="color" value={selectedSection.content.bg_color || '#3b82f6'} onChange={e => updateSectionContent(selectedSection.id, 'bg_color', e.target.value)} className="h-8" /></div>
                  <div className="space-y-1"><Label className="text-xs">Cor do Texto</Label><Input type="color" value={selectedSection.content.text_color || '#ffffff'} onChange={e => updateSectionContent(selectedSection.id, 'text_color', e.target.value)} className="h-8" /></div>
                  <div className="space-y-1"><Label className="text-xs">Border Radius</Label><Input value={selectedSection.content.border_radius || '6px'} onChange={e => updateSectionContent(selectedSection.id, 'border_radius', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Alinhamento</Label>
                    <Select value={selectedSection.content.alignment || 'center'} onValueChange={v => updateSectionContent(selectedSection.id, 'alignment', v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="left">Esquerda</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="right">Direita</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {selectedSection.section_type === 'divider' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Cor</Label><Input type="color" value={selectedSection.content.color || '#e5e7eb'} onChange={e => updateSectionContent(selectedSection.id, 'color', e.target.value)} className="h-8" /></div>
                  <div className="space-y-1"><Label className="text-xs">Estilo</Label>
                    <Select value={selectedSection.content.style || 'solid'} onValueChange={v => updateSectionContent(selectedSection.id, 'style', v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="solid">Sólido</SelectItem><SelectItem value="dashed">Tracejado</SelectItem><SelectItem value="dotted">Pontilhado</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {selectedSection.section_type === 'spacer' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Altura</Label><Input value={selectedSection.content.height || '20px'} onChange={e => updateSectionContent(selectedSection.id, 'height', e.target.value)} className="h-8 text-xs" /></div>
                </div>
              )}
              {selectedSection.section_type === 'hero' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Imagem de Fundo</Label><Input value={selectedSection.content.image || ''} onChange={e => updateSectionContent(selectedSection.id, 'image', e.target.value)} placeholder="https://..." className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Título</Label><Input value={selectedSection.content.title || ''} onChange={e => updateSectionContent(selectedSection.id, 'title', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Subtítulo</Label><Input value={selectedSection.content.subtitle || ''} onChange={e => updateSectionContent(selectedSection.id, 'subtitle', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Texto do Botão</Label><Input value={selectedSection.content.button_text || ''} onChange={e => updateSectionContent(selectedSection.id, 'button_text', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">URL do Botão</Label><Input value={selectedSection.content.button_url || ''} onChange={e => updateSectionContent(selectedSection.id, 'button_url', e.target.value)} className="h-8 text-xs" /></div>
                </div>
              )}
              {selectedSection.section_type === 'footer' && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Nome da Empresa</Label><Input value={selectedSection.content.company_name || ''} onChange={e => updateSectionContent(selectedSection.id, 'company_name', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input value={selectedSection.content.address || ''} onChange={e => updateSectionContent(selectedSection.id, 'address', e.target.value)} className="h-8 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Texto Descadastro</Label><Input value={selectedSection.content.unsubscribe_text || ''} onChange={e => updateSectionContent(selectedSection.id, 'unsubscribe_text', e.target.value)} className="h-8 text-xs" /></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
