import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import BetaBanner from '../components/BetaBanner';
import { GoldCard, Mandala } from '../components/VedicUI';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/forgot-password`, {
        email
      });

      if (res.data?.success) {
        toast.success('OTP sent to your email!');
        navigate('/verify-otp', { state: { email } });
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      toast.error(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vedic-bg flex flex-col font-outfit relative overflow-hidden">
      <BetaBanner />
      {/* Background decorations */}
      <div className="absolute top-20 right-[-60px]">
        <Mandala size={200} opacity={0.04} color="#D4760A" />
      </div>
      <div className="absolute bottom-20 left-[-60px]">
        <Mandala size={180} opacity={0.03} color="#7B1A38" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <GoldCard className="w-full max-w-md shadow-2xl">
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-saffron to-maroon rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 font-playfair text-vtext">
                Forgot <span className="text-saffron">Password</span>
              </h1>
              <p className="text-vtext-muted">
                Enter your email to receive a password reset OTP
              </p>
            </div>
          </div>
          <div className="px-8 pb-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-vtext-mid">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-vtext-dim" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="vedic-input pl-10"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold py-6 text-lg rounded-xl shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link to="/login" className="text-sm text-vtext-muted hover:text-saffron flex items-center justify-center gap-2 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>

            <div className="border-t border-vborder pt-6">
              <p className="text-sm text-vtext-dim italic text-center">
                "The stars will guide you back to your path."
              </p>
            </div>
          </div>
        </GoldCard>
      </div>
    </div>
  );
};

export default ForgotPassword;
