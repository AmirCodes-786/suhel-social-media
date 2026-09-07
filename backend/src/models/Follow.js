import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    following: {
      type: String,
      ref: 'User',
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

followSchema.index({ follower: 1, following: 1 }, { unique: true });

followSchema.virtual('id').get(function () {
  return this._id;
});

const Follow = mongoose.model('Follow', followSchema);
export default Follow;
