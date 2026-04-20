import React from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';

const FEEDBACK_URL = "https://forms.gle/JP3XqV6HPoWaQ34x7";

/**
 * Floating feedback button that appears on all pages
 */
export const FeedbackButton = () => {
  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
    >
      <MessageSquare className="w-4 h-4" />
      <span className="text-sm font-medium">Send Feedback (Beta)</span>
    </a>
  );
};

/**
 * Inline feedback link for use in various locations
 */
export const FeedbackLink = ({ className = '', showIcon = true, text = 'Send Feedback' }) => {
  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-yellow-600 hover:text-yellow-700 transition-colors ${className}`}
    >
      {showIcon && <MessageSquare className="w-3.5 h-3.5 mr-1" />}
      <span>{text}</span>
      <ExternalLink className="w-3 h-3 ml-1" />
    </a>
  );
};

/**
 * Feedback prompt shown when daily limit is reached
 */
export const LimitReachedFeedback = () => {
  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800 mb-2">
        Have feedback? Help us improve →{' '}
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center font-medium text-yellow-700 hover:text-yellow-900 underline"
        >
          Send Feedback
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </p>
    </div>
  );
};

export default FeedbackButton;
