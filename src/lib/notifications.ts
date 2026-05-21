import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'address' | 'payment' | 'inbox' | 'system' | 'delivery';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await (supabase.rpc as any)('create_notification', {
      p_user_id: params.userId,
      p_title: params.title,
      p_message: params.message,
      p_type: params.type || 'info',
      p_priority: params.priority || 'normal',
      p_action_url: params.actionUrl || null,
      p_action_label: params.actionLabel || null,
      p_metadata: params.metadata || {}
    });

    if (error) throw error;
    return { success: true, notificationId: data };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Create a notification for a new address
 */
export async function notifyAddressCreated(userId: string, addressCode: string, displayAddress: string) {
  return createNotification({
    userId,
    title: '🎉 New Address Created!',
    message: `Your KIVRO address ${addressCode} has been successfully created and is now active.`,
    type: 'address',
    priority: 'normal',
    actionUrl: '/dashboard/addresses',
    actionLabel: 'View Address',
    metadata: {
      addressCode,
      displayAddress
    }
  });
}

/**
 * Create a notification for a payment received
 */
export async function notifyPaymentReceived(userId: string, amount: number, currency: string = 'USD') {
  return createNotification({
    userId,
    title: '💰 Payment Received',
    message: `You have received a payment of ${currency} ${amount}. Thank you!`,
    type: 'payment',
    priority: 'high',
    actionUrl: '/dashboard/payments',
    actionLabel: 'View Payments',
    metadata: {
      amount,
      currency
    }
  });
}

/**
 * Create a notification for a new inbox message
 */
export async function notifyNewInboxMessage(userId: string, subject: string, sender: string) {
  return createNotification({
    userId,
    title: '📬 New Message',
    message: `You have a new message from ${sender}: "${subject}"`,
    type: 'inbox',
    priority: 'normal',
    actionUrl: '/dashboard/inbox',
    actionLabel: 'Read Message',
    metadata: {
      subject,
      sender
    }
  });
}

/**
 * Create a notification for a delivery update
 */
export async function notifyDeliveryUpdate(
  userId: string,
  trackingNumber: string,
  status: string,
  message: string
) {
  return createNotification({
    userId,
    title: '📦 Delivery Update',
    message,
    type: 'delivery',
    priority: status === 'delivered' ? 'high' : 'normal',
    actionUrl: '/dashboard/addresses',
    actionLabel: 'Track Package',
    metadata: {
      trackingNumber,
      status
    }
  });
}

/**
 * Create a system notification
 */
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
) {
  return createNotification({
    userId,
    title,
    message,
    type: 'system',
    priority
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount() {
  try {
    const { data, error } = await (supabase.rpc as any)('get_unread_notification_count');
    
    if (error) throw error;
    return { success: true, count: typeof data === 'number' ? data : 0 };
  } catch (error) {
    return { success: false, count: 0, error };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await (supabase.rpc as any)('mark_notification_read', {
      notification_id: notificationId
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const { error } = await (supabase.rpc as any)('mark_all_notifications_read');

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
