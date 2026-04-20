import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { AlertCircle, Crown } from 'lucide-react';

const UsageBanner = ({ usage }) => {
  const navigate = useNavigate();

  if (!usage || usage.is_premium) return null;

  const isLimitReached = usage.questions_remaining === 0;
  const isNearLimit = usage.questions_remaining <= 1 && !isLimitReached;

  if (!isLimitReached && !isNearLimit) return null;

  return (
    <div className={`${
      isLimitReached ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
    } border-2 rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className={`w-6 h-6 ${
            isLimitReached ? 'text-red-600' : 'text-yellow-600'
          }`} />
          <div>
            <p className={`font-semibold ${
              isLimitReached ? 'text-red-900' : 'text-yellow-900'
            }`}>
              {isLimitReached 
                ? 'Daily limit reached!' 
                : `Only ${usage.questions_remaining} question${usage.questions_remaining === 1 ? '' : 's'} left today`
              }
            </p>
            <p className={`text-sm ${
              isLimitReached ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {isLimitReached
                ? 'Upgrade to Premium for unlimited questions'
                : 'Get unlimited access with Premium'
              }
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/pricing')}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default UsageBanner;
