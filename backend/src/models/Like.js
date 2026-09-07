import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
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

likeSchema.index({ user: 1, post: 1 }, { unique: true });

likeSchema.virtual('id').get(function () {
  return this._id.toString();
});

const Like = mongoose.model('Like', likeSchema);
export default Like;
