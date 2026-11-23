import {
  ConsoleEmailNotificationChannel,
  InAppNotificationChannel,
} from "./notification.channels";

import { NotificationPayload } from "./notification.types";

const inAppChannel = new InAppNotificationChannel();
const emailChannel = new ConsoleEmailNotificationChannel();

export async function sendBookingConfirmationNotification(
  payload: NotificationPayload
) {
  await Promise.all([inAppChannel.send(payload), emailChannel.send(payload)]);
}

export async function sendBookingCancellationNotification(
  payload: NotificationPayload
) {
  await Promise.all([inAppChannel.send(payload), emailChannel.send(payload)]);
}
