import { Message } from '@/types/chat';
import { Copy, ThumbsUp, ThumbsDown, RotateCw, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface ChatMessageProps {
  message: Message;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const { toast } = useToast();
  const themeContext = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback to light theme if theme provider is not available
  const theme = themeContext?.theme || 'light';
  const systemTheme = themeContext?.systemTheme || 'light';
  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Code copied to clipboard',
      });
      // Reset to copy icon after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(() => {
      toast({
        title: 'Error',
        description: 'Failed to copy code',
        variant: 'destructive',
      });
    });
  };

  return (
    <div className="relative my-4 mb-4 rounded-xl overflow-hidden bg-muted/40 border border-border/50 w-full">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">{language === 'text' ? '' : language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1.5"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          <span>{copied ? 'Copied' : 'Copy code'}</span>
        </Button>
      </div>
      {/* Code content */}
      <div className="overflow-x-auto w-full">
        <SyntaxHighlighter
          language={language === 'text' ? 'plaintext' : language}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            minWidth: '100%',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              whiteSpace: 'pre',
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export function ChatMessage({ message, onLike, onDislike, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleDownloadImage = (url: string) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    
    // Get file extension from URL or default to png
    let extension = 'png';
    if (url.includes('.')) {
      const urlParts = url.split('.');
      const potentialExt = urlParts[urlParts.length - 1].split('?')[0].toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(potentialExt)) {
        extension = potentialExt;
      }
    }
    
    // Create filename with timestamp
    link.download = `image_${Date.now()}.${extension}`;
    
    // For data URLs or same-origin images, this works directly
    // For cross-origin images, we need to fetch and convert to blob
    if (url.startsWith('data:') || url.startsWith(window.location.origin)) {
      link.click();
    } else {
      // Fetch the image and convert to blob for download
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          link.click();
          // Clean up the blob URL
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        })
        .catch(() => {
          // Fallback: try direct download
          link.click();
        });
    }
  };

  return (
    <div className={`flex gap-2 sm:gap-4 px-2 sm:px-4 py-4 sm:py-6 transition-colors ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col space-y-2 overflow-hidden min-w-0 w-full ${isUser ? 'items-end max-w-[85%] sm:max-w-[80%]' : 'items-start w-full max-w-full'}`}>
        {/* Message bubble */}
        <div className={`rounded-3xl px-3 py-2 sm:px-4 sm:py-2.5 ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted/50 text-foreground'
        }`}>
          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
            {isUser ? (
              <p className="whitespace-pre-wrap break-words leading-relaxed m-0">{message.content}</p>
            ) : (
              <div className="leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0 m-0">{children}</p>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mb-2 mt-5 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 ml-4">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    pre: ({ children }) => {
                      // ReactMarkdown wraps code blocks in pre > code
                      const codeProps = (children as any)?.props;
                      if (!codeProps) {
                        return <pre>{children}</pre>;
                      }
                      
                      const code = String(codeProps.children || '').replace(/\n$/, '');
                      const className = codeProps.className || '';
                      const language = className.replace(/language-/, '') || 'text';
                      
                      return (
                        <div className="relative my-4 mx-2 sm:mx-4">
                          <CodeBlock code={code} language={language} />
                        </div>
                      );
                    },
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-muted/70 px-1.5 py-0.5 rounded-md text-sm font-mono">{children}</code>
                      ) : (
                        <code className="text-sm font-mono">{children}</code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-border pl-4 italic my-4 text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-6 border-border" />,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    a: ({ href, children }) => (
                      <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    img: ({ src, alt, ...props }) => {
                      // Limit display size to medium (max 480px width/height)
                      // But keep original URL for full-size download
                      return (
                        <div className="my-4 inline-block max-w-xl relative group">
                          <img
                            src={src}
                            alt={alt}
                            className="max-w-full h-auto rounded-lg border border-border/50 object-contain"
                            style={{ maxWidth: '480px', maxHeight: '480px' }}
                            {...props}
                          />
                          {/* Download button on hover - top right corner */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(src || '');
                            }}
                            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download image"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isUser && (
          <div className="flex items-center gap-0.5 sm:gap-1 pt-1 px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                // Copy the whole response
                navigator.clipboard.writeText(message.content).then(() => {
                  setCopied(true);
                  toast({
                    title: 'Copied',
                    description: 'Response copied to clipboard',
                  });
                  // Reset to copy icon after 2 seconds
                  setTimeout(() => {
                    setCopied(false);
                  }, 2000);
                }).catch(() => {
                  toast({
                    title: 'Error',
                    description: 'Failed to copy response',
                    variant: 'destructive',
                  });
                });
              }}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 sm:h-8 sm:w-8 ${
                message.feedback === 'like'
                  ? 'text-primary hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                onLike?.(message.id);
                toast({
                  title: message.feedback === 'like' ? 'Like removed' : 'Liked',
                  description: message.feedback === 'like' ? 'Removed your like' : 'Thank you for your feedback',
                });
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 sm:h-8 sm:w-8 ${
                message.feedback === 'dislike'
                  ? 'text-destructive hover:text-destructive'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                onDislike?.(message.id);
                toast({
                  title: message.feedback === 'dislike' ? 'Dislike removed' : 'Disliked',
                  description: message.feedback === 'dislike' ? 'Removed your dislike' : 'Thank you for your feedback',
                });
              }}
            >
              <ThumbsDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                onRegenerate?.(message.id);
              }}
            >
              <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
