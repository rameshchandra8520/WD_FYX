import mongoose from 'mongoose';

const UserPrefsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    cities: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const UserPrefs = mongoose.model('UserPrefs', UserPrefsSchema);



