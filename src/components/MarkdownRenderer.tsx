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

  const saveAsFile = (code: string, language: string, codeId: string) => {
    // Get the actual text content from the code element
    const codeElement = document.querySelector(`[data-code-id="${codeId}"]`);
    const actualCode = codeElement ? codeElement.textContent || code : code;
    
    // Map language to file extension and MIME type
    const fileTypeMap: Record<string, { ext: string; mime: string }> = {
      html: { ext: '.html', mime: 'text/html' },
      htm: { ext: '.html', mime: 'text/html' },
      javascript: { ext: '.js', mime: 'text/javascript' },
      js: { ext: '.js', mime: 'text/javascript' },
      typescript: { ext: '.ts', mime: 'text/typescript' },
      ts: { ext: '.ts', mime: 'text/typescript' },
      jsx: { ext: '.jsx', mime: 'text/jsx' },
      tsx: { ext: '.tsx', mime: 'text/tsx' },
      css: { ext: '.css', mime: 'text/css' },
      scss: { ext: '.scss', mime: 'text/x-scss' },
      sass: { ext: '.sass', mime: 'text/x-sass' },
      less: { ext: '.less', mime: 'text/x-less' },
      python: { ext: '.py', mime: 'text/x-python' },
      py: { ext: '.py', mime: 'text/x-python' },
      java: { ext: '.java', mime: 'text/x-java' },
      cpp: { ext: '.cpp', mime: 'text/x-c++src' },
      c: { ext: '.c', mime: 'text/x-csrc' },
      csharp: { ext: '.cs', mime: 'text/x-csharp' },
      cs: { ext: '.cs', mime: 'text/x-csharp' },
      php: { ext: '.php', mime: 'application/x-php' },
      ruby: { ext: '.rb', mime: 'text/x-ruby' },
      rb: { ext: '.rb', mime: 'text/x-ruby' },
      go: { ext: '.go', mime: 'text/x-go' },
      rust: { ext: '.rs', mime: 'text/x-rust' },
      rs: { ext: '.rs', mime: 'text/x-rust' },
      swift: { ext: '.swift', mime: 'text/x-swift' },
      kotlin: { ext: '.kt', mime: 'text/x-kotlin' },
      sql: { ext: '.sql', mime: 'application/sql' },
      json: { ext: '.json', mime: 'application/json' },
      xml: { ext: '.xml', mime: 'application/xml' },
      yaml: { ext: '.yaml', mime: 'text/yaml' },
      yml: { ext: '.yml', mime: 'text/yaml' },
      markdown: { ext: '.md', mime: 'text/markdown' },
      md: { ext: '.md', mime: 'text/markdown' },
      bash: { ext: '.sh', mime: 'application/x-sh' },
      sh: { ext: '.sh', mime: 'application/x-sh' },
      shell: { ext: '.sh', mime: 'application/x-sh' },
      powershell: { ext: '.ps1', mime: 'application/x-powershell' },
      dockerfile: { ext: '.dockerfile', mime: 'text/plain' },
      plaintext: { ext: '.txt', mime: 'text/plain' },
      text: { ext: '.txt', mime: 'text/plain' },
    };

    const fileType = fileTypeMap[language.toLowerCase()] || { ext: '.txt', mime: 'text/plain' };
    const filename = `code_${Date.now()}${fileType.ext}`;

    try {
      // Use proper MIME type for better browser handling
      const blob = new Blob([actualCode], { type: `${fileType.mime};charset=utf-8` });
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
                        onClick={() => saveAsFile(codeString, match[1], codeId)}
                        title="Save as file"
                      >
                        💾 Save As
                      </button>
                    </div>
                  </div>
                  <pre className={className}>
                    <code className={className} data-code-id={codeId} {...props}>
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
