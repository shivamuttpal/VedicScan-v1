import { Profile, IProfile, IKundaliInsights } from '../model/profile.model';
import { kundaliService } from '../../kundali/services/kundali.service';

// Fired asynchronously after profile create/update — never blocks the API response.
async function computeAndSaveInsights(profileId: string, userId: string, profile: IProfile): Promise<void> {
  try {
    const kundali = await kundaliService.generate({
      userId,
      name:          profile.name,
      dateOfBirth:   profile.dateOfBirth,
      timeOfBirth:   profile.timeOfBirth,
      placeOfBirth:  profile.placeOfBirth,
      timezoneOffset: 5.5,
    });

    const planetsRaw = kundali.toObject ? kundali.toObject().planets : kundali.planets;
    const planetEntries = planetsRaw instanceof Map
      ? Array.from(planetsRaw.entries())
      : Object.entries(planetsRaw || {});

    const planetSigns:  Record<string, string>  = {};
    const planetHouses: Record<string, number>  = {};
    const retrograde:   Record<string, boolean> = {};

    for (const [pName, pData] of planetEntries as [string, any][]) {
      planetSigns[pName]  = pData.rashi       || '';
      planetHouses[pName] = pData.houseNumber ?? 1;
      retrograde[pName]   = pData.isRetrograde ?? false;
    }

    const activeYogas  = (kundali.yogas  || []).filter((y: any) => y.isPresent).map((y: any) => y.name as string);
    const activeDoshas = (kundali.doshas || []).filter((d: any) => d.isPresent).map((d: any) => d.name as string);

    const manglik  = activeDoshas.some(d => /mangal|manglik/i.test(d));
    const kalsarpa = activeDoshas.some(d => /kaal.*sarp|kalsarp/i.test(d));

    const ss       = (kundali as any).sadeSati;
    const sadeSati = !!(ss?.current_status?.in_sade_sati);
    const sadeSatiPhase: string | undefined = ss?.current_status?.active_phase;

    const insights: IKundaliInsights = {
      ascendant:         kundali.lagna?.sign          || '',
      moonSign:          kundali.moonSign              || '',
      moonNakshatra:     kundali.moonNakshatra         || '',
      sunSign:           kundali.sunSign               || '',
      planetSigns,
      planetHouses,
      retrograde,
      yogas:             activeYogas,
      doshas:            activeDoshas,
      currentMahadasha:  kundali.dasha?.currentMahadasha  || '',
      mahadashaEndDate:  kundali.dasha?.mahadashaEndDate   || '',
      currentAntardasha: kundali.dasha?.currentAntardasha || '',
      antardashaEndDate: kundali.dasha?.antardashaEndDate  || '',
      manglik,
      kalsarpa,
      sadeSati,
      sadeSatiPhase,
      computedAt: new Date(),
    };

    await Profile.findByIdAndUpdate(profileId, { kundaliInsights: insights });
    console.log(`[profile] kundali insights saved for profile ${profileId}`);
  } catch (err: any) {
    console.error(`[profile] kundali insights computation failed for ${profileId}:`, err.message);
  }
}

// Called externally (e.g. from chat controller) to seed missing insights.
export function refreshKundaliInsights(profileId: string, userId: string, profile: IProfile): void {
  computeAndSaveInsights(profileId, userId, profile);
}

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

    const profile = await Profile.create({ ...data, userId });
    // Fire-and-forget: compute kundali insights in the background
    computeAndSaveInsights(String(profile._id), userId, profile);
    return profile;
  },

  async updateProfile(userId: string, profileId: string, data: Partial<IProfile>) {
    if (data.isDefault) {
      await Profile.updateMany({ userId, _id: { $ne: profileId } }, { isDefault: false });
    }

    const updated = await Profile.findOneAndUpdate(
      { _id: profileId, userId },
      data,
      { new: true }
    );

    // Recompute insights whenever birth details change
    const birthFieldChanged = data.dateOfBirth || data.timeOfBirth || data.placeOfBirth;
    if (updated && birthFieldChanged) {
      computeAndSaveInsights(profileId, userId, updated);
    }

    return updated;
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
