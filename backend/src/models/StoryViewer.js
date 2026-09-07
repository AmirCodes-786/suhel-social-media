import mongoose from 'mongoose';

const storyViewerSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
      index: true,
    },
    viewer: {
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

storyViewerSchema.index({ story: 1, viewer: 1 }, { unique: true });

storyViewerSchema.virtual('id').get(function () {
  return this._id.toString();
});

const StoryViewer = mongoose.model('StoryViewer', storyViewerSchema);
export default StoryViewer;
