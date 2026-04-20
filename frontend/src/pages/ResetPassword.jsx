import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShieldCheck, Lock, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import BetaBanner from '../components/BetaBanner';
import { GoldCard, Mandala } from '../components/VedicUI';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSession } = useAuth();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/reset-password`, {
        email,
        otp,
        newPassword
      });

      if (res.data?.success) {
        toast.success('Password reset successful! Welcome back.');
        saveSession(res.data.data.token, res.data.data.user);
        navigate('/profile');
      } else {
        toast.error('Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error(err.response?.data?.message || 'Failed to reset password. Session might have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !otp) {
    return (
      <div className="min-h-screen bg-vedic-bg flex flex-col items-center justify-center p-4 font-outfit">
        <div className="text-center space-y-4">
          <p className="text-vred">Invalid session. Please start the process again.</p>
          <Link to="/forgot-password" title="Forgot Password">
            <Button className="bg-gradient-to-r from-saffron to-maroon text-white rounded-xl">
              Back to Forgot Password
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 font-playfair text-vtext">
                New <span className="text-saffron">Password</span>
              </h1>
              <p className="text-vtext-muted">
                Create a strong password for your account
              </p>
            </div>
          </div>
          <div className="px-8 pb-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-sm font-medium text-vtext-mid">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-vtext-dim" />
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="vedic-input pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-vtext-mid">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-vtext-dim" />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link to="/login" className="text-sm text-vtext-muted hover:text-saffron flex items-center justify-center gap-2 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Link>
            </div>
          </div>
        </GoldCard>
      </div>
    </div>
  );
};

export default ResetPassword;
