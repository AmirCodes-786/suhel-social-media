import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: String,
        ref: 'User',
        required: true,
        index: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

conversationSchema.index({ updatedAt: -1 });

conversationSchema.virtual('id').get(function () {
  return this._id.toString();
});

conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation',
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
