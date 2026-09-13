export interface ActivityLogItem {
  id: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ActivityLogFilters {
  action: string;
  module: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ActivityLogResponse {
  items: ActivityLogItem[];
  summary: {
    total: number;
    today: number;
    uniqueActors: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
