import { useState, useMemo, useCallback } from 'react';
import { useOrders } from '@/hooks/use-orders';
import type { Order } from '@/hooks/use-orders';
import type {
  ReportMetrics,
  ReportGrowth,
  TopSellingProduct,
  DailyChartPoint,
  ChartInsights,
  PresetRangeType
} from './types';

export const formatDateToInput = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function useReportsData() {
  const { data: orders = [] } = useOrders();

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return formatDateToInput(d);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return formatDateToInput(new Date());
  });
  const [presetRange, setPresetRange] = useState<PresetRangeType>('30D');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');

  const applyPreset = useCallback(
    (preset: PresetRangeType) => {
      const now = new Date();
      if (preset === '7D') {
        const s = new Date();
        s.setDate(now.getDate() - 6);
        setStartDate(formatDateToInput(s));
        setEndDate(formatDateToInput(now));
      } else if (preset === '30D') {
        const s = new Date();
        s.setDate(now.getDate() - 29);
        setStartDate(formatDateToInput(s));
        setEndDate(formatDateToInput(now));
      } else if (preset === 'THIS_MONTH') {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartDate(formatDateToInput(s));
        setEndDate(formatDateToInput(now));
      } else if (preset === 'LAST_MONTH') {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(formatDateToInput(s));
        setEndDate(formatDateToInput(e));
      } else if (preset === 'ALL') {
        const oldest =
          orders.length > 0
            ? new Date(Math.min(...orders.map((o) => new Date(o.createdAt).getTime())))
            : new Date(now.getFullYear() - 1, 0, 1);
        setStartDate(formatDateToInput(oldest));
        setEndDate(formatDateToInput(now));
      }
    },
    [orders]
  );

  const availableProducts = useMemo(() => {
    const names = new Set<string>();
    orders.forEach((o) => {
      o.items.forEach((item) => names.add(item.name));
    });
    return Array.from(names);
  }, [orders]);

  const { currentOrders, previousOrders } = useMemo(() => {
    if (!startDate || !endDate) return { currentOrders: [], previousOrders: [] };

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    if (start > end) return { currentOrders: [], previousOrders: [] };

    const diffMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffMs);

    const current = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });

    const previous = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= prevStart && d <= prevEnd;
    });

    return { currentOrders: current, previousOrders: previous };
  }, [orders, startDate, endDate]);

  const calculateMetrics = useCallback(
    (orderList: Order[]): ReportMetrics => {
      let revenue = 0;
      let totalHpp = 0;
      let totalQty = 0;

      orderList.forEach((o) => {
        o.items.forEach((item) => {
          if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

          const rev = item.price * item.quantity;
          const hpp = (item.cogs || 180000) * item.quantity;
          revenue += rev;
          totalHpp += hpp;
          totalQty += item.quantity;
        });
      });

      const netProfit = revenue - totalHpp;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return { revenue, totalHpp, netProfit, profitMargin, totalQty };
    },
    [selectedProduct]
  );

  const currentMetrics = useMemo(
    () => calculateMetrics(currentOrders),
    [currentOrders, calculateMetrics]
  );

  const previousMetrics = useMemo(
    () => calculateMetrics(previousOrders),
    [previousOrders, calculateMetrics]
  );

  const growth: ReportGrowth = useMemo(() => {
    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      revenue: calcGrowth(currentMetrics.revenue, previousMetrics.revenue),
      profit: calcGrowth(currentMetrics.netProfit, previousMetrics.netProfit),
      qty: calcGrowth(currentMetrics.totalQty, previousMetrics.totalQty)
    };
  }, [currentMetrics, previousMetrics]);

  const topProducts: TopSellingProduct[] = useMemo(() => {
    const map = new Map<string, TopSellingProduct>();

    currentOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;

        const key = item.name;
        const rev = item.price * item.quantity;
        const hpp = (item.cogs || 180000) * item.quantity;
        const profit = rev - hpp;

        const current = map.get(key) || { name: item.name, totalQty: 0, revenue: 0, profit: 0 };
        map.set(key, {
          name: item.name,
          totalQty: current.totalQty + item.quantity,
          revenue: current.revenue + rev,
          profit: current.profit + profit
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [currentOrders, selectedProduct]);

  const chartDataPoints: DailyChartPoint[] = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    if (start > end) return [];

    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    const dates: { dateStr: string; keyDateStr: string; prevKeyDateStr: string }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const prevD = new Date(current.getTime() - totalDays * 24 * 60 * 60 * 1000);
      dates.push({
        dateStr: current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        keyDateStr: current.toLocaleDateString('id-ID'),
        prevKeyDateStr: prevD.toLocaleDateString('id-ID')
      });
      current.setDate(current.getDate() + 1);
    }

    return dates.map(({ dateStr, keyDateStr, prevKeyDateStr }) => {
      let dailyRevenue = 0;
      let dailyProfit = 0;
      let prevDailyRevenue = 0;

      currentOrders.forEach((o) => {
        const orderDateStr = new Date(o.createdAt).toLocaleDateString('id-ID');
        if (orderDateStr === keyDateStr) {
          o.items.forEach((item) => {
            if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;
            const rev = item.price * item.quantity;
            const hpp = (item.cogs || 180000) * item.quantity;
            dailyRevenue += rev;
            dailyProfit += rev - hpp;
          });
        }
      });

      if (previousOrders.length > 0) {
        previousOrders.forEach((o) => {
          const orderDateStr = new Date(o.createdAt).toLocaleDateString('id-ID');
          if (orderDateStr === prevKeyDateStr) {
            o.items.forEach((item) => {
              if (selectedProduct !== 'ALL' && item.name !== selectedProduct) return;
              prevDailyRevenue += item.price * item.quantity;
            });
          }
        });
      }

      return {
        label: dateStr,
        revenue: dailyRevenue,
        profit: dailyProfit,
        prevRevenue: prevDailyRevenue
      };
    });
  }, [currentOrders, previousOrders, startDate, endDate, selectedProduct]);

  const chartInsights: ChartInsights = useMemo(() => {
    let peakRevenue = 0;
    let peakLabel = '-';
    let totalRev = 0;
    let daysWithSales = 0;

    chartDataPoints.forEach((d) => {
      totalRev += d.revenue;
      if (d.revenue > peakRevenue) {
        peakRevenue = d.revenue;
        peakLabel = d.label;
      }
      if (d.revenue > 0) daysWithSales++;
    });

    const avgDaily = chartDataPoints.length > 0 ? totalRev / chartDataPoints.length : 0;

    return {
      peakRevenue,
      peakLabel,
      avgDaily,
      daysWithSales,
      totalPoints: chartDataPoints.length
    };
  }, [chartDataPoints]);

  return {
    orders,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    presetRange,
    setPresetRange,
    selectedProduct,
    setSelectedProduct,
    applyPreset,
    availableProducts,
    currentOrders,
    previousOrders,
    currentMetrics,
    previousMetrics,
    growth,
    topProducts,
    chartDataPoints,
    chartInsights
  };
}
