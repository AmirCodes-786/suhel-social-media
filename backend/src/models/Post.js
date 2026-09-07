import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
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
      enum: ['image', 'video', 'text'],
      default: 'text',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

postSchema.virtual('id').get(function () {
  return this._id.toString();
});

postSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post',
});

postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
});

postSchema.virtual('saved_by', {
  ref: 'SavedPost',
  localField: '_id',
  foreignField: 'post',
});

const Post = mongoose.model('Post', postSchema);
export default Post;
