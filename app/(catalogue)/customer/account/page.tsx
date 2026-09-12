'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, ShoppingBag, LogOut, Loader2 } from 'lucide-react';
import { useCustomerStore } from '@/lib/customer-store';
import { useCustomerOrders, useCustomerProfile } from '@/hooks/use-customer-account';
import { CustomerOrdersTab } from '@/components/catalogue/customer-orders-tab';
import { CustomerProfileForm } from '@/components/catalogue/customer-profile-form';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CustomerAccountPage() {
  const router = useRouter();
  const { customer, isAuthenticated, logout } = useCustomerStore();
  useCustomerProfile();
  const { data: orders = [] } = useCustomerOrders();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PROFILE'>('ORDERS');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/customer/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const showLinkedTab = () => {
      if (window.location.hash === '#profil') setActiveTab('PROFILE');
    };
    const timeoutId = window.setTimeout(showLinkedTab, 0);
    window.addEventListener('hashchange', showLinkedTab);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('hashchange', showLinkedTab);
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Anda telah keluar.');
    router.push('/');
  };

  if (!isAuthenticated || !customer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-(--cat-on-surface)" size={24} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-(--cat-stone) gap-4">
        <div>
          <span className="font-hanken text-[11px] uppercase tracking-[0.15em] text-(--cat-on-surface-variant)">
            Area Pelanggan
          </span>
          <h1 className="font-eb-garamond text-[32px] md:text-[36px] font-normal text-(--cat-on-surface)">
            Halo, {customer.fullName || customer.email.split('@')[0]}
          </h1>
          <p className="font-hanken text-[13px] text-(--cat-on-surface-variant)">
            {customer.email} {customer.whatsapp ? `• ${customer.whatsapp}` : ''}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-hanken text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 self-start md:self-auto transition-colors cursor-pointer"
        >
          <LogOut size={14} /> Keluar Akun
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-(--cat-stone) mt-8">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={cn(
            'pb-3 font-hanken text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2',
            activeTab === 'ORDERS'
              ? 'border-(--cat-charcoal) text-(--cat-on-surface)'
              : 'border-transparent text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)'
          )}
        >
          <ShoppingBag size={16} /> Riwayat Pesanan ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={cn(
            'pb-3 font-hanken text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2',
            activeTab === 'PROFILE'
              ? 'border-(--cat-charcoal) text-(--cat-on-surface)'
              : 'border-transparent text-(--cat-on-surface-variant) hover:text-(--cat-on-surface)'
          )}
        >
          <User size={16} /> Profil & Alamat Pengiriman
        </button>
      </div>

      {/* Content */}
      <div className="py-8">
        {activeTab === 'ORDERS' ? (
          <CustomerOrdersTab />
        ) : (
          <div id="profil">
            <CustomerProfileForm key={customer.updatedAt || customer.id} customer={customer} />
          </div>
        )}
      </div>
    </div>
  );
}
