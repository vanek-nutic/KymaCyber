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

  const saveAsFile = (code: string, language: string) => {
    // Map language to file extension
    const extensionMap: Record<string, string> = {
      html: '.html',
      htm: '.html',
      javascript: '.js',
      js: '.js',
      typescript: '.ts',
      ts: '.ts',
      jsx: '.jsx',
      tsx: '.tsx',
      css: '.css',
      scss: '.scss',
      sass: '.sass',
      less: '.less',
      python: '.py',
      py: '.py',
      java: '.java',
      cpp: '.cpp',
      c: '.c',
      csharp: '.cs',
      cs: '.cs',
      php: '.php',
      ruby: '.rb',
      rb: '.rb',
      go: '.go',
      rust: '.rs',
      rs: '.rs',
      swift: '.swift',
      kotlin: '.kt',
      sql: '.sql',
      json: '.json',
      xml: '.xml',
      yaml: '.yaml',
      yml: '.yml',
      markdown: '.md',
      md: '.md',
      bash: '.sh',
      sh: '.sh',
      shell: '.sh',
      powershell: '.ps1',
      dockerfile: '.dockerfile',
      plaintext: '.txt',
      text: '.txt',
    };

    const extension = extensionMap[language.toLowerCase()] || '.txt';
    const filename = `code_${Date.now()}${extension}`;

    try {
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Saved as ${filename}`, {
        duration: 2000,
        position: 'bottom-right',
        style: {
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          color: 'white',
          fontWeight: '600',
        },
      });
    } catch (err) {
      toast.error('Failed to save file', {
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
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            // Extract text content properly from children
            let codeString = '';
            if (typeof children === 'string') {
              codeString = children;
            } else if (Array.isArray(children)) {
              codeString = children.map(child => 
                typeof child === 'string' ? child : String(child)
              ).join('');
            } else {
              codeString = String(children);
            }
            codeString = codeString.replace(/\n$/, '');
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

            if (!inline && match) {
              return (
                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <span className="code-language">{match[1]}</span>
                    <div className="code-actions">
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(codeString, codeId)}
                        title="Copy code"
                      >
                        {copiedCode === codeId ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button
                        className="save-button"
                        onClick={() => saveAsFile(codeString, match[1])}
                        title="Save as file"
                      >
                        💾 Save As
                      </button>
                    </div>
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
