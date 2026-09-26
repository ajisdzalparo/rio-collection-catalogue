'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Gift, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatIDR, formatWaNumber } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/social-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import type { ReferralPartnerView } from '../types';
import { useReferralActions } from '../hooks/use-referrals';

interface ReferralPartnerTableProps {
  data: ReferralPartnerView[];
  isLoading?: boolean;
  canManage?: boolean;
}

export function ReferralPartnerTable({
  data,
  isLoading = false,
  canManage = true
}: ReferralPartnerTableProps) {
  const actions = useReferralActions();
  const [partnerToDelete, setPartnerToDelete] = useState<ReferralPartnerView | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeletePartner() {
    if (!partnerToDelete) return;
    setIsDeleting(true);
    try {
      await actions.deletePartner(partnerToDelete.id);
      toast.success(`Partner "${partnerToDelete.name}" berhasil dihapus.`);
      setPartnerToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus partner.');
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: Column<ReferralPartnerView>[] = useMemo(
    () => [
      {
        header: 'Partner',
        accessorKey: 'name',
        sortable: true,
        cell: (partner) => {
          const initials = partner.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold ring-2 ring-background shadow-2xs">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/dashboard/referrals/${partner.id}`}
                  className="font-bold text-xs text-foreground hover:text-primary transition-colors truncate"
                >
                  {partner.name}
                </Link>
                {partner.whatsapp ? (
                  <a
                    href={`https://wa.me/${partner.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <WhatsAppIcon size={11} className="text-primary" />
                    <span className="text-primary">{formatWaNumber(partner.whatsapp)}</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">WhatsApp -</span>
                )}
                {partner.notes && (
                  <span
                    className="text-[10px] text-muted-foreground truncate max-w-45"
                    title={partner.notes}
                  >
                    {partner.notes}
                  </span>
                )}
              </div>
            </div>
          );
        }
      },
      {
        header: 'Kode Referral',
        cell: (partner) => (
          <div className="flex flex-wrap items-center gap-1 max-w-55">
            {partner.codes.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">Belum ada kode</span>
            ) : (
              partner.codes.map((code) => (
                <Badge
                  key={code.id}
                  variant="outline"
                  className={`border-border/60 bg-card/60 font-mono text-[10px] px-1.5 py-0.5 whitespace-nowrap ${
                    code.isActive
                      ? 'text-primary dark:text-primary font-bold'
                      : 'text-muted-foreground line-through opacity-60'
                  }`}
                >
                  {code.code}
                </Badge>
              ))
            )}
          </div>
        )
      },
      {
        header: 'Order Lunas',
        accessorKey: 'paidOrders',
        sortable: true,
        align: 'center',
        cell: (partner) => (
          <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
            {partner.paidOrders}
          </span>
        )
      },
      {
        header: 'Customer',
        accessorKey: 'customerCount',
        sortable: true,
        align: 'center',
        cell: (partner) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {partner.customerCount}
          </span>
        )
      },
      {
        header: 'Unit Terjual',
        accessorKey: 'unitsSold',
        sortable: true,
        align: 'center',
        cell: (partner) => (
          <span className="text-xs font-semibold text-foreground">{partner.unitsSold} pcs</span>
        )
      },
      {
        header: 'Penjualan Neto',
        accessorKey: 'netRevenue',
        sortable: true,
        align: 'right',
        cell: (partner) => (
          <span className="text-xs font-bold text-foreground">{formatIDR(partner.netRevenue)}</span>
        )
      },
      {
        header: 'Status Reward',
        align: 'center',
        cell: (partner) => {
          const payableCash = partner.codes
            .filter((c) => c.rewardKind === 'CASH')
            .reduce((sum, c) => sum + c.payableCash, 0);

          const availableGifts = partner.codes
            .filter((c) => c.rewardKind === 'SHIRT')
            .reduce((sum, c) => sum + c.availableGifts, 0);

          if (payableCash > 0) {
            return (
              <Badge variant="destructive" className="text-[10px] font-bold">
                {formatIDR(payableCash)} siap bayar
              </Badge>
            );
          }

          if (availableGifts > 0) {
            return (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold gap-1">
                <Gift className="h-2.5 w-2.5" />
                <span>{availableGifts} kaos tersedia</span>
              </Badge>
            );
          }

          return (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Lunas / Siap
            </Badge>
          );
        }
      },
      {
        header: 'Aksi',
        className: 'w-20 text-right',
        align: 'right',
        cell: (partner) => {
          const isUnused =
            partner.paidOrders === 0 && partner.unitsSold === 0 && partner.payouts.length === 0;

          return (
            <div className="flex items-center justify-end gap-1">
              <Link href={`/dashboard/referrals/${partner.id}`}>
                <Button
                  type="button"
                  variant="link"
                  size="icon-sm"
                  aria-label={`Lihat detail ${partner.name}`}
                  title="Lihat Detail Partner"
                  className="rounded-lg h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>

              <Button
                type="button"
                variant="link"
                size="icon-sm"
                onClick={() => setPartnerToDelete(partner)}
                aria-label={`Hapus partner ${partner.name}`}
                disabled={!canManage || !isUnused}
                title="Hapus Partner (Belum ada transaksi)"
                className="rounded-lg h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        }
      }
    ],
    [canManage]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        extraSearchKeys={['whatsapp', 'notes'] as Array<keyof ReferralPartnerView>}
        searchPlaceholder="Cari nama partner, nomor whatsapp, atau catatan..."
        isLoading={isLoading}
        showSearch
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        emptyTitle="Belum Ada Partner Referral"
        emptyDescription="Gunakan form di atas untuk mendaftarkan partner dan membuat kode referral baru."
        getRowId={(partner) => partner.id}
      />

      <ConfirmModal
        open={!!partnerToDelete}
        onOpenChange={(open) => !open && setPartnerToDelete(null)}
        title="Hapus Partner Referral"
        description={`Apakah Anda yakin ingin menghapus partner "${partnerToDelete?.name}"? Semua kode yang belum terpakai di bawah partner ini juga akan dihapus.`}
        confirmText="Hapus Partner"
        cancelText="Batal"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDeletePartner}
      />
    </>
  );
}
