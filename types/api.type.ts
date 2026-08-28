import { PaginationMeta } from './pagination.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  meta?: PaginationMeta;
  data: T;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  meta: PaginationMeta;
  data: T[];
}
