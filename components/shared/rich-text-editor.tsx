'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Undo,
  Redo,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  command: string;
  arg?: string;
  label: string;
  isActive?: boolean;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Mulai menulis artikel...',
  className,
  minHeight = '360px'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSerif, setIsSerif] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Keep track of active formatting states
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
    h2: false,
    h3: false,
    blockquote: false
  });

  const updateActiveStates = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const formatBlock = document.queryCommandValue('formatBlock');
      setActiveStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        h2: formatBlock === 'h2' || formatBlock === 'H2',
        h3: formatBlock === 'h3' || formatBlock === 'H3',
        blockquote: formatBlock === 'blockquote' || formatBlock === 'BLOCKQUOTE'
      });
    } catch {
      // queryCommandState might fail if editor is not focused/initialized
    }
  }, []);

  // Initialize and track content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      const textContent = editorRef.current.textContent || '';
      setIsEmpty(!value.trim() || value === '<p></p>' || value === '<p><br></p>');
      setCharCount(textContent.length);
      setWordCount(textContent.trim().split(/\s+/).filter(Boolean).length);
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const textContent = editorRef.current.textContent || '';

    setIsEmpty(!textContent.trim() && !html.includes('<img') && !html.includes('<hr'));
    setCharCount(textContent.length);
    setWordCount(textContent.trim().split(/\s+/).filter(Boolean).length);

    onChange?.(html);
    updateActiveStates();
  }, [onChange, updateActiveStates]);

  const execCommand = useCallback(
    (command: string, arg?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      handleInput();
    },
    [handleInput]
  );

  const handleInsertLink = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    const url = prompt('Masukkan URL Link:', 'https://');
    if (url) {
      if (!selectedText) {
        execCommand(
          'insertHTML',
          `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );
      } else {
        execCommand('createLink', url);
        const links = editorRef.current?.querySelectorAll('a');
        if (links) {
          const lastLink = links[links.length - 1];
          if (lastLink && lastLink.href === url) {
            lastLink.setAttribute('target', '_blank');
            lastLink.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }
    }
  }, [execCommand]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        execCommand('insertHTML', '&emsp;');
      }
    },
    [execCommand]
  );

  // Update button states on selection/cursor change
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.getRangeAt(0).startContainer;
        if (editorRef.current?.contains(node)) {
          updateActiveStates();
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateActiveStates]);

  const toolbarGroups: ToolbarButton[][] = [
    [
      { icon: <Undo className="h-3.5 w-3.5" />, command: 'undo', label: 'Urungkan (Ctrl+Z)' },
      { icon: <Redo className="h-3.5 w-3.5" />, command: 'redo', label: 'Ulangi (Ctrl+Y)' }
    ],
    [
      {
        icon: <Bold className="h-3.5 w-3.5" />,
        command: 'bold',
        label: 'Tebal (Ctrl+B)',
        isActive: activeStates.bold
      },
      {
        icon: <Italic className="h-3.5 w-3.5" />,
        command: 'italic',
        label: 'Miring (Ctrl+I)',
        isActive: activeStates.italic
      },
      {
        icon: <Strikethrough className="h-3.5 w-3.5" />,
        command: 'strikeThrough',
        label: 'Coret',
        isActive: activeStates.strikeThrough
      }
    ],
    [
      {
        icon: <Heading2 className="h-3.5 w-3.5" />,
        command: 'formatBlock',
        arg: 'h2',
        label: 'Sub-judul (H2)',
        isActive: activeStates.h2
      },
      {
        icon: <Heading3 className="h-3.5 w-3.5" />,
        command: 'formatBlock',
        arg: 'h3',
        label: 'Sub-sub-judul (H3)',
        isActive: activeStates.h3
      }
    ],
    [
      {
        icon: <List className="h-3.5 w-3.5" />,
        command: 'insertUnorderedList',
        label: 'Daftar Bullet',
        isActive: activeStates.unorderedList
      },
      {
        icon: <ListOrdered className="h-3.5 w-3.5" />,
        command: 'insertOrderedList',
        label: 'Daftar Angka',
        isActive: activeStates.orderedList
      },
      {
        icon: <Quote className="h-3.5 w-3.5" />,
        command: 'formatBlock',
        arg: 'blockquote',
        label: 'Kutipan',
        isActive: activeStates.blockquote
      }
    ],
    [
      {
        icon: <Minus className="h-3.5 w-3.5" />,
        command: 'insertHorizontalRule',
        label: 'Garis Pembatas'
      },
      { icon: <LinkIcon className="h-3.5 w-3.5" />, command: 'createLink', label: 'Sisipkan Link' }
    ]
  ];

  return (
    <div
      className={cn(
        'w-full border border-border/60 rounded-2xl overflow-hidden bg-card transition-all duration-300',
        'focus-within:border-foreground/30 focus-within:ring-1 focus-within:ring-foreground/10 focus-within:shadow-md',
        className
      )}
    >
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border/40 bg-muted/20">
        <div className="flex flex-wrap items-center gap-0.5">
          {toolbarGroups.map((group, groupIdx) => (
            <React.Fragment key={groupIdx}>
              {groupIdx > 0 && <div className="w-px h-5 bg-border/40 mx-1.5 shrink-0" />}
              <div className="flex items-center gap-0.5">
                {group.map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    title={btn.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (btn.command === 'createLink') {
                        handleInsertLink();
                      } else if (btn.command === 'formatBlock' && btn.arg) {
                        const isActive = btn.isActive;
                        execCommand(btn.command, isActive ? '<p>' : `<${btn.arg}>`);
                      } else {
                        execCommand(btn.command, btn.arg);
                      }
                    }}
                    className={cn(
                      'inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-150',
                      'cursor-pointer select-none',
                      btn.isActive
                        ? 'bg-foreground text-background font-bold shadow-2xs hover:bg-foreground/90 scale-95'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    )}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Font styling toggle */}
        <button
          type="button"
          onClick={() => setIsSerif(!isSerif)}
          title={isSerif ? 'Ganti ke Font Sans (Modern)' : 'Ganti ke Font Serif (Klasik)'}
          className={cn(
            'h-8 px-2.5 rounded-lg border text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer',
            isSerif
              ? 'bg-muted border-border/50 text-foreground'
              : 'border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40'
          )}
        >
          <Type className="h-3.5 w-3.5" />
          <span>{isSerif ? 'Serif' : 'Sans'}</span>
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="relative bg-card">
        {isEmpty && (
          <div
            className={cn(
              'absolute top-0 left-0 right-0 px-6 py-5 text-muted-foreground/40 text-sm pointer-events-none select-none',
              isSerif ? 'font-serif text-[16px]' : 'font-sans text-[14px]'
            )}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={updateActiveStates}
          onBlur={updateActiveStates}
          data-slot="rich-text-editor"
          className={cn(
            'px-6 py-5 outline-none leading-relaxed min-w-full focus:outline-none',
            'overflow-y-auto transition-all duration-200',
            isSerif ? 'font-serif text-[16px] tracking-wide' : 'font-sans text-[14px]',
            // Stylings for editor blocks
            '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight',
            '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:tracking-tight',
            '[&_p]:mb-3 [&_p]:text-foreground/90',
            '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1',
            '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1',
            '[&_li]:mb-0.5 [&_li]:text-foreground/90',
            '[&_blockquote]:border-l-3 [&_blockquote]:border-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_blockquote]:py-0.5',
            '[&_hr]:border-border/40 [&_hr]:my-6',
            '[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium',
            '[&_strong]:font-bold [&_strong]:text-foreground',
            '[&_em]:italic'
          )}
          style={{ minHeight }}
        />
      </div>

      {/* Editor Footer / Info Area */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-muted/10 text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-3">
          <span>{wordCount} Kata</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{charCount} Karakter</span>
        </div>
        <div className="flex items-center gap-1 opacity-70">
          <span>Shift + Enter untuk baris baru</span>
        </div>
      </div>
    </div>
  );
}
