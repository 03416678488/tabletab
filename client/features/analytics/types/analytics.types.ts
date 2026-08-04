export interface Analytics {
  id: number;
  name: string;
  code: string | null;
  isActive: boolean;
}

export interface AnalyticsInput {
  name: string;
  code?: string;
  isActive?: boolean;
}
