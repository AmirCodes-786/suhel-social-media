import Notification from '../models/Notification.js';

export const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
}) => {
  try {
    const recipientId = recipient.toString();
    const senderId = sender.toString();

    // Do not notify oneself
    if (recipientId === senderId) {
      return null;
    }

    // Check for existing unread notification of the same type for post/comment/follow to prevent spam
    const existing = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      type,
      post: post || null,
      comment: comment || null,
      is_read: false,
    });

    if (existing) {
      return existing;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post,
      comment,
      is_read: false,
    });

    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
    return null;
  }
};

export const deleteNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
}) => {
  try {
    const filter = {
      recipient: recipient.toString(),
      sender: sender.toString(),
      type,
    };
    if (post) filter.post = post;
    if (comment) filter.comment = comment;

    await Notification.deleteMany(filter);
  } catch (error) {
    console.error('[NotificationService] Failed to delete notification:', error.message);
  }
};

export default {
  createNotification,
  deleteNotification,
};
