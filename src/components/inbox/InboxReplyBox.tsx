import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Send,
  Paperclip,
  EyeOff,
  MessageSquare,
  Smile,
  Bold,
  Italic,
  Link,
  CornerDownLeft,
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
    // Ctrl/Cmd + Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Detect shortcut patterns like /something
    if (e.key === '/' && message === '') {
      // Let the user type the shortcut
    }
  };

  const handleCannedResponseSelect = (content: string) => {
    setMessage(prev => prev ? `${prev}\n${content}` : content);
    textareaRef.current?.focus();
  };

  return (
    <div className={cn(
      'border-t bg-card',
      isInternal && 'bg-amber-50/50 dark:bg-amber-950/10 border-t-amber-200 dark:border-t-amber-800'
    )}>
      {/* Internal note indicator */}
      {isInternal && (
        <div className="px-4 pt-2 flex items-center gap-2">
          <EyeOff className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Nota interna — não visível para o cliente
          </span>
        </div>
      )}

      {/* Textarea */}
      <div className="px-4 pt-2 pb-1">
        <Textarea
          ref={textareaRef}
          placeholder={isInternal ? 'Escreva uma nota interna...' : 'Digite sua resposta...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'min-h-[80px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm',
            isInternal && 'placeholder:text-amber-500/70'
          )}
          disabled={disabled || sending}
        />
      </div>

      {/* Toolbar */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {/* Canned Response */}
          <CannedResponsePicker
            onSelect={handleCannedResponseSelect}
            contactId={contactId || undefined}
            variant="icon"
            className="h-8 w-8"
          />

          {/* Attachment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
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
                size="icon"
                className={cn('h-8 w-8', isInternal && 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300')}
                onClick={() => setIsInternal(!isInternal)}
                disabled={disabled}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInternal ? 'Voltar para resposta pública' : 'Nota interna (não visível para o cliente)'}
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
                <Bold className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Negrito</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
                <Italic className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Itálico</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
                <Link className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inserir link</TooltipContent>
          </Tooltip>
        </div>

        {/* Send button */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            Ctrl+Enter
          </span>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || sending || disabled}
            className={cn(
              'gap-1.5',
              isInternal && 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {sending ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isInternal ? (
              <EyeOff className="h-3.5 w-3.5" />
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
