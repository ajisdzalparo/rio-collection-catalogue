'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import type { ActivityLogFilters, ActivityLogItem, ActivityLogResponse } from '../types';

interface UseActivityLogsParams extends ActivityLogFilters {
  page: number;
  pageSize: number;
  search: string;
}

export function useActivityLogs(params: UseActivityLogsParams) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: async () => {
      const query = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize)
      });

      if (params.search.trim()) query.set('search', params.search.trim());
      if (params.action !== 'ALL') query.set('action', params.action);
      if (params.module !== 'ALL') query.set('module', params.module);
      if (params.startDate) query.set('startDate', format(params.startDate, 'yyyy-MM-dd'));
      if (params.endDate) query.set('endDate', format(params.endDate, 'yyyy-MM-dd'));

      const { data } = await axios.get(`/api/v1/activity-logs?${query.toString()}`);
      if (data.code !== 200 || !data.data) {
        throw new Error(data.message || 'Gagal memuat activity log.');
      }
      return data.data as ActivityLogResponse;
    },
    placeholderData: (previousData) => previousData
  });
}

export function useActivityLog(id: string) {
  return useQuery({
    queryKey: ['activity-log', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await axios.get(`/api/v1/activity-logs/${encodeURIComponent(id)}`);
      if (data.code !== 200 || !data.data) {
        throw new Error(data.message || 'Gagal memuat detail aktivitas.');
      }
      return data.data as ActivityLogItem;
    }
  });
}
