import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profile.service';
import { AuthRequest } from '../../../middlewares/auth.middleware';

export const profileController = {
  async getProfiles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profiles = await profileService.getProfiles(req.user!.userId);
      res.json(profiles);
    } catch (error) {
      next(error);
    }
  },

  async getDefaultProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.getDefaultProfile(req.user!.userId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  async createProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.createProfile(req.user!.userId, req.body);
      res.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.updateProfile(req.user!.userId, req.params.id, req.body);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  async deleteProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await profileService.deleteProfile(req.user!.userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
