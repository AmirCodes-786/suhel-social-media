import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    profile_picture: {
      type: String,
      default: null,
    },
    cover_picture: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

profileSchema.virtual('id').get(function () {
  return this._id;
});

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
