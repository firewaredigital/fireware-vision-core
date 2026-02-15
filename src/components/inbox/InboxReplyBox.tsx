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
        <div className="px-3 pt-2 flex items-center gap-1.5 animate-fade-in">
          <Lock className="h-3 w-3 text-amber-600" />
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            Nota interna — não visível para o cliente
          </span>
        </div>
      )}

      {/* Textarea */}
      <div className="px-3 pt-1.5 pb-0.5">
        <Textarea
          ref={textareaRef}
          placeholder={isInternal ? 'Escreva uma nota interna...' : 'Digite sua resposta...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'min-h-[60px] max-h-[140px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-[13px] leading-relaxed bg-transparent',
            isInternal && 'placeholder:text-amber-500/70'
          )}
          disabled={disabled || sending}
        />
      </div>

      {/* Toolbar */}
      <div className="px-3 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {/* Canned Response */}
          <CannedResponsePicker
            onSelect={handleCannedResponseSelect}
            contactId={contactId || undefined}
            variant="icon"
            className="h-7 w-7 rounded-lg"
          />

          {/* Attachment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={disabled}>
                <Paperclip className="h-3 w-3" />
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
                  'h-7 rounded-lg transition-all',
                  isInternal
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 gap-1 rounded-full'
                    : 'w-7'
                )}
                onClick={() => setIsInternal(!isInternal)}
                disabled={disabled}
              >
                <Lock className="h-3 w-3" />
                {isInternal && <span className="text-[10px] font-medium">Interno</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInternal ? 'Voltar para resposta pública' : 'Nota interna (não visível para o cliente)'}
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border/50 mx-1" />

          {/* Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={disabled}>
                <Bold className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Negrito</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={disabled}>
                <Italic className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Itálico</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={disabled}>
                <Link className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inserir link</TooltipContent>
          </Tooltip>
        </div>

        {/* Send button */}
        <div className="flex items-center gap-2">
          <kbd className="bg-muted rounded-md px-1 py-0 text-[9px] font-mono border border-border/50 text-muted-foreground hidden sm:inline-flex items-center gap-0.5">
            Ctrl+Enter
          </kbd>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || sending || disabled}
            className={cn(
              'h-7 px-3 gap-1 rounded-full font-semibold text-[11px] shadow-sm',
              isInternal && 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {sending ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isInternal ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            {isInternal ? 'Nota' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
