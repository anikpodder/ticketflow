export type NotificationPayload = {
  userId: string;
  bookingId: string;
  title: string;
  message: string;
};

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}
