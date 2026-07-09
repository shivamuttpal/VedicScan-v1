import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import { DisclaimerLink } from './DisclaimerModal';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-maroon-600 to-maroon-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔱</span>
              <div className="text-2xl font-bold font-playfair">
                <span className="text-white">Vedic</span>
                <span className="text-gold">Scan</span>
              </div>
            </div>
            <p className="text-maroon-soft/80 text-sm leading-relaxed">
              AI-powered Vedic astrology platform rooted in authentic Indian scriptures. Ancient wisdom for modern life.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-lg text-gold">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/compatibility" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Compatibility Check
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  AI Astrologer
                </Link>
              </li>
              <li>
                <Link to="/baby-naming" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Baby Naming
                </Link>
              </li>
              <li>
                <Link to="/insights" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Daily Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-lg text-gold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link to="/data-deletion" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Account & Data Deletion
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-lg text-gold">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-maroon-soft/70 hover:text-gold transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-maroon-soft/70 hover:text-gold transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-maroon-soft/70 hover:text-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-maroon-soft/70 hover:text-gold transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
            <a href="mailto:contact@vedicscan.com" className="text-maroon-soft/70 hover:text-gold transition-colors text-sm flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              contact@vedicscan.com
            </a>
          </div>
        </div>

        {/* Gold divider */}
        <div className="mt-8 mb-6 h-[1px]" style={{
          background: 'linear-gradient(90deg, transparent 0%, #D4BA80 50%, transparent 100%)'
        }} />

        <div className="flex flex-col sm:flex-row items-center justify-between text-maroon-soft/60 text-sm">
          <p>&copy; 2025 VedicScan. All rights reserved. Powered by Ancient Wisdom & Modern AI.</p>
          <DisclaimerLink className="mt-4 sm:mt-0 text-gold hover:text-gold-soft" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
