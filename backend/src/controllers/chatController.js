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

    const formattedList = await Promise.all(
      conversations.map(async (conv) => {
        const [lastMessage, unreadCount] = await Promise.all([
          Message.findOne({ conversation: conv._id })
            .sort({ createdAt: -1 })
            .populate({ path: 'sender', populate: { path: 'profile' } }),
          Message.countDocuments({
            conversation: conv._id,
            is_read: false,
            sender: { $ne: currentUserId },
          }),
        ]);

        return formatConversation(conv, currentUserId, {
          last_message: lastMessage,
          unread_count: unreadCount,
        });
      })
    );

    return res.json(formattedList);
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

    // Trigger notification to other participants
    for (const pId of conversation.participants) {
      if (pId.toString() !== currentUserId) {
        await createNotification({
          recipient: pId,
          sender: currentUserId,
          type: 'message',
        });
      }
    }

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

export default {
  getConversations,
  createConversation,
  getConversationDetail,
  deleteConversation,
  getMessages,
  sendMessage,
  markConversationRead,
};
