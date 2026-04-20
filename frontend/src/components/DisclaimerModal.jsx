import React, { useState } from 'react';
import { X } from 'lucide-react';

const DisclaimerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
          
          <p className="text-amber-700 font-medium italic mb-4">
            May the celestial bodies guide us!
          </p>
          
          <p className="text-gray-700 mb-4">
            VedicScan provides insights derived from classical Vedic astrology using a deterministic, rules-based system.
          </p>
          
          <p className="text-gray-600 mb-4">
            While every effort is made to ensure accuracy and transparency, please note:
          </p>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span className="text-gray-600">Astrological interpretations are interpretive by nature and may vary among practitioners.</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span className="text-gray-600">Outputs are intended for guidance and reflection, not as absolute predictions or guarantees.</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span className="text-gray-600">Outcomes depend significantly on the accuracy of the birth details provided.</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span className="text-gray-600">VedicScan should be used responsibly as a supportive decision-making aid, not a substitute for professional, legal, medical, or financial advice.</span>
            </li>
          </ul>
          
          <p className="text-gray-600 italic mb-6">
            We encourage users to approach astrology as a tool for insight and self-understanding rather than certainty.
          </p>
          
          <p className="text-amber-700 font-medium italic mb-6">
            May the blessings of the celestial bodies guide you on your path.
          </p>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms of Use</h3>
            <p className="text-gray-600 mb-2">
              By using VedicScan, you agree to these{' '}
              <a href="#" className="text-amber-600 hover:text-amber-700 underline">
                terms and conditions
              </a>.
            </p>
            <p className="text-gray-600">
              For questions, feedback, or concerns, please contact us at:{' '}
              <a 
                href="mailto:contact@vedicscan.com" 
                className="text-amber-600 hover:text-amber-700 underline"
              >
                contact@vedicscan.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Disclaimer Link component to be used across pages
export const DisclaimerLink = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`text-amber-600 hover:text-amber-700 underline text-sm font-medium transition-colors ${className}`}
      >
        Disclaimer
      </button>
      <DisclaimerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default DisclaimerModal;
