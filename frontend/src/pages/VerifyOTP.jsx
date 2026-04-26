import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import BetaBanner from '../components/BetaBanner';
import { GoldCard, Mandala } from '../components/VedicUI';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  React.useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/verify-otp`, {
        email,
        otp
      });

      if (res.data?.success) {
        toast.success('OTP verified successfully!');
        navigate('/reset-password', { state: { email, otp } });
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      toast.error(err.response?.data?.message || 'Invalid OTP or it has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/forgot-password`, { email });

      if (res.data?.success) {
        toast.success('New verification code sent!');
        setResendTimer(60);
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      toast.error(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vedic-bg flex flex-col font-outfit relative overflow-hidden">
      <BetaBanner />
      <div className="absolute top-20 right-[-60px]">
        <Mandala size={200} opacity={0.04} color="#D4760A" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <GoldCard className="w-full max-w-md shadow-2xl">
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-saffron to-maroon rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 font-playfair text-vtext">
                Verify <span className="text-saffron">OTP</span>
              </h1>
              <p className="text-vtext-muted">
                Enter the 6-digit code sent to <strong className="text-vtext">{email}</strong>
              </p>
            </div>
          </div>
          <div className="px-8 pb-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-sm font-medium text-vtext-mid">One-Time Password</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="vedic-input text-center text-2xl tracking-[0.5em] font-bold h-16"
                  required
                />
              </div>
              <Button 
                type="submit"
                disabled={loading || !otp}
                className="w-full bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold py-6 text-lg rounded-xl shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm text-vtext-muted">
                Didn't receive the code?{' '}
                <button 
                  onClick={handleResend}
                  disabled={loading || resendTimer > 0}
                  className={`font-semibold underline transition-colors ${resendTimer > 0 ? "text-vtext-dim cursor-not-allowed" : "text-saffron hover:text-maroon"}`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </p>
              <Link to="/forgot-password" className="text-sm text-vtext-muted hover:text-saffron flex items-center justify-center gap-2 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Change Email
              </Link>
            </div>
          </div>
        </GoldCard>
      </div>
    </div>
  );
};

export default VerifyOTP;
