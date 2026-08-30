'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        data-catalogue
        className="rounded-none! bg-(--cat-surface-container-lowest) border-(--cat-stone) max-w-md md:max-w-lg p-6 text-(--cat-on-surface) outline-none"
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-eb-garamond text-[24px] font-normal tracking-wide text-(--cat-on-surface)">
            Size Guide / Panduan Ukuran
          </DialogTitle>
          <DialogDescription className="font-hanken text-[13px] text-(--cat-on-surface-variant) leading-relaxed">
            Sizing specifications for our signature silhouette. All measurements are in centimeters (cm).
          </DialogDescription>
        </DialogHeader>

        {/* Sizing Table */}
        <div className="mt-4 overflow-x-auto border border-(--cat-stone)">
          <table className="w-full text-left font-hanken text-[13px] border-collapse">
            <thead>
              <tr className="bg-(--cat-surface-container) border-b border-(--cat-stone)">
                <th className="p-3 font-semibold text-(--cat-on-surface)">Size</th>
                <th className="p-3 font-semibold text-(--cat-on-surface)">Width / Lebar</th>
                <th className="p-3 font-semibold text-(--cat-on-surface)">Length / Panjang</th>
                <th className="p-3 font-semibold text-(--cat-on-surface)">Sleeve / Lengan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--cat-stone)">
              <tr className="hover:bg-(--cat-surface-container-low) transition-colors">
                <td className="p-3 font-medium text-(--cat-on-surface)">S</td>
                <td className="p-3 text-(--cat-on-surface-variant)">54 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">68 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">22 cm</td>
              </tr>
              <tr className="hover:bg-(--cat-surface-container-low) transition-colors">
                <td className="p-3 font-medium text-(--cat-on-surface)">M</td>
                <td className="p-3 text-(--cat-on-surface-variant)">57 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">70 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">23 cm</td>
              </tr>
              <tr className="hover:bg-(--cat-surface-container-low) transition-colors">
                <td className="p-3 font-medium text-(--cat-on-surface)">L</td>
                <td className="p-3 text-(--cat-on-surface-variant)">60 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">72 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">24 cm</td>
              </tr>
              <tr className="hover:bg-(--cat-surface-container-low) transition-colors">
                <td className="p-3 font-medium text-(--cat-on-surface)">XL</td>
                <td className="p-3 text-(--cat-on-surface-variant)">63 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">74 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">25 cm</td>
              </tr>
              <tr className="hover:bg-(--cat-surface-container-low) transition-colors">
                <td className="p-3 font-medium text-(--cat-on-surface)">XXL</td>
                <td className="p-3 text-(--cat-on-surface-variant)">66 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">76 cm</td>
                <td className="p-3 text-(--cat-on-surface-variant)">26 cm</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Measurement Instructions */}
        <div className="mt-4 space-y-3 font-hanken text-[12px] text-(--cat-on-surface-variant) border-t border-(--cat-stone) pt-4">
          <p className="font-semibold uppercase tracking-wider text-(--cat-on-surface) text-[10px]">
            How to Measure / Cara Mengukur:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
            <li>
              <strong>Width / Lebar:</strong> Diukur mendatar dari ujung ketiak kiri ke ketiak kanan.
            </li>
            <li>
              <strong>Length / Panjang:</strong> Diukur vertikal dari pundak tertinggi sampai ujung keliman bawah kaos.
            </li>
            <li>
              <strong>Sleeve / Lengan:</strong> Diukur dari ujung jahitan pundak sampai ujung lengan kaos.
            </li>
          </ul>
          <p className="italic text-[11px] mt-2">
            * Toleransi ukuran ±1-2 cm karena pengerjaan potong dan jahit manual.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
