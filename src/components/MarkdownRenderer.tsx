import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to format inline markdown (bold, italic, inline code)
  const formatInline = (text: string): React.ReactNode => {
    // Split by inline code first
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-200/70 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Handle bold and italic
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
          return (
            <strong key={`${index}-${bIdx}`} className="font-semibold text-slate-900 dark:text-white">
              {bPart.slice(2, -2)}
            </strong>
          );
        }

        const italicParts = bPart.split(/(\*[^*]+\*)/g);
        return italicParts.map((iPart, iIdx) => {
          if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
            return (
              <em key={`${index}-${bIdx}-${iIdx}`} className="italic">
                {iPart.slice(1, -1)}
              </em>
            );
          }
          return iPart;
        });
      });
    });
  };

  // Parse lines and blocks
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let codeBlockIdx = 0;
    let tableBlockIdx = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code block start
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        const fullCode = codeLines.join('\n');
        const currentIdx = codeBlockIdx++;

        elements.push(
          <div
            key={`code-${currentIdx}`}
            className="my-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/80 border-b border-slate-800/80 text-xs text-slate-400">
              <span className="font-mono text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-800/50 uppercase text-[10px] tracking-wider">
                {lang}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(fullCode, currentIdx)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition-all font-medium text-[11px]"
                title="Copy Code"
              >
                {copiedIndex === currentIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs md:text-sm font-mono overflow-x-auto leading-relaxed text-slate-200">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        i++;
        continue;
      }

      // Markdown Table check
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }

        if (tableLines.length >= 2) {
          const currentTableIdx = tableBlockIdx++;
          const headerCells = tableLines[0]
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());

          const bodyLines = tableLines.slice(1).filter((l) => !l.includes('---'));

          elements.push(
            <div
              key={`table-${currentTableIdx}`}
              className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5 font-bold">
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {bodyLines.map((row, rIdx) => {
                    const cells = row
                      .split('|')
                      .slice(1, -1)
                      .map((c) => c.trim());
                    return (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">
                            {formatInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Horizontal rule
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(
          <hr
            key={`hr-${i}`}
            className="my-4 border-t border-slate-200 dark:border-slate-800"
          />
        );
        i++;
        continue;
      }

      // Headings
      if (line.startsWith('#### ')) {
        elements.push(
          <h4
            key={`h4-${i}`}
            className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1"
          >
            {formatInline(line.slice(5))}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-4 mb-1.5 flex items-center gap-1.5"
          >
            {formatInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${i}`}
            className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-200/80 dark:border-slate-800"
          >
            {formatInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-4 mb-3 tracking-tight"
          >
            {formatInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-2.5 pl-3 py-1.5 border-l-3 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-700 dark:text-slate-300 italic text-xs md:text-sm rounded-r"
          >
            {formatInline(line.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Checkbox list
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        const isChecked = line.trim().startsWith('- [x]');
        const text = line.trim().slice(5).trim();
        elements.push(
          <div key={`check-${i}`} className="flex items-start gap-2 my-1 text-xs md:text-sm text-slate-700 dark:text-slate-300">
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 shrink-0 ${
                isChecked
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span className={isChecked ? 'line-through text-slate-400' : ''}>
              {formatInline(text)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // Unordered lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ')) {
        const itemText = line.trim().slice(2);
        elements.push(
          <li
            key={`li-${i}`}
            className="ml-4 list-disc text-xs md:text-sm text-slate-700 dark:text-slate-300 my-0.5 leading-relaxed"
          >
            {formatInline(itemText)}
          </li>
        );
        i++;
        continue;
      }

      // Numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        elements.push(
          <div
            key={`num-${i}`}
            className="flex items-baseline gap-2 text-xs md:text-sm text-slate-700 dark:text-slate-300 my-1 leading-relaxed"
          >
            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
              {numMatch[1]}.
            </span>
            <span>{formatInline(numMatch[2])}</span>
          </div>
        );
        i++;
        continue;
      }

      // Empty line
      if (!line.trim()) {
        elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
        i++;
        continue;
      }

      // Regular paragraph
      elements.push(
        <p
          key={`p-${i}`}
          className="text-xs md:text-sm text-slate-700 dark:text-slate-300 my-1 leading-relaxed"
        >
          {formatInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return <div className={`space-y-0.5 leading-relaxed ${className}`}>{renderBlocks()}</div>;
};
