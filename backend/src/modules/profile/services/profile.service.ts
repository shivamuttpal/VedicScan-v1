import { Profile, IProfile } from '../model/profile.model';

export const profileService = {
  async getProfiles(userId: string) {
    return Profile.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
  },

  async getDefaultProfile(userId: string) {
    let profile = await Profile.findOne({ userId, isDefault: true });
    // Fallback: If no default, check for "Self"
    if (!profile) {
      profile = await Profile.findOne({ userId, relationship: 'Self' });
    }
    // Fallback: Just return the first one created
    if (!profile) {
      profile = await Profile.findOne({ userId }).sort({ createdAt: 1 });
    }
    return profile;
  },

  async createProfile(userId: string, data: Partial<IProfile>) {
    if (data.isDefault) {
      await Profile.updateMany({ userId }, { isDefault: false });
    }
    
    // If it's the first profile, make it default
    const count = await Profile.countDocuments({ userId });
    if (count === 0) {
      data.isDefault = true;
    }

    return Profile.create({ ...data, userId });
  },

  async updateProfile(userId: string, profileId: string, data: Partial<IProfile>) {
    if (data.isDefault) {
      await Profile.updateMany({ userId, _id: { $ne: profileId } }, { isDefault: false });
    }
    
    return Profile.findOneAndUpdate(
      { _id: profileId, userId },
      data,
      { new: true }
    );
  },

  async deleteProfile(userId: string, profileId: string) {
    const profileToDelete = await Profile.findOne({ _id: profileId, userId });
    if (profileToDelete?.isDefault) {
      // If we delete the default, try to make "Self" or any other the new default
      const result = await Profile.findOneAndDelete({ _id: profileId, userId });
      const nextProfile = await Profile.findOne({ userId, relationship: 'Self' }) || await Profile.findOne({ userId });
      if (nextProfile) {
        await Profile.findByIdAndUpdate(nextProfile._id, { isDefault: true });
      }
      return result;
    }
    return Profile.findOneAndDelete({ _id: profileId, userId });
  }
};
