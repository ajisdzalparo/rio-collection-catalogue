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
  Image as ImageIcon,
  Upload,
  Undo,
  Redo,
  Type,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Maximize2,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSerif, setIsSerif] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Range save & restore helpers
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.startContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // Image insertion states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  const [imageSizeInput, setImageSizeInput] = useState<'sm' | 'md' | 'lg'>('md');

  // Link insertion states
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('https://');
  const [linkTextInput, setLinkTextInput] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  // Interactive selected image state & controls
  const [selectedImgEl, setSelectedImgEl] = useState<HTMLImageElement | null>(null);
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [imgWidthPct, setImgWidthPct] = useState<number>(80);
  const [imgAlign, setImgAlign] = useState<'left' | 'center' | 'right'>('center');

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
    setIsEmpty(!html.trim() || html === '<p></p>' || html === '<p><br></p>');
    setCharCount(textContent.length);
    setWordCount(textContent.trim().split(/\s+/).filter(Boolean).length);

    if (onChange) {
      onChange(html);
    }
  }, [onChange]);

  const execCommand = useCallback(
    (command: string, value: string | undefined = undefined) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      handleInput();
      updateActiveStates();
    },
    [handleInput, updateActiveStates]
  );

  const sanitizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (/^(https?:\/\/|mailto:|\/)/i.test(trimmed)) {
      return trimmed;
    }
    if (/^javascript:/i.test(trimmed)) {
      return '#';
    }
    return `https://${trimmed}`;
  };

  const escapeAttr = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const insertImageTag = useCallback(
    (src: string, altText: string = '') => {
      restoreSelection();
      editorRef.current?.focus();
      const safeSrc = sanitizeUrl(src);
      const safeAlt = escapeAttr(altText);
      const figureHtml = `<figure class="my-4 text-center cursor-pointer select-none group relative inline-block max-w-full" contenteditable="false"><img src="${safeSrc}" alt="${safeAlt}" style="width: 80%; max-width: 100%; height: auto; margin: 0 auto; display: block;" class="rounded-2xl border border-border/20 shadow-sm transition-all hover:shadow-md cursor-pointer" /><figcaption class="text-xs text-muted-foreground mt-2 italic text-center font-sans opacity-80">${safeAlt || 'Keterangan gambar'}</figcaption></figure><p><br></p>`;
      execCommand('insertHTML', figureHtml);
    },
    [restoreSelection, execCommand]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'journal-image');

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.code === 200 && json.data?.url) {
        insertImageTag(json.data.url, file.name.replace(/\.[^/.]+$/, ''));
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            insertImageTag(String(event.target.result), file.name.replace(/\.[^/.]+$/, ''));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          insertImageTag(String(event.target.result), file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImageModalOpen(false);
    }
  };

  const handleUrlInsert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    insertImageTag(imageUrlInput.trim(), imageAltInput.trim());
    setImageUrlInput('');
    setImageAltInput('');
    setIsImageModalOpen(false);
  };

  const openLinkModal = useCallback(() => {
    saveSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    setLinkTextInput(selectedText);
    setLinkUrlInput('https://');
    setIsLinkModalOpen(true);
  }, [saveSelection]);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrlInput.trim()) return;

    restoreSelection();
    editorRef.current?.focus();
    const rawUrl = linkUrlInput.trim();
    const safeUrl = sanitizeUrl(rawUrl);
    const rawText = linkTextInput.trim() || rawUrl;
    const safeText = escapeAttr(rawText);
    const targetAttr = openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : '';

    const linkHtml = `<a href="${safeUrl}" ${targetAttr} class="text-foreground underline underline-offset-2 font-medium">${safeText}</a>`;
    execCommand('insertHTML', linkHtml);

    setLinkUrlInput('https://');
    setLinkTextInput('');
    setIsLinkModalOpen(false);
  };

  // Image Selection & Resizing Handlers
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      selectedImgRef.current = img;
      setSelectedImgEl(img);
      const parentWidth = editorRef.current?.clientWidth || 600;
      const widthPx = img.clientWidth || parentWidth;
      const pct = Math.min(100, Math.max(15, Math.round((widthPx / parentWidth) * 100)));
      setImgWidthPct(pct);

      const figure = img.closest('figure');
      if (figure) {
        if (figure.style.textAlign === 'left') setImgAlign('left');
        else if (figure.style.textAlign === 'right') setImgAlign('right');
        else setImgAlign('center');
      }
    } else {
      selectedImgRef.current = null;
      setSelectedImgEl(null);
    }
  }, []);

  const updateSelectedImageWidth = useCallback(
    (pct: number) => {
      const img = selectedImgRef.current;
      if (!img) return;
      setImgWidthPct(pct);
      img.style.width = pct === 100 ? '100%' : `${pct}%`;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      handleInput();
    },
    [handleInput]
  );

  const updateSelectedImageAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      const img = selectedImgRef.current;
      if (!img) return;
      setImgAlign(align);
      const figure = img.closest('figure');
      if (figure) {
        figure.style.textAlign = align;
        if (align === 'left') {
          img.style.margin = '0 auto 0 0';
        } else if (align === 'right') {
          img.style.margin = '0 0 0 auto';
        } else {
          img.style.margin = '0 auto';
        }
      }
      handleInput();
    },
    [handleInput]
  );

  // Active outline ring effect for selected image
  useEffect(() => {
    if (!editorRef.current) return;
    const imgs = editorRef.current.querySelectorAll('img');
    const selected = selectedImgRef.current;
    imgs.forEach((img) => {
      if (selected && img === selected) {
        img.style.outline = '3px solid var(--primary, #000)';
        img.style.outlineOffset = '2px';
        img.style.borderRadius = '1rem';
      } else {
        img.style.outline = 'none';
      }
    });
  }, [selectedImgEl]);

  const handleCornerDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const img = selectedImgRef.current;
      if (!img || !editorRef.current) return;

      const startX = e.clientX;
      const startWidthPx = img.clientWidth;
      const parentWidthPx = editorRef.current.clientWidth || 600;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidthPx = Math.max(80, startWidthPx + deltaX);
        const newPct = Math.min(100, Math.max(15, Math.round((newWidthPx / parentWidthPx) * 100)));
        setImgWidthPct(newPct);
        img.style.width = newPct === 100 ? '100%' : `${newPct}%`;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        handleInput();
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [handleInput]
  );

  const deleteSelectedImage = useCallback(() => {
    const img = selectedImgRef.current;
    if (!img) return;
    const figure = img.closest('figure');
    if (figure) {
      figure.remove();
    } else {
      img.remove();
    }
    selectedImgRef.current = null;
    setSelectedImgEl(null);
    handleInput();
  }, [handleInput]);

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
      { icon: <LinkIcon className="h-3.5 w-3.5" />, command: 'createLink', label: 'Sisipkan Link' },
      {
        icon: <ImageIcon className="h-3.5 w-3.5" />,
        command: 'insertImage',
        label: 'Sisipkan / Upload Gambar'
      }
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
                      if (btn.command === 'createLink' || btn.command === 'insertImage') {
                        // Modal opening is handled in onClick after mouseup completes
                        return;
                      }
                      e.preventDefault();
                      if (btn.command === 'formatBlock' && btn.arg) {
                        const isActive = btn.isActive;
                        execCommand(btn.command, isActive ? '<p>' : `<${btn.arg}>`);
                      } else {
                        execCommand(btn.command, btn.arg);
                      }
                    }}
                    onClick={() => {
                      if (btn.command === 'createLink') {
                        openLinkModal();
                      } else if (btn.command === 'insertImage') {
                        saveSelection();
                        setIsImageModalOpen(true);
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

      {/* Selected Image Action Control Floating Bar */}
      {selectedImgEl && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-foreground text-background text-xs font-semibold rounded-2xl shadow-lg mx-3 my-2 animate-in fade-in-0 zoom-in-95 duration-150 border border-foreground/20">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-background/80 flex items-center gap-1">
              <Move className="h-3.5 w-3.5" />
              Tarik / Geser Ukuran ({imgWidthPct}%):
            </span>

            {/* Drag Slider Resizer */}
            <input
              type="range"
              min={15}
              max={100}
              step={5}
              value={imgWidthPct}
              onChange={(e) => updateSelectedImageWidth(Number(e.target.value))}
              className="w-28 accent-background cursor-pointer h-1.5 rounded-lg bg-background/30"
            />

            {/* Direct Mouse Drag Handle Button */}
            <button
              type="button"
              onMouseDown={handleCornerDragStart}
              title="Klik dan tahan/geser mouse ke kanan/kiri untuk mengubah ukuran gambar secara bebas"
              className="px-2.5 py-1 rounded-lg bg-background text-foreground text-[10px] font-bold flex items-center gap-1 cursor-ew-resize hover:bg-background/90 transition-all shadow-xs"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Tarik Mouse</span>
            </button>

            {/* Quick Width Presets */}
            <div className="flex items-center gap-1 ml-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => updateSelectedImageWidth(pct)}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer',
                    imgWidthPct === pct
                      ? 'bg-background text-foreground shadow-2xs font-extrabold'
                      : 'bg-background/20 text-background hover:bg-background/30'
                  )}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Alignment Options */}
            <div className="flex items-center gap-0.5 bg-background/20 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => updateSelectedImageAlign('left')}
                title="Rata Kiri"
                className={cn(
                  'p-1 rounded-md transition-all cursor-pointer',
                  imgAlign === 'left'
                    ? 'bg-background text-foreground'
                    : 'text-background/80 hover:text-background'
                )}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateSelectedImageAlign('center')}
                title="Rata Tengah"
                className={cn(
                  'p-1 rounded-md transition-all cursor-pointer',
                  imgAlign === 'center'
                    ? 'bg-background text-foreground'
                    : 'text-background/80 hover:text-background'
                )}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateSelectedImageAlign('right')}
                title="Rata Kanan"
                className={cn(
                  'p-1 rounded-md transition-all cursor-pointer',
                  imgAlign === 'right'
                    ? 'bg-background text-foreground'
                    : 'text-background/80 hover:text-background'
                )}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="w-px h-4 bg-background/30 mx-1" />

            {/* Delete Image */}
            <button
              type="button"
              onClick={deleteSelectedImage}
              title="Hapus Gambar"
              className="p-1 px-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

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
          onClick={handleEditorClick}
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
            '[&_em]:italic',
            '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/20 [&_img]:shadow-sm [&_img]:my-4 [&_img]:block [&_img]:cursor-pointer [&_img]:transition-all'
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

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Link Insertion Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-foreground" />
              <span>Sisipkan Link / Tautan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Isikan alamat URL target dan teks tautan yang ingin dimasukkan ke artikel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="link-url-input" className="text-xs font-bold text-foreground">
                URL Alamat Tautan (HTTPS)
              </Label>
              <Input
                id="link-url-input"
                type="url"
                placeholder="https://example.com"
                value={linkUrlInput}
                onChange={(e) => setLinkUrlInput(e.target.value)}
                className="h-10 rounded-xl text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link-text-input" className="text-xs font-bold text-foreground">
                Teks Tautan yang Ditampilkan
              </Label>
              <Input
                id="link-text-input"
                type="text"
                placeholder="Contoh: Baca panduan selengkapnya di sini..."
                value={linkTextInput}
                onChange={(e) => setLinkTextInput(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="link-tab-checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="rounded border-border text-foreground focus:ring-foreground/20 h-4 w-4 cursor-pointer"
              />
              <Label
                htmlFor="link-tab-checkbox"
                className="text-xs font-medium text-muted-foreground cursor-pointer"
              >
                Buka tautan di tab baru (target=&quot;_blank&quot;)
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLinkModalOpen(false)}
                className="h-9 rounded-xl text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!linkUrlInput.trim()}
                className="h-9 rounded-xl text-xs font-bold cursor-pointer"
              >
                Sisipkan Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Upload / Embed Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-foreground" />
              <span>Sisipkan / Upload Gambar</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload file foto dari komputer Anda atau tempelkan URL gambar langsung untuk
              dimasukkan ke dalam isi artikel jurnal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Upload file section */}
            <div className="p-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center space-y-3">
              <div className="mx-auto h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Upload File Gambar</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Format JPG, PNG, WEBP (Maksimal 5MB)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-4 rounded-xl text-xs font-bold gap-2 cursor-pointer w-full"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengunggah Gambar...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Pilih Gambar dari Komputer</span>
                  </>
                )}
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40" />
              </div>
              <span className="relative bg-card px-3 text-[10px] uppercase font-bold text-muted-foreground">
                atau gunakan URL Gambar
              </span>
            </div>

            {/* URL Form */}
            <form onSubmit={handleUrlInsert} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="img-url-input" className="text-xs font-bold text-foreground">
                  URL Gambar (HTTPS)
                </Label>
                <Input
                  id="img-url-input"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Ukuran Tampilan Gambar</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageSizeInput('sm')}
                    className={cn(
                      'py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center',
                      imageSizeInput === 'sm'
                        ? 'border-foreground bg-foreground text-background shadow-2xs font-bold'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Kecil (320px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSizeInput('md')}
                    className={cn(
                      'py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center',
                      imageSizeInput === 'md'
                        ? 'border-foreground bg-foreground text-background shadow-2xs font-bold'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Sedang (640px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSizeInput('lg')}
                    className={cn(
                      'py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center',
                      imageSizeInput === 'lg'
                        ? 'border-foreground bg-foreground text-background shadow-2xs font-bold'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Penuh (100%)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="img-alt-input" className="text-xs font-bold text-foreground">
                  Keterangan Foto / Alt Text (Opsional)
                </Label>
                <Input
                  id="img-alt-input"
                  type="text"
                  placeholder="Contoh: Proses pembuatan garmen koleksi archive..."
                  value={imageAltInput}
                  onChange={(e) => setImageAltInput(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsImageModalOpen(false)}
                  className="h-9 rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!imageUrlInput.trim()}
                  className="h-9 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Sisipkan URL Gambar
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
