'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'isomorphic-dompurify';
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
  Loader2
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

// Sanitize HTML strictly against XSS attacks
export const sanitizeArticleHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      's',
      'u',
      'a',
      'img',
      'figure',
      'figcaption',
      'hr',
      'br',
      'code',
      'pre',
      'span',
      'div'
    ],
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'src',
      'alt',
      'title',
      'class',
      'style',
      'width',
      'height',
      'contenteditable'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target']
  });
};

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

  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class:
            'rounded-2xl border border-border/40 shadow-sm mx-auto my-6 max-w-full h-auto block'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: value ? sanitizeArticleHtml(value) : '',
    onUpdate: ({ editor }) => {
      const rawHtml = editor.getHTML();
      const sanitized = sanitizeArticleHtml(rawHtml);
      if (onChange) {
        onChange(sanitized === '<p></p>' ? '' : sanitized);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose dark:prose-invert max-w-none focus:outline-none p-5 sm:p-7 leading-relaxed font-sans text-sm sm:text-base text-foreground',
          'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
          'prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4',
          'prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3',
          'prose-p:my-4 prose-p:leading-relaxed',
          'prose-blockquote:border-l-2 prose-blockquote:border-foreground/40 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6',
          'prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4',
          'prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4',
          'prose-hr:my-8 prose-hr:border-border/40',
          'prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-muted prose-code:text-xs prose-code:font-mono'
        )
      }
    }
  });

  // Sync external value changes if necessary
  useEffect(() => {
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
    const sanitizedSrc = DOMPurify.sanitize(imageUrl.trim());
    editor
      .chain()
      .focus()
      .setImage({ src: sanitizedSrc, alt: imageAlt.trim() || 'Gambar Artikel' })
      .run();
    setIsImageModalOpen(false);
    setImageUrl('');
    setImageAlt('');
  }, [editor, imageUrl, imageAlt]);

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'journal-image');

      const { data: json } = await axios.post('/api/v1/upload', formData);

      if (json.code === 200 && json.data?.url) {
        editor
          .chain()
          .focus()
          .setImage({ src: json.data.url, alt: file.name.replace(/\.[^/.]+$/, '') })
          .run();
        setIsImageModalOpen(false);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            editor
              .chain()
              .focus()
              .setImage({
                src: String(event.target.result),
                alt: file.name.replace(/\.[^/.]+$/, '')
              })
              .run();
            setIsImageModalOpen(false);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          editor
            .chain()
            .focus()
            .setImage({ src: String(event.target.result), alt: file.name.replace(/\.[^/.]+$/, '') })
            .run();
          setIsImageModalOpen(false);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSerif(!isSerif)}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Ganti Jenis Font Preview"
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

      {/* Editor Main Content Container */}
      <div
        className={cn('grow overflow-y-auto cursor-text', isSerif ? 'font-serif' : 'font-sans')}
        style={{ minHeight }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>

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
              Unggah file gambar dari komputer atau tempelkan URL gambar.
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
