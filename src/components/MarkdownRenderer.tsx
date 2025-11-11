import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { useState } from 'react';
import toast from 'react-hot-toast';
import './MarkdownRenderer.css';
import 'highlight.js/styles/atom-one-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      toast.success('Copied to clipboard!', {
        duration: 2000,
        position: 'bottom-right',
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: '600',
        },
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error('Failed to copy', {
        duration: 2000,
        position: 'bottom-right',
      });
    }
  };

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

            if (!inline && match) {
              return (
                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <span className="code-language">{match[1]}</span>
                    <button
                      className="copy-button"
                      onClick={() => copyToClipboard(codeString, codeId)}
                      title="Copy code"
                    >
                      {copiedCode === codeId ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className={className}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ node, children, href, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          table({ node, children, ...props }) {
            return (
              <div className="table-wrapper">
                <table {...props}>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
