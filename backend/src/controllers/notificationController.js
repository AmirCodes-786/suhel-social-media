import Notification from '../models/Notification.js';
import { formatNotification } from '../utils/formatters.js';

export const getNotifications = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100);

    const notifications = await Notification.find({ recipient: currentUserId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: 'sender',
        select: 'username first_name last_name email profile',
        populate: {
          path: 'profile',
          select: 'bio profile_picture cover_picture website location',
        },
      })
      .populate({
        path: 'post',
        select: 'content',
      })
      .lean();

    const formatted = notifications.map((n) => formatNotification(n, currentUserId));
    return res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.userId;

    const result = await Notification.updateMany(
      { recipient: currentUserId, is_read: false },
      { is_read: true }
    );

    return res.json({
      success: true,
      marked_read_count: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const currentUserId = req.userId;

    const count = await Notification.countDocuments({
      recipient: currentUserId,
      is_read: false,
    });

    return res.json({ unread_count: count });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const notificationId = req.params.pk || req.params.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: currentUserId,
    });

    if (!notification) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    notification.is_read = true;
    await notification.save();

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export default {
  getNotifications,
  markAllAsRead,
  getUnreadCount,
  markNotificationRead,
};
