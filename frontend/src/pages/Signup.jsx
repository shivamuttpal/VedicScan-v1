import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import BetaBanner from '../components/BetaBanner';
import { DisclaimerLink } from '../components/DisclaimerModal';
import { Mandala, GoldBar, GoogleIcon } from '../components/VedicUI';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSession } = useAuth();

  // Registration fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // phone stores the full number including country code, e.g. "919876543210"
  const [phone, setPhone] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP step state
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer for resend button
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Check for resumed verification from navigation state
  useEffect(() => {
    if (location.state?.resumeEmail) {
      setEmail(location.state.resumeEmail);
      setIsVerifying(true);
      toast.info('Please verify your account to continue.');
    }
  }, [location.state]);

  /* ─────────────── Email Sign-up ─────────────── */
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      // Prepend '+' so the backend receives a proper E.164 number like +919876543210
      const formattedPhone = phone ? `+${phone}` : undefined;

      const res = await axios.post(`${BACKEND_URL}/api/users/register`, {
        email,
        password,
        firstName,
        lastName: lastName || undefined,
        phone: formattedPhone,
      });

      if (res.data?.success) {
        toast.success('Verification code sent to your email and mobile!');
        setIsVerifying(true);
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error(err.response?.data?.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Email OTP Verification ─────────────── */
  const handleVerifyEmail = async () => {
    if (emailOtp.length !== 6) {
      toast.error('Please enter the 6-digit email code');
      return;
    }
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/verify-email`, { email, otp: emailOtp });

      if (res.data?.success) {
        setEmailVerified(true);
        toast.success('Email verified!');
        if (res.data.data?.isFullyVerified && res.data.data?.token) {
          saveSession(res.data.data.token, res.data.data.user);
          toast.success('Welcome to VedicScan 🎉');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Email verification error:', err);
      toast.error(err.response?.data?.message || 'Invalid or expired email code.');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Phone OTP Verification ─────────────── */
  const handleVerifyPhone = async () => {
    if (phoneOtp.length !== 6) {
      toast.error('Please enter the 6-digit phone code');
      return;
    }
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/verify-phone`, { email, otp: phoneOtp });

      if (res.data?.success) {
        setPhoneVerified(true);
        toast.success('Phone verified!');
        if (res.data.data?.isFullyVerified && res.data.data?.token) {
          saveSession(res.data.data.token, res.data.data.user);
          toast.success('Welcome to VedicScan 🎉');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Phone verification error:', err);
      toast.error(err.response?.data?.message || 'Invalid or expired phone code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.post(`${BACKEND_URL}/api/users/resend-otp`, { email, phone });

      if (res.data?.success) {
        toast.success('New verification code sent!');
        setResendTimer(60); // 60 seconds cooldown
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      toast.error(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Google Sign-up ─────────────── */
  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await axios.post(`${BACKEND_URL}/api/users/google-login`, {
          token: tokenResponse.access_token,
        });

        if (res.data?.success && res.data?.data?.token) {
          saveSession(res.data.data.token, res.data.data.user);
          toast.success('Account created with Google!');
          navigate('/dashboard');
        } else {
          toast.error('Google Signup failed.');
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to authenticate with Google.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Signup Failed:', error);
      toast.error('Google Signup Failed');
      setGoogleLoading(false);
    },
  });

  /* ─────────────── Render ─────────────── */
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
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-saffron to-maroon rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  {isVerifying ? (
                    <Lock className="w-8 h-8 text-white" />
                  ) : (
                    <span className="text-3xl">🔱</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold font-playfair text-vtext mb-1">
                  <span className="text-maroon">Vedic</span><span className="text-saffron">Scan</span>
                </h1>
                <p className="text-vtext-muted text-sm">
                  {isVerifying
                    ? 'Verify your email address'
                    : 'Create your account to begin your cosmic journey'}
                </p>
              </div>

              {!isVerifying ? (
                <>
                  {/* ── Google Sign-up Button ── */}
                  <Button
                    onClick={handleGoogleSignup}
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

                  {/* ── Divider ── */}
                  <div className="relative my-6">
                    <GoldBar />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white px-3 text-xs text-vtext-muted uppercase tracking-wider">or</span>
                    </div>
                  </div>

                  {/* ── Registration Form ── */}
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    {/* First + Last Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-vtext-mid">First Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 h-4 w-4 text-vtext-dim" />
                          <input
                            type="text"
                            placeholder="John"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="vedic-input pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-vtext-mid">
                          Last Name <span className="text-vtext-dim text-xs">(opt)</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 h-4 w-4 text-vtext-dim" />
                          <input
                            type="text"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="vedic-input pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phone input */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-vtext-mid">Phone Number</label>
                      <PhoneInput
                        country="in"
                        value={phone}
                        onChange={(value) => setPhone(value)}
                        inputProps={{
                          id: 'phone',
                          name: 'phone',
                          required: false,
                          autoComplete: 'tel',
                        }}
                        containerStyle={{ width: '100%' }}
                        inputStyle={{
                          width: '100%',
                          height: '44px',
                          fontSize: '14px',
                          borderRadius: '12px',
                          border: '1px solid #E8DFD2',
                          paddingLeft: '56px',
                          background: '#F5F0E8',
                          color: '#2C1E12',
                          fontFamily: 'Outfit, sans-serif',
                        }}
                        buttonStyle={{
                          border: '1px solid #E8DFD2',
                          borderRight: 'none',
                          borderRadius: '12px 0 0 12px',
                          backgroundColor: '#F5F0E8',
                        }}
                        dropdownStyle={{ zIndex: 9999 }}
                        enableSearch
                        searchPlaceholder="Search country..."
                      />
                    </div>

                    {/* Email */}
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

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-vtext-mid">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-vtext-dim" />
                        <input
                          type="password"
                          placeholder="Min. 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="vedic-input pl-10"
                          minLength={6}
                          required
                        />
                      </div>
                      <p className="text-xs text-vtext-dim">Minimum 6 characters</p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold py-6 text-base rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                /* ── OTP Verification View ── */
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Email Verification */}
                    <div className="space-y-2">
                      <label className={`text-sm font-medium ${emailVerified ? "text-vgreen font-bold" : "text-vtext-mid"}`}>
                        {emailVerified ? "✓ Email Verified" : "Email Verification Code"}
                      </label>
                      {!emailVerified && (
                        <p className="text-xs text-vtext-muted">
                          Check your email <strong className="text-vtext">{email}</strong>
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Input
                          id="emailOtp"
                          type="text"
                          inputMode="numeric"
                          placeholder="000000"
                          disabled={emailVerified || loading}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className={`text-center text-xl tracking-[0.2em] font-bold h-12 border-vborder bg-vedic-input rounded-xl ${emailVerified ? "border-vgreen bg-vgreen-soft" : ""}`}
                          required
                        />
                        {!emailVerified && (
                          <Button
                            type="button"
                            onClick={handleVerifyEmail}
                            disabled={loading || emailOtp.length !== 6}
                            className="bg-gradient-to-r from-saffron to-maroon text-white rounded-xl"
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2 space-y-4">
                    {!emailVerified && (
                      <p className="text-sm text-vtext-muted">
                        Didn't receive the code?{' '}
                        <button 
                          onClick={handleResendOTP}
                          disabled={loading || resendTimer > 0}
                          className={`font-semibold underline transition-colors ${resendTimer > 0 ? "text-vtext-dim cursor-not-allowed" : "text-saffron hover:text-maroon"}`}
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                        </button>
                      </p>
                    )}
                    <p className="text-sm text-vtext-muted">
                      Email must be verified to complete registration.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIsVerifying(false); setEmailOtp(''); setEmailVerified(false); }}
                    className="w-full text-sm text-vtext-muted hover:text-saffron flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to registration
                  </button>
                </div>
              )}

              {/* ── Sign In link ── */}
              <div className="text-center text-sm mt-6">
                <span className="text-vtext-muted">Already have an account? </span>
                <Link to="/login" className="text-saffron hover:text-saffron-600 font-semibold transition-colors">
                  Sign In
                </Link>
              </div>

              <div className="text-center text-xs text-vtext-dim mt-3">
                By continuing, you agree to VedicScan's Terms of Service and Privacy Policy
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-6 text-center">
        <DisclaimerLink />
      </div>
    </div>
  );
};

export default Signup;
