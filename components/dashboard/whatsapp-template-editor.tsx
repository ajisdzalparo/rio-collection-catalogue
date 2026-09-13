'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Copy,
  Clock,
  Truck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DEFAULT_WA_TEMPLATES,
  type WhatsAppTemplates
} from '@/lib/order-whatsapp';

export { DEFAULT_WA_TEMPLATES, type WhatsAppTemplates } from '@/lib/order-whatsapp';

interface WhatsAppTemplateEditorProps {
  templates: WhatsAppTemplates;
  onChange: (updated: WhatsAppTemplates) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

const TEMPLATE_KEYS: Array<{
  key: keyof WhatsAppTemplates;
  label: string;
  badge: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    key: 'waTemplatePending',
    label: '1. Order & Tagihan',
    badge: 'Pending',
    icon: Clock,
    description: 'Pesan pertama setelah admin menyetujui order dan mengirim instruksi pembayaran'
  },
  {
    key: 'waTemplatePayment',
    label: '2. Pembayaran Diterima',
    badge: 'Paid',
    icon: CheckCircle2,
    description: 'Dikirim setelah admin memverifikasi bukti bayar pelanggan'
  },
  {
    key: 'waTemplateShipping',
    label: '3. Pengiriman & Resi',
    badge: 'Shipped',
    icon: Truck,
    description: 'Dikirim saat pesanan sudah diproses dan menginput nomor resi'
  },
  {
    key: 'waTemplateRemind',
    label: 'Opsional: Reminder Tagihan',
    badge: 'Follow-Up',
    icon: AlertCircle,
    description: 'Dikirim untuk mengingatkan pelanggan yang belum mentransfer pembayaran'
  }
];

const AVAILABLE_VARIABLES = [
  { tag: '{nama_pelanggan}', label: 'Nama Pelanggan', sample: 'Clara Sinta' },
  { tag: '{nomor_order}', label: 'Nomor Order', sample: 'RC-8802' },
  { tag: '{total_pembayaran}', label: 'Total Harga', sample: 'Rp 450.000' },
  { tag: '{rekening_bank}', label: 'Info Bank Toko', sample: 'BCA: 1234567890 a.n RIO COLLECTION' },
  { tag: '{kurir}', label: 'Ekspedisi Kurir', sample: 'JNE Express' },
  { tag: '{nomor_resi}', label: 'Nomor Resi', sample: 'JNE-990123847' }
];

export function WhatsAppTemplateEditor({
  templates,
  onChange,
  onSave,
  isSaving = false
}: WhatsAppTemplateEditorProps) {
  const [activeKey, setActiveKey] = useState<keyof WhatsAppTemplates>('waTemplatePending');
  const [copiedPreview, setCopiedPreview] = useState(false);

  const activeTemplateMeta = TEMPLATE_KEYS.find((t) => t.key === activeKey)!;
  const currentText = templates[activeKey] || DEFAULT_WA_TEMPLATES[activeKey];

  const handleInsertVariable = (variableTag: string) => {
    const updated = {
      ...templates,
      [activeKey]: currentText + (currentText.endsWith(' ') || currentText.endsWith('\n') ? '' : ' ') + variableTag
    };
    onChange(updated);
  };

  const handleTextChange = (val: string) => {
    onChange({
      ...templates,
      [activeKey]: val
    });
  };

  const handleResetCurrent = () => {
    onChange({
      ...templates,
      [activeKey]: DEFAULT_WA_TEMPLATES[activeKey]
    });
    toast.success(`Template ${activeTemplateMeta.label} dikembalikan ke teks standar`);
  };

  const generateSamplePreview = () => {
    let preview = currentText;
    AVAILABLE_VARIABLES.forEach((v) => {
      preview = preview.replaceAll(v.tag, v.sample);
    });
    return preview;
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(generateSamplePreview());
    setCopiedPreview(true);
    toast.success('Contoh pesan WhatsApp berhasil disalin');
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-6 shadow-2xs">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />
            Editor Template Pesan WhatsApp Follow-Up
          </h3>
          <p className="text-xs text-muted-foreground">
            Sesuaikan kata-kata follow-up otomatis untuk pelanggan. Klik chip variabel untuk memasukkan data dinamis secara instan.
          </p>
        </div>

        {onSave && (
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </Button>
        )}
      </div>

      {/* Template Selector Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {TEMPLATE_KEYS.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/30 shadow-2xs'
                  : 'border-border/30 bg-muted/10 hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold uppercase">
                  {item.badge}
                </Badge>
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-foreground' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Editor Form on Left + WhatsApp Bubble Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Textarea & Variable Chips (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Isi Pesan Template ({activeTemplateMeta.label})</span>
            </Label>
            <button
              type="button"
              onClick={handleResetCurrent}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Standar</span>
            </button>
          </div>

          <Textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={9}
            className="rounded-xl text-xs font-mono leading-relaxed bg-muted/20 border-border/40 focus:bg-background resize-y"
            placeholder="Ketik isi pesan WhatsApp Anda di sini..."
          />

          {/* Dynamic Variable Quick-Insert Chips */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Klik Variabel Dinamis untuk Menambahkan:
              </span>
              <span className="text-muted-foreground text-[10px]">Otomatis diganti data order</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="px-2.5 py-1 rounded-lg border border-border/40 bg-muted/20 hover:bg-emerald-500/15 hover:border-emerald-500/40 text-[11px] font-mono font-medium text-foreground transition-all cursor-pointer flex items-center gap-1"
                  title={`Sisipkan ${v.label}`}
                >
                  <span className="text-emerald-500 font-bold">+</span>
                  <span>{v.tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: WhatsApp Chat Live Visual Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
              Preview Tampilan WhatsApp Pelanggan
            </span>
            <button
              type="button"
              onClick={handleCopyPreview}
              className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedPreview ? 'Tersalin!' : 'Salin Contoh'}</span>
            </button>
          </div>

          {/* WhatsApp Chat UI Box */}
          <div className="rounded-2xl border border-border/40 bg-[#0b141a] p-4 text-white shadow-md relative overflow-hidden min-h-64 flex flex-col justify-between font-sans">
            {/* Header Chat Tag */}
            <div className="flex items-center gap-2 pb-2.5 border-b border-white/10 text-[11px] text-emerald-400 font-semibold">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>RIO COLLECTION Official WhatsApp</span>
            </div>

            {/* Chat Bubble Container */}
            <div className="my-3 self-end max-w-[90%] bg-[#005c4b] text-white/95 rounded-2xl rounded-tr-xs p-3 text-xs leading-relaxed whitespace-pre-wrap font-sans shadow-xs border border-emerald-500/20">
              {generateSamplePreview()}
              <div className="text-[9px] text-emerald-200/60 text-right mt-1 font-mono">
                10:42 AM ✓✓
              </div>
            </div>

            {/* Footer Tip */}
            <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-white/50">
              <HelpCircle className="h-3 w-3 shrink-0 text-white/40" />
              <span>Variabel seperti <code className="text-emerald-300">{'{nama_pelanggan}'}</code> akan terisi otomatis saat mengeklik tombol WA di dashboard order.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
