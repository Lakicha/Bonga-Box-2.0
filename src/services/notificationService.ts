/**
 * Notification Service
 * Handles in-app and push notifications
 */

export type NotificationType = 'report_received' | 'report_updated' | 'case_resolved' | 'alert_issued' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    this.notifications.unshift(newNotification);
    this.notify();
    return newNotification;
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notify();
    }
  }

  markAllAsRead(userId: string) {
    this.notifications
      .filter(n => n.userId === userId && !n.read)
      .forEach(n => {
        n.read = true;
      });
    this.notify();
  }

  getNotifications(userId: string, unreadOnly = false) {
    return this.notifications.filter(n => {
      if (n.userId !== userId) return false;
      if (unreadOnly && n.read) return false;
      return true;
    });
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notify();
  }

  clearNotifications(userId: string) {
    this.notifications = this.notifications.filter(n => n.userId !== userId);
    this.notify();
  }

  getUnreadCount(userId: string) {
    return this.notifications.filter(n => n.userId === userId && !n.read).length;
  }
}

export const notificationService = new NotificationService();

/**
 * Send notification templates for common scenarios
 */
export const sendReportReceivedNotification = (userId: string, reportId: string) => {
  return notificationService.addNotification({
    userId,
    type: 'report_received',
    title: 'Report Submitted',
    message: 'Your report has been received and will be reviewed by our team.',
    read: false,
    actionUrl: `/reports/${reportId}`,
  });
};

export const sendReportUpdatedNotification = (userId: string, reportId: string, newStatus: string) => {
  return notificationService.addNotification({
    userId,
    type: 'report_updated',
    title: 'Report Updated',
    message: `Your report status has been updated to ${newStatus}.`,
    read: false,
    actionUrl: `/reports/${reportId}`,
    metadata: { status: newStatus },
  });
};

export const sendCaseResolvedNotification = (userId: string, reportId: string) => {
  return notificationService.addNotification({
    userId,
    type: 'case_resolved',
    title: 'Case Resolved',
    message: 'Your report case has been successfully resolved.',
    read: false,
    actionUrl: `/reports/${reportId}`,
  });
};

export const sendAlertNotification = (userId: string, alertMessage: string, location: string) => {
  return notificationService.addNotification({
    userId,
    type: 'alert_issued',
    title: 'New Alert',
    message: `${alertMessage} in ${location}`,
    read: false,
    metadata: { location },
  });
};
