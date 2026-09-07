import mongoose from 'mongoose';

const savedPostSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

savedPostSchema.index({ user: 1, post: 1 }, { unique: true });

savedPostSchema.virtual('id').get(function () {
  return this._id.toString();
});

const SavedPost = mongoose.model('SavedPost', savedPostSchema);
export default SavedPost;
