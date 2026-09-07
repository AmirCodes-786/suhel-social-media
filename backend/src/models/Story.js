import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    author: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    media: {
      type: String,
      required: [true, 'Media is required for story'],
    },
    media_type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

storySchema.virtual('id').get(function () {
  return this._id.toString();
});

storySchema.virtual('viewers', {
  ref: 'StoryViewer',
  localField: '_id',
  foreignField: 'story',
});

const Story = mongoose.model('Story', storySchema);
export default Story;
