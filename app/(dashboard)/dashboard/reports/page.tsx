'use client';

import React, { Suspense } from 'react';
import { VStack } from '@/components/ui/layout';
import type { DateRange } from '@/types/date-picker.types';
import {
  useReportsData,
  exportReportToExcel,
  formatDateToInput,
  ReportsFilterBar,
  ReportsMetricsCards,
  ReportsSalesChart,
  ReportsSalesLog,
  ReportsTopProducts
} from './components';

function ReportsPageContent() {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    presetRange,
    setPresetRange,
    selectedProduct,
    setSelectedProduct,
    availableProducts,
    currentOrders,
    previousOrders,
    currentMetrics,
    growth,
    topProducts,
    chartDataPoints,
    chartInsights
  } = useReportsData();

  const handleExportExcel = () => {
    exportReportToExcel({
      currentOrders,
      selectedProduct,
      startDate,
      endDate
    });
  };

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
    <VStack gap="lg" className="w-full pb-12">
      {/* Header and Filter Controls */}
      <ReportsFilterBar
        selectedProduct={selectedProduct}
        onProductChange={setSelectedProduct}
        availableProducts={availableProducts}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onExportExcel={handleExportExcel}
      />

      <div className="w-full space-y-6">
        {/* Metrics Summary Cards */}
        <ReportsMetricsCards
          currentMetrics={currentMetrics}
          growth={growth}
          hasPreviousPeriod={previousOrders.length > 0}
        />

        {/* Chart & Detailed Transaction Log Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <ReportsSalesChart
              chartDataPoints={chartDataPoints}
              chartInsights={chartInsights}
              hasPreviousPeriod={previousOrders.length > 0}
              startDate={startDate}
              endDate={endDate}
              selectedProduct={selectedProduct}
              presetRange={presetRange}
            />
          </div>

          <div className="lg:col-span-4">
            <ReportsSalesLog
              currentOrders={currentOrders}
              selectedProduct={selectedProduct}
            />
          </div>
        </div>

        {/* Top Best-Selling Kaos Section */}
        <ReportsTopProducts
          topProducts={topProducts}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
        />
      </div>
    </VStack>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading selling reports...</p>
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
