export interface Notification {
  id: string;
  user_id: string;
  type: 'announcement' | 'event' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  triggered_by?: string;
  metadata?: Record<string, any>;
}

export interface NotificationCreateData {
  user_id: string;
  type: 'announcement' | 'event' | 'system';
  title: string;
  message: string;
  triggered_by?: string;
  metadata?: Record<string, any>;
}