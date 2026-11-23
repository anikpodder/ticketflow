import { prisma } from "@/lib/prisma";
import { NotificationChannel, NotificationPayload } from "./notification.types";

export class InAppNotificationChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        bookingId: payload.bookingId,
        channel: "IN_APP",
        status: "SENT",
        title: payload.title,
        message: payload.message,
        sentAt: new Date(),
      },
    });
  }
}

export class ConsoleEmailNotificationChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    console.log("========== EMAIL NOTIFICATION ==========");
    console.log("User ID:", payload.userId);
    console.log("Subject:", payload.title);
    console.log("Message:", payload.message);
    console.log("========================================");
  }
}
