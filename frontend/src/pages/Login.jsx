import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import BetaBanner from '../components/BetaBanner';
import { DisclaimerLink } from '../components/DisclaimerModal';
import { Mandala, GoldBar, GoogleIcon } from '../components/VedicUI';

const Login = () => {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/login`, {
        email,
        password
      });

      if (res.data?.success) {
        if (res.data?.data?.needsVerification) {
          toast.info('Account not verified. Redirecting to verification...');
          navigate('/signup', { state: { resumeEmail: email } });
          return;
        }
        if (res.data?.data?.token) {
          saveSession(res.data.data.token, res.data.data.user);
          toast.success('Login successful!');
          navigate('/profile');
        }
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await axios.post(`${BACKEND_URL}/api/users/google-login`, {
          token: tokenResponse.access_token
        });

        if (res.data?.success && res.data?.data?.token) {
          saveSession(res.data.data.token, res.data.data.user);
          toast.success('Google Login successful!');
          navigate('/profile');
        } else {
          toast.error('Google Login failed.');
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to authenticate with Google.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      toast.error('Google Login Failed');
      setGoogleLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-pale via-vedic-bg to-maroon-pale flex flex-col font-outfit">
      <BetaBanner />
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Mandala decorations */}
        <div className="absolute top-[-60px] right-[-60px]">
          <Mandala size={280} opacity={0.04} color="#D4760A" />
        </div>
        <div className="absolute bottom-[-80px] left-[-40px]">
          <Mandala size={220} opacity={0.03} color="#7B1A38" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-vborder overflow-hidden shadow-xl relative">
            {/* Gold top border */}
            <div className="h-[2.5px]" style={{
              background: 'linear-gradient(90deg, transparent, #B8860B90, #D4760A, #B8860B90, transparent)'
            }} />

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-saffron to-maroon rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl">🔱</span>
                </div>
                <h1 className="text-2xl font-bold font-playfair text-vtext mb-1">
                  <span className="text-maroon">Vedic</span><span className="text-saffron">Scan</span>
                </h1>
                <p className="text-vtext-muted text-sm">Sign in to discover your cosmic path</p>
              </div>

              {/* Google Login */}
              <Button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full bg-white hover:bg-vedic-bg text-vtext font-semibold py-6 text-base shadow-sm border border-vborder rounded-xl"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <span className="mr-3"><GoogleIcon size={20} /></span>
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <GoldBar />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-3 text-xs text-vtext-muted uppercase tracking-wider">or</span>
                </div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-vtext-mid">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-vtext-dim" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="vedic-input pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-vtext-mid">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-vtext-dim" />
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="vedic-input pl-10"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-saffron hover:text-saffron-600 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold py-6 text-base rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Sign up link */}
              <div className="text-center text-sm mt-6">
                <span className="text-vtext-muted">Don't have an account? </span>
                <Link to="/signup" className="text-saffron hover:text-saffron-600 font-semibold transition-colors">
                  Sign Up
                </Link>
              </div>

              {/* Terms */}
              <div className="text-center text-xs text-vtext-dim mt-3">
                By continuing, you agree to VedicScan's Terms of Service and Privacy Policy
              </div>

              {/* Why VedicScan */}
              <GoldBar />
              <div className="text-center space-y-2 mt-2">
                <p className="text-sm text-vtext font-semibold">Why VedicScan?</p>
                <ul className="text-sm text-vtext-muted space-y-1">
                  <li>✨ AI-powered Vedic astrology</li>
                  <li>🔮 Personalized predictions</li>
                  <li>💑 Compatibility analysis</li>
                  <li>📱 Available 24/7</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Disclaimer link at bottom */}
      <div className="pb-6 text-center">
        <DisclaimerLink />
      </div>
    </div>
  );
};

export default Login;
