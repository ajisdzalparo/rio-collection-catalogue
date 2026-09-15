'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Code as CodeIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Upload,
  Undo,
  Redo,
  RemoveFormatting,
  Type,
  Loader2,
  Eye,
  Pencil,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2
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
import { sanitizeArticleHtml } from '@/lib/sanitize-html';
import { toast } from 'sonner';
export { sanitizeArticleHtml };

// Extended TipTap Image with configurable width & alignment and base64 support
const CustomImage = Image.extend({
  name: 'image',
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('width') || element.style.width || '100%',
        renderHTML: (attributes) => {
          const widthVal = attributes.width || '100%';
          return {
            width: widthVal,
            style: `width: ${widthVal}; max-width: 100%; height: auto;`
          };
        }
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes) => {
          const alignment = attributes.alignment || 'center';
          const alignClass =
            alignment === 'left'
              ? 'mr-auto block'
              : alignment === 'right'
              ? 'ml-auto block'
              : 'mx-auto block';
          return {
            'data-alignment': alignment,
            class: `rounded-2xl border border-border/40 shadow-sm my-6 max-w-full h-auto ${alignClass}`
          };
        }
      }
    };
  }
});

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Mulai menulis isi artikel di sini... Gunakan toolbar di atas untuk memformat teks.',
  className,
  minHeight = '420px'
}: RichTextEditorProps) {
  const [isSerif, setIsSerif] = useState(false);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');

  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState<'100%' | '75%' | '50%' | '25%'>('100%');
  const [imageAlignment, setImageAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            'text-primary underline underline-offset-4 font-medium transition-colors hover:opacity-80',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      CustomImage.configure({
        allowBase64: true,
        inline: false
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: value ? sanitizeArticleHtml(value) : '',
    onUpdate: ({ editor }) => {
      const rawHtml = editor.getHTML();
      const sanitized = sanitizeArticleHtml(rawHtml);
      isInternalUpdate.current = true;
      if (onChange) {
        onChange(sanitized === '<p></p>' ? '' : sanitized);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'focus:outline-none p-5 sm:p-8 leading-relaxed text-foreground min-h-[440px] select-text selection:bg-primary selection:text-primary-foreground',
          'font-hanken text-[16px] md:text-[17px] leading-[1.85]',
          '[&_p]:mt-5 [&_p]:leading-[1.85] [&_p]:text-foreground/90 [&_p:first-child]:mt-0',
          '[&_h2]:font-eb-garamond [&_h2]:text-[26px] md:[&_h2]:text-[32px] [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:tracking-tight',
          '[&_h3]:font-eb-garamond [&_h3]:text-[20px] md:[&_h3]:text-[24px] [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2',
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-5 [&_ul_li]:mt-1.5',
          '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-5 [&_ol_li]:mt-1.5',
          '[&_blockquote]:my-6 [&_blockquote]:py-3 [&_blockquote]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/70 [&_blockquote]:italic [&_blockquote]:font-eb-garamond [&_blockquote]:text-[20px] md:[&_blockquote]:text-[22px] [&_blockquote]:text-foreground',
          '[&_hr]:my-8 [&_hr]:border-border/60',
          '[&_strong]:font-bold [&_strong]:text-foreground',
          '[&_em]:italic',
          '[&_s]:line-through',
          '[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-muted [&_code]:text-xs [&_code]:font-mono',
          '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:font-medium',
          '[&_img]:rounded-xl [&_img]:border [&_img]:border-border/40 [&_img]:my-6 [&_img]:shadow-sm [&_img]:max-w-full [&_img]:h-auto'
        )
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith('image/'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            event.preventDefault();
            const toastId = toast.loading('Menyisipkan gambar dari clipboard...');
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = String(e.target?.result || '');
              if (!dataUrl) return;

              editor?.chain().focus().setImage({ src: dataUrl, alt: 'Gambar Clipboard' }).run();
              toast.success('Gambar berhasil disisipkan', { id: toastId });
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const toastId = toast.loading('Menyisipkan gambar...');
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = String(e.target?.result || '');
              if (!dataUrl) return;

              editor?.chain().focus().setImage({ src: dataUrl, alt: file.name.replace(/\.[^/.]+$/, '') }).run();
              toast.success('Gambar berhasil disisipkan', { id: toastId });
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      }
    }
  });

  // Sync external value changes if necessary
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (editor && value !== undefined) {
      const sanitizedValue = sanitizeArticleHtml(value);
      if (editor.getHTML() !== sanitizedValue && !(value === '' && editor.isEmpty)) {
        editor.commands.setContent(sanitizedValue, { emitUpdate: false });
      }
    }
  }, [value, editor]);

  // Insert Link Handler
  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl.trim() || linkUrl === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkModalOpen(false);
      return;
    }

    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !/^\//.test(url)) {
      url = `https://${url}`;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' })
      .run();

    setIsLinkModalOpen(false);
    setLinkUrl('https://');
  }, [editor, linkUrl]);

  // Open Link Modal
  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || 'https://');
    setIsLinkModalOpen(true);
  }, [editor]);

  // Insert Image Handler
  const handleInsertImage = useCallback(() => {
    if (!editor || !imageUrl.trim()) return;
    const cleanUrl = imageUrl.trim();
    editor
      .chain()
      .focus()
      .setImage({ src: cleanUrl, alt: imageAlt.trim() || 'Gambar Artikel' })
      .updateAttributes('image', { width: imageWidth, alignment: imageAlignment })
      .run();
    setIsImageModalOpen(false);
    setImageUrl('');
    setImageAlt('');
    setImageWidth('100%');
    setImageAlignment('center');
  }, [editor, imageUrl, imageAlt, imageWidth, imageAlignment]);

  // Image Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPEG, PNG, WEBP, dll.)');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Menyisipkan gambar...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = String(event.target?.result || '');
      setIsUploading(false);
      setIsImageModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (!dataUrl) {
        toast.error('Gagal membaca file gambar', { id: toastId });
        return;
      }

      editor
        .chain()
        .focus()
        .setImage({ src: dataUrl, alt: file.name.replace(/\.[^/.]+$/, '') })
        .updateAttributes('image', { width: imageWidth, alignment: imageAlignment })
        .run();

      toast.success('Gambar artikel berhasil disisipkan', { id: toastId });
    };

    reader.onerror = () => {
      setIsUploading(false);
      toast.error('Gagal memproses gambar', { id: toastId });
    };

    reader.readAsDataURL(file);
  };

  if (!editor) {
    return (
      <div
        className="w-full border border-border/40 rounded-2xl bg-card p-8 flex items-center justify-center text-muted-foreground gap-2 text-xs"
        style={{ minHeight }}
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Memuat editor konten...</span>
      </div>
    );
  }

  const textContent = editor.getText();
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div
      className={cn(
        'w-full border border-border/40 rounded-2xl bg-card overflow-hidden shadow-2xs flex flex-col transition-all duration-200 focus-within:border-border focus-within:shadow-xs',
        className
      )}
    >
      {/* Sticky Top Formatting Toolbar */}
      <div className="border-b border-border/30 bg-card/95 backdrop-blur-md p-2 flex flex-wrap items-center justify-between gap-1.5 sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-1">
          {/* History */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
            title="Urung (Undo)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
            title="Ulangi (Redo)"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border/40 mx-1" />

          {/* Typography Formats */}
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('bold')
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Tebal (Bold)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('italic')
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Miring (Italic)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('strike')
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Coret (Strikethrough)"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('code') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('code')
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Kode Inline"
          >
            <CodeIcon className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border/40 mx-1" />

          {/* Headings */}
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer font-bold text-xs',
              editor.isActive('heading', { level: 2 })
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Subjudul Utama (H2)"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer font-bold text-xs',
              editor.isActive('heading', { level: 3 })
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Subjudul Sekunder (H3)"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border/40 mx-1" />

          {/* Lists & Blocks */}
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('bulletList')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Daftar Simbol (Bullet List)"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('orderedList')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Daftar Angka (Ordered List)"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('blockquote')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Kutipan (Blockquote)"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
            title="Garis Pemisah (Horizontal Rule)"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border/40 mx-1" />

          {/* Links & Media */}
          <Button
            type="button"
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={openLinkDialog}
            className={cn(
              'h-8 w-8 rounded-lg cursor-pointer',
              editor.isActive('link')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Sisipkan Tautan (Link)"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          {editor.isActive('link') && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="h-8 w-8 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10"
              title="Hapus Tautan"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsImageModalOpen(true)}
            className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
            title="Sisipkan Gambar"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          {/* Edit / Live Preview Mode Switcher */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
            <button
              type="button"
              onClick={() => setActiveView('edit')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors',
                activeView === 'edit'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Mode Editor Teks"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('preview')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors',
                activeView === 'preview'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Preview Tampilan Akhir Katalog"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </button>
          </div>

          <div className="h-4 w-px bg-border/40 mx-0.5" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSerif(!isSerif)}
            className="h-8 px-2 rounded-lg text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Ganti Font"
          >
            <Type className="h-3.5 w-3.5" />
            <span>{isSerif ? 'Serif' : 'Sans'}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
            title="Hapus Format Teks"
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected Image Floating Control Bar */}
      {editor.isActive('image') && (
        <div className="w-full bg-primary/5 border-b border-border/30 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs transition-all">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-foreground text-[11px] flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              Atur Gambar:
            </span>

            {/* Width selection buttons */}
            <div className="flex items-center gap-1 bg-background/90 p-0.5 rounded-lg border border-border/40">
              {(['25%', '50%', '75%', '100%'] as const).map((w) => {
                const currentWidth = editor.getAttributes('image').width || '100%';
                const isSelected = currentWidth === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      editor.chain().focus().updateAttributes('image', { width: w }).run()
                    }
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title={`Ubah ukuran ke ${w}`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>

            {/* Alignment selection buttons */}
            <div className="flex items-center gap-1 bg-background/90 p-0.5 rounded-lg border border-border/40">
              {(
                [
                  { id: 'left', label: 'Kiri', icon: AlignLeft },
                  { id: 'center', label: 'Tengah', icon: AlignCenter },
                  { id: 'right', label: 'Kanan', icon: AlignRight }
                ] as const
              ).map((align) => {
                const Icon = align.icon;
                const currentAlign = editor.getAttributes('image').alignment || 'center';
                const isSelected = currentAlign === align.id;
                return (
                  <button
                    key={align.id}
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('image', { alignment: align.id })
                        .run()
                    }
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title={`Rata ${align.label}`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{align.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete Image button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteSelection().run()}
            className="h-6 px-2 text-destructive hover:bg-destructive/10 text-[11px] font-semibold gap-1 cursor-pointer"
            title="Hapus Gambar Terpilih"
          >
            <Trash2 className="h-3 w-3" />
            <span>Hapus</span>
          </Button>
        </div>
      )}

      {/* Editor / Live Preview Main Container */}
      {activeView === 'preview' ? (
        <div
          className={cn(
            'grow overflow-y-auto p-6 sm:p-10 bg-background/50',
            isSerif ? 'font-serif' : 'font-sans'
          )}
          style={{ minHeight }}
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="border-b border-border/40 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Live Output Preview (Tampilan Publik)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {wordCount} kata • {charCount} karakter
              </span>
            </div>

            {editor.isEmpty ? (
              <div className="text-center py-16 text-muted-foreground text-xs italic">
                Belum ada konten artikel. Tulis di tab Edit untuk melihat preview di sini.
              </div>
            ) : (
              <div
                className="font-hanken text-[16px] md:text-[18px] leading-[1.85] text-foreground/90 select-text selection:bg-primary selection:text-primary-foreground [&_p]:mt-6 [&_p]:wrap-break-word [&_p:first-child]:mt-0 [&_h2]:font-eb-garamond [&_h2]:text-[28px] [&_h2]:md:text-[36px] [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h3]:font-eb-garamond [&_h3]:text-[22px] [&_h3]:md:text-[28px] [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-6 [&_ul_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-6 [&_ol_li]:mt-2 [&_blockquote]:my-8 [&_blockquote]:py-4 [&_blockquote]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/70 [&_blockquote]:italic [&_blockquote]:font-eb-garamond [&_blockquote]:text-[22px] [&_blockquote]:text-foreground [&_hr]:my-10 [&_hr]:border-border/60 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/40 [&_img]:my-8 [&_img]:shadow-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:font-medium [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-muted [&_code]:text-xs [&_code]:font-mono"
                dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(editor.getHTML()) }}
              />
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn('grow overflow-y-auto cursor-text', isSerif ? 'font-serif' : 'font-sans')}
          style={{ minHeight }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              editor.chain().focus().run();
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Footer Word & Character Counter */}
      <div className="border-t border-border/30 bg-muted/20 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          <span>{wordCount} Kata</span>
          <span>•</span>
          <span>{charCount} Karakter</span>
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sisipkan Tautan (Link)</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Masukkan URL tujuan untuk teks yang dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL Tautan</Label>
              <Input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-10 rounded-xl text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSetLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLinkModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button type="button" onClick={handleSetLink} className="rounded-xl text-xs font-bold">
              Terapkan Tautan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sisipkan Gambar Artikel</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Unggah file gambar dari komputer atau tempelkan URL gambar dengan pilihan ukuran dan posisi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Upload File */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Unggah dari Perangkat</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-10 rounded-xl text-xs font-bold gap-2 cursor-pointer border-dashed"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{isUploading ? 'Mengunggah...' : 'Pilih File Gambar'}</span>
                </Button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-border/40"></div>
              <span className="shrink mx-3 text-[10px] font-bold text-muted-foreground uppercase">
                Atau Tempelkan URL
              </span>
              <div className="grow border-t border-border/40"></div>
            </div>

            {/* Image URL Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL Gambar</Label>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Keterangan Gambar (Alt Text)</Label>
              <Input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Misal: Foto suasana produksi studio"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Image Size & Alignment Options */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Ukuran Gambar</Label>
                <div className="grid grid-cols-4 gap-1">
                  {(['25%', '50%', '75%', '100%'] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setImageWidth(w)}
                      className={cn(
                        'py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer',
                        imageWidth === w
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Posisi / Perataan</Label>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'left', label: 'Kiri' },
                      { id: 'center', label: 'Tengah' },
                      { id: 'right', label: 'Kanan' }
                    ] as const
                  ).map((align) => (
                    <button
                      key={align.id}
                      type="button"
                      onClick={() => setImageAlignment(align.id)}
                      className={cn(
                        'py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer',
                        imageAlignment === align.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {align.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleInsertImage}
              disabled={!imageUrl.trim()}
              className="rounded-xl text-xs font-bold"
            >
              Sisipkan Gambar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
