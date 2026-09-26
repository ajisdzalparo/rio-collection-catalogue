'use client';

import React, { Suspense } from 'react';
import { VStack } from '@/components/ui/layout';
import { CmsPageSkeleton } from '@/components/shared/cms-page-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import type { DateRange } from '@/types/date-picker.types';
import {
  useReportsData,
  exportReportToExcel,
  formatDateToInput,
  ReportsFilterBar,
  ReportsMetricsCards,
  ReportsSalesChart,
  ReportsSalesTable,
  ReportsTopProducts
} from './components';

function ReportsPageContent() {
  const {
    isLoading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    presetRange,
    setPresetRange,
    selectedProducts,
    setSelectedProducts,
    selectedStatuses,
    setSelectedStatuses,
    availableProducts,
    currentOrders,
    hasPreviousPeriod,
    currentMetrics,
    growth,
    topProducts,
    chartDataPoints,
    chartInsights
  } = useReportsData();

  if (isLoading) {
    return <CmsPageSkeleton variant="report" />;
  }

  if (error) {
    return <ErrorState message={error.message || 'Laporan penjualan tidak dapat dimuat.'} />;
  }

  const handleExportExcel = () => {
    exportReportToExcel({
      currentOrders,
      selectedProducts,
      selectedStatuses,
      startDate,
      endDate
    });
  };

  const selectedProductLabel =
    selectedProducts.length === 0 ? 'ALL' : selectedProducts.join(', ');

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range) return;
    if (range.from) {
      setStartDate(formatDateToInput(range.from));
    }
    if (range.to) {
      setEndDate(formatDateToInput(range.to));
    }
    setPresetRange('CUSTOM');
  };

  return (
    <VStack gap="lg" className="w-full min-w-0 max-w-full pb-12">
      {/* Header and Filter Controls */}
      <ReportsFilterBar
        selectedProducts={selectedProducts}
        onProductsChange={setSelectedProducts}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        availableProducts={availableProducts}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onExportExcel={handleExportExcel}
      />

      <div className="w-full min-w-0 max-w-full space-y-6">
        {/* Metrics Summary Cards */}
        <ReportsMetricsCards
          currentMetrics={currentMetrics}
          growth={growth}
          hasPreviousPeriod={hasPreviousPeriod}
        />

        <ReportsSalesChart
          chartDataPoints={chartDataPoints}
          chartInsights={chartInsights}
          hasPreviousPeriod={hasPreviousPeriod}
          startDate={startDate}
          endDate={endDate}
          selectedProduct={selectedProductLabel}
          presetRange={presetRange}
        />

        <ReportsSalesTable
          selectedProducts={selectedProducts}
          selectedStatuses={selectedStatuses}
          startDate={startDate}
          endDate={endDate}
        />

        {/* Top Best-Selling Kaos Section */}
        <ReportsTopProducts
          topProducts={topProducts}
          selectedProduct={selectedProductLabel}
        />
      </div>
    </VStack>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={<CmsPageSkeleton variant="report" />}
    >
      <ReportsPageContent />
    </Suspense>
  );
}
