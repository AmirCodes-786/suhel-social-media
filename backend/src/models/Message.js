import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
    },
    media: {
      type: String,
      default: null,
    },
    media_type: {
      type: String,
      enum: ['text', 'image'],
      default: 'text',
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

messageSchema.virtual('id').get(function () {
  return this._id.toString();
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
