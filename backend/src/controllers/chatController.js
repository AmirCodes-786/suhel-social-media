import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { formatConversation, formatMessage } from '../utils/formatters.js';
import { createNotification } from '../services/notificationService.js';
import { uploadMedia } from '../services/storageService.js';

export const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.userId;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .sort({ updatedAt: -1 })
      .populate({ path: 'participants', populate: { path: 'profile' } });

    if (conversations.length === 0) {
      return res.json([]);
    }

    const convIds = conversations.map((c) => c._id);

    // 1. Single aggregate for unread message counts
    // 2. Single aggregate to identify the latest message ID for each conversation
    const [unreadCounts, latestMessageGroups] = await Promise.all([
      Message.aggregate([
        {
          $match: {
            conversation: { $in: convIds },
            is_read: false,
            sender: { $ne: currentUserId },
          },
        },
        { $group: { _id: '$conversation', count: { $sum: 1 } } },
      ]),
      Message.aggregate([
        { $match: { conversation: { $in: convIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$conversation',
            messageId: { $first: '$_id' },
          },
        },
      ]),
    ]);

    // Batch populate only the latest messages in ONE query
    const latestMessageIds = latestMessageGroups.map((g) => g.messageId).filter(Boolean);
    const populatedLatestMessages = latestMessageIds.length > 0
      ? await Message.find({ _id: { $in: latestMessageIds } }).populate({
          path: 'sender',
          populate: { path: 'profile' },
        })
      : [];

    const unreadMap = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]));
    const latestMessageMap = new Map(
      populatedLatestMessages.map((m) => [m.conversation.toString(), m])
    );

    const formattedList = conversations.map((conv) => {
      const convIdStr = conv._id.toString();
      return formatConversation(conv, currentUserId, {
        last_message: latestMessageMap.get(convIdStr) || null,
        unread_count: unreadMap.get(convIdStr) || 0,
      });
    });

    return res.json(formattedList);
  } catch (error) {
    next(error);
  }
};

export const getUnreadMessageCount = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const conversations = await Conversation.find({ participants: currentUserId }).select('_id');
    const convIds = conversations.map((c) => c._id);

    if (convIds.length === 0) {
      return res.json({ unread_count: 0 });
    }

    const totalUnread = await Message.countDocuments({
      conversation: { $in: convIds },
      is_read: false,
      sender: { $ne: currentUserId },
    });

    return res.json({ unread_count: totalUnread });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    let { participants } = req.body;

    if (!participants) {
      participants = [];
    }
    if (!Array.isArray(participants)) {
      participants = [participants];
    }

    participants = participants.map((p) => p.toString());
    if (!participants.includes(currentUserId)) {
      participants.push(currentUserId);
    }

    // If 1-on-1, check if already exists to avoid duplicate
    if (participants.length === 2) {
      const otherUserId = participants.find((p) => p !== currentUserId);
      const existing = await Conversation.findOne({
        participants: { $all: [currentUserId, otherUserId], $size: 2 },
      }).populate({ path: 'participants', populate: { path: 'profile' } });

      if (existing) {
        const lastMessage = await Message.findOne({ conversation: existing._id })
          .sort({ createdAt: -1 })
          .populate({ path: 'sender', populate: { path: 'profile' } });

        const unreadCount = await Message.countDocuments({
          conversation: existing._id,
          is_read: false,
          sender: { $ne: currentUserId },
        });

        return res.json(
          formatConversation(existing, currentUserId, {
            last_message: lastMessage,
            unread_count: unreadCount,
          })
        );
      }
    }

    const conversation = await Conversation.create({
      participants,
    });

    await conversation.populate({ path: 'participants', populate: { path: 'profile' } });
    return res.status(201).json(formatConversation(conversation, currentUserId));
  } catch (error) {
    next(error);
  }
};

export const getConversationDetail = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const conversation = await Conversation.findOne({
      _id: req.params.id || req.params.pk,
      participants: currentUserId,
    }).populate({ path: 'participants', populate: { path: 'profile' } });

    if (!conversation) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    const lastMessage = await Message.findOne({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'sender', populate: { path: 'profile' } });

    const unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      is_read: false,
      sender: { $ne: currentUserId },
    });

    return res.json(
      formatConversation(conversation, currentUserId, {
        last_message: lastMessage,
        unread_count: unreadCount,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const conversation = await Conversation.findOne({
      _id: req.params.id || req.params.pk,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ detail: 'Not found.' });
    }

    await Promise.all([
      Conversation.deleteOne({ _id: conversation._id }),
      Message.deleteMany({ conversation: conversation._id }),
    ]);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const conversationId = req.params.conversation_id || req.params.conversationId || req.params.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found.' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate({ path: 'sender', populate: { path: 'profile' } });

    return res.json(messages.map((m) => formatMessage(m, currentUserId)));
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const conversationId = req.params.conversation_id || req.params.conversationId || req.params.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found.' });
    }

    let { content, media_type, media } = req.body;
    media_type = media_type || 'text';

    if (req.file) {
      media = await uploadMedia(req.file, 'chat/media');
      if (req.file.mimetype.startsWith('image/')) {
        media_type = 'image';
      }
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: currentUserId,
      content: content || '',
      media: media || null,
      media_type,
    });

    // Update conversation's updatedAt
    conversation.updatedAt = new Date();
    await conversation.save();

    await message.populate({ path: 'sender', populate: { path: 'profile' } });

    // Trigger notification to other participants asynchronously without blocking response
    conversation.participants.forEach((pId) => {
      if (pId.toString() !== currentUserId) {
        createNotification({
          recipient: pId,
          sender: currentUserId,
          type: 'message',
        }).catch((err) => console.error('[Notification error]', err?.message || err));
      }
    });

    return res.status(201).json(formatMessage(message, currentUserId));
  } catch (error) {
    next(error);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const conversationId = req.params.conversation_id || req.params.conversationId || req.params.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found.' });
    }

    const result = await Message.updateMany(
      {
        conversation: conversation._id,
        is_read: false,
        sender: { $ne: currentUserId },
      },
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

export const deleteMessage = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const messageId = req.params.message_id || req.params.messageId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ detail: 'Message not found.' });
    }

    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ detail: 'You can only delete your own messages.' });
    }

    await Message.deleteOne({ _id: message._id });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const clearChat = async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const conversationId = req.params.conversation_id || req.params.conversationId;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found.' });
    }

    await Message.deleteMany({ conversation: conversation._id });
    return res.json({ success: true, message: 'Chat cleared.' });
  } catch (error) {
    next(error);
  }
};

export default {
  getConversations,
  getUnreadMessageCount,
  createConversation,
  getConversationDetail,
  deleteConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
  clearChat,
};
