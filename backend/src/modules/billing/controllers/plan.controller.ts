/**
 * Plan Controller — public product catalogue.
 *
 * Unauthenticated so the paywall can render before sign-up. Exposes no user
 * state, only the plans and prices stored in MongoDB.
 */

import { Request, Response, NextFunction } from 'express';
import { planService } from '../services';
import { getPlansQuerySchema } from '../validators/billing.validator';
import { successResponse, errorResponse } from '../../../utils/response.util';

/**
 * Best-effort region detection.
 *
 * Reads the country header injected by the CDN/load balancer (CloudFront,
 * Cloudflare) and allows an explicit override for QA. Falls back to DEFAULT,
 * which resolves to rest-of-world pricing.
 *
 * This only selects which price to *display* — it grants nothing, so spoofing
 * the header cannot produce a cheaper charge. The real amount is set in the
 * store console and enforced by Google/Apple.
 */
function resolveRegion(req: Request, override?: string): string {
  if (override) return override.toUpperCase();

  const header =
    (req.headers['cloudfront-viewer-country'] as string) ||
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-vercel-ip-country'] as string) ||
    (req.headers['x-country-code'] as string);

  return header ? header.toUpperCase() : 'DEFAULT';
}

export const planController = {
  /**
   * GET /api/billing/plans
   * Public. Returns the active plan catalogue with region-appropriate pricing.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getPlansQuerySchema.safeParse(req.query);
      if (!query.success) {
        return errorResponse(res, 'Invalid query parameters', 400, query.error.flatten());
      }

      const region = resolveRegion(req, query.data.region);
      const plans = await planService.getCatalogue(region);

      return successResponse(res, { region, plans }, 'Plans retrieved successfully');
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/billing/plans/:code
   * Public. Single plan detail.
   */
  async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const region = resolveRegion(req, req.query.region as string | undefined);
      const plan = await planService.getPlanByCode(req.params.code, region);

      if (!plan) return errorResponse(res, 'Plan not found', 404);

      return successResponse(res, { region, plan }, 'Plan retrieved successfully');
    } catch (error) {
      return next(error);
    }
  },
};
