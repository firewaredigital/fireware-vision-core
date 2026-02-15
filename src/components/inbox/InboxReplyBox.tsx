import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Send,
  Paperclip,
  EyeOff,
  Smile,
  Bold,
  Italic,
  Link,
  Lock,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { CannedResponsePicker } from '@/components/service/CannedResponsePicker';

interface InboxReplyBoxProps {
  conversationId: string;
  contactId?: string | null;
  onSend: (content: string, isInternal: boolean) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
}

export function InboxReplyBox({
  conversationId,
  contactId,
  onSend,
  sending,
  disabled = false,
}: InboxReplyBoxProps) {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    if (!message.trim() || sending) return;
    const success = await onSend(message.trim(), isInternal);
    if (success) {
      setMessage('');
      setIsInternal(false);
      textareaRef.current?.focus();
    }
  }, [message, isInternal, sending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCannedResponseSelect = (content: string) => {
    setMessage(prev => prev ? `${prev}\n${content}` : content);
    textareaRef.current?.focus();
  };

  return (
    <div className={cn(
      'bg-card rounded-t-2xl shadow-[0_-2px_12px_-4px_rgba(0,0,0,0.08)]',
      isInternal && 'border-l-[3px] border-l-amber-400'
    )}>
      {/* Internal note indicator */}
      {isInternal && (
        <div className="px-4 pt-3 flex items-center gap-2 animate-fade-in">
          <Lock className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Nota interna — não visível para o cliente
          </span>
        </div>
      )}

      {/* Textarea */}
      <div className="px-4 pt-3 pb-1">
        <Textarea
          ref={textareaRef}
          placeholder={isInternal ? 'Escreva uma nota interna...' : 'Digite sua resposta...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'min-h-[100px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm leading-relaxed bg-transparent',
            isInternal && 'placeholder:text-amber-500/70'
          )}
          disabled={disabled || sending}
        />
      </div>

      {/* Toolbar */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {/* Canned Response */}
          <CannedResponsePicker
            onSelect={handleCannedResponseSelect}
            contactId={contactId || undefined}
            variant="icon"
            className="h-8 w-8 rounded-lg"
          />

          {/* Attachment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={disabled}>
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Anexar arquivo</TooltipContent>
          </Tooltip>

          {/* Toggle Internal */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isInternal ? 'secondary' : 'ghost'}
                size={isInternal ? 'sm' : 'icon'}
                className={cn(
                  'h-8 rounded-lg transition-all',
                  isInternal
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-3 gap-1.5 rounded-full'
                    : 'w-8'
                )}
                onClick={() => setIsInternal(!isInternal)}
                disabled={disabled}
              >
                <Lock className="h-3.5 w-3.5" />
                {isInternal && <span className="text-xs font-medium">Interno</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInternal ? 'Voltar para resposta pública' : 'Nota interna (não visível para o cliente)'}
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border/50 mx-1.5" />

          {/* Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={disabled}>
                <Bold className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Negrito</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={disabled}>
                <Italic className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Itálico</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={disabled}>
                <Link className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inserir link</TooltipContent>
          </Tooltip>
        </div>

        {/* Send button */}
        <div className="flex items-center gap-2.5">
          <kbd className="bg-muted rounded-md px-1.5 py-0.5 text-[10px] font-mono border border-border/50 text-muted-foreground hidden sm:inline-flex items-center gap-0.5">
            Ctrl+Enter
          </kbd>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || sending || disabled}
            className={cn(
              'h-9 px-5 gap-1.5 rounded-full font-semibold shadow-sm',
              isInternal && 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {sending ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isInternal ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isInternal ? 'Nota' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
