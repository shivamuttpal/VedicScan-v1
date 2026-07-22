import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { AlertCircle, Crown } from 'lucide-react';

/**
 * Warns when the user's daily AI chat allowance is running out.
 *
 * Copy deliberately says "Standard", not "Premium" — there is no Premium tier.
 * The plans are Free, Standard Monthly, Standard Yearly and the Add-on Pack.
 *
 * `usage` is the `ai_chat` quota object from `GET /api/billing/status`.
 * `remaining` is null when the allowance is unlimited.
 */
const UsageBanner = ({ usage }) => {
  const navigate = useNavigate();

  // Unlimited (remaining === null) or no data — nothing to warn about.
  if (!usage || usage.unlimited || usage.remaining === null || usage.remaining === undefined) {
    return null;
  }

  const isLimitReached = usage.remaining === 0;
  const isNearLimit = usage.remaining <= 1 && !isLimitReached;

  if (!isLimitReached && !isNearLimit) return null;

  // Tell the user exactly when their allowance comes back, rather than only
  // pushing an upgrade — most users just need to know it resets tonight.
  const resetHint = usage.resetAt
    ? ` Resets ${new Date(usage.resetAt).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}.`
    : '';

  return (
    <div
      className={`${
        isLimitReached ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
      } border-2 rounded-lg p-4 mb-6`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle
            className={`w-6 h-6 ${isLimitReached ? 'text-red-600' : 'text-yellow-600'}`}
          />
          <div>
            <p className={`font-semibold ${isLimitReached ? 'text-red-900' : 'text-yellow-900'}`}>
              {isLimitReached
                ? 'Daily chat limit reached'
                : `Only ${usage.remaining} chat${usage.remaining === 1 ? '' : 's'} left today`}
            </p>
            <p className={`text-sm ${isLimitReached ? 'text-red-700' : 'text-yellow-700'}`}>
              {isLimitReached
                ? `Upgrade to Standard or grab an Add-on Pack for more.${resetHint}`
                : `Upgrade to Standard for 11 chats a day.${resetHint}`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/pricing')}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
        >
          <Crown className="w-4 h-4 mr-2" />
          View Plans
        </Button>
      </div>
    </div>
  );
};

export default UsageBanner;
