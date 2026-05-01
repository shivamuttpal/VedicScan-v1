import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  Calendar, 
  Heart, 
  Sparkles, 
  Star,
  ChevronDown,
  LayoutDashboard,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/chat', label: 'Maharishi', icon: Sparkles, desc: 'Ask our AI Vedic astrologer' },
    { to: '/baby-naming', label: 'Baby Naming', icon: Star, desc: 'Find the perfect name' },
    { to: '/compatibility', label: 'Kundali Matching', icon: Heart, desc: 'Check cosmic alignment' },
    { to: '/muhurta', label: 'Muhurta Finder', icon: Calendar, comingSoon: true, desc: 'Timing is everything' },
  ];

  const isActiveLink = (path) => location.pathname === path;
  const isAnyToolActive = navLinks.some(link => isActiveLink(link.to));

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-vborder/50 shadow-sm z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-xl transform group-hover:rotate-12 transition-transform duration-300">🔱</span>
            <div className="text-2xl font-bold tracking-tight font-playfair flex items-baseline">
              <span className="text-maroon">Vedic</span>
              <span className="bg-gradient-to-r from-saffron to-gold bg-clip-text text-transparent ml-0.5">Scan</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {isAuthenticated && (
              <>
                {/* Divine Tools Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 outline-none ${
                        isAnyToolActive 
                        ? 'bg-saffron-pale text-saffron shadow-sm' 
                        : 'text-vtext-mid hover:text-saffron hover:bg-saffron-pale/50'
                      }`}>
                      <span>Divine Tools</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 opacity-60`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl shadow-xl border-vborder/40 backdrop-blur-xl bg-white/95">
                    {navLinks.map((link) => (
                      <DropdownMenuItem 
                        key={link.to} 
                        disabled={link.comingSoon}
                        onClick={() => !link.comingSoon && navigate(link.to)}
                        className={`flex items-start p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          isActiveLink(link.to) ? 'bg-saffron-pale/80 text-saffron' : 'hover:bg-vbg-warm'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mr-3 ${isActiveLink(link.to) ? 'bg-white shadow-sm' : 'bg-saffron-pale/30'}`}>
                          <link.icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold flex items-center">
                            {link.label}
                            {link.comingSoon && <span className="ml-2 text-[10px] bg-vborder px-1.5 rounded text-vtext-dim uppercase tracking-wider">Soon</span>}
                          </span>
                          <span className="text-xs text-vtext-muted font-normal mt-0.5">{link.desc}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  to="/pricing"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center ${isActiveLink('/pricing')
                      ? 'bg-saffron-pale text-saffron shadow-sm'
                      : 'text-vtext-mid hover:text-saffron hover:bg-saffron-pale/50'
                    }`}
                >
                  <CreditCard className="w-4 h-4 mr-2 opacity-60" />
                  Pricing
                </Link>

                <div className="w-px h-6 bg-vborder/60 mx-2" />

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-semibold ml-2 rounded-full border-vborder/60 hover:border-saffron hover:bg-saffron-pale hover:text-saffron shadow-sm transition-all pr-1"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-saffron to-maroon text-white flex items-center justify-center text-[10px] mr-2 shadow-sm">
                        {user?.name?.[0] || 'U'}
                      </div>
                      <span className="mr-1">{user?.name?.split(' ')[0] || 'Account'}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-vborder/40 backdrop-blur-xl bg-white/95">
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="flex items-center p-3 rounded-xl cursor-pointer hover:bg-vbg-warm">
                      <LayoutDashboard className="w-4 h-4 mr-3 opacity-60" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Dashboard</span>
                        <span className="text-[10px] text-vtext-muted">View your readings</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/subscription')} className="flex items-center p-3 rounded-xl cursor-pointer hover:bg-vbg-warm">
                      <CreditCard className="w-4 h-4 mr-3 opacity-60" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">My Subscription</span>
                        <span className="text-[10px] text-vtext-muted">Plan, usage & billing</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-vborder/40 my-1" />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center p-3 rounded-xl cursor-pointer hover:bg-red-50 text-red-600">
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="text-sm font-semibold">Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!isAuthenticated && (
              <Button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-bold px-6 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-vtext-mid hover:bg-saffron-pale"
              >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            {!isAuthenticated && (
              <Button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-saffron to-maroon text-white font-bold px-6 rounded-full shadow-md"
              >
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-vborder/40 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-1.5 px-2">
              {!isAuthenticated ? (
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-saffron to-maroon text-white font-bold py-6 rounded-2xl shadow-md"
                >
                  Login to VedicScan
                </Button>
              ) : (
                <>
                  <div className="px-3 py-2 text-[10px] font-bold text-vtext-dim uppercase tracking-widest">Divine Tools</div>
                  {navLinks.map((link) => (
                    <button
                      key={link.to}
                      disabled={link.comingSoon}
                      onClick={() => {
                        if (!link.comingSoon) {
                          setMobileMenuOpen(false);
                          navigate(link.to);
                        }
                      }}
                      className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${
                        isActiveLink(link.to)
                          ? 'bg-saffron-pale text-saffron'
                          : link.comingSoon ? 'opacity-40 grayscale cursor-not-allowed' : 'text-vtext-mid active:bg-vbg-warm'
                      }`}
                    >
                      <link.icon className={`w-5 h-5 mr-3 ${isActiveLink(link.to) ? 'text-saffron' : 'text-vtext-muted'}`} />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">
                          {link.label}
                          {link.comingSoon && <span className="ml-2 text-[10px] opacity-60">(Soon)</span>}
                        </span>
                      </div>
                    </button>
                  ))}

                  <div className="my-2 border-t border-vborder/20 mx-3" />

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/pricing');
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${
                      isActiveLink('/pricing')
                        ? 'bg-saffron-pale text-saffron'
                        : 'text-vtext-mid active:bg-vbg-warm'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mr-3 text-vtext-muted" />
                    <span className="text-sm font-semibold">Pricing</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/subscription');
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${
                      isActiveLink('/subscription')
                        ? 'bg-saffron-pale text-saffron'
                        : 'text-vtext-mid active:bg-vbg-warm'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mr-3 text-vtext-muted" />
                    <span className="text-sm font-semibold">My Subscription</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${
                      isActiveLink('/profile')
                        ? 'bg-saffron-pale text-saffron'
                        : 'text-vtext-mid active:bg-vbg-warm'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5 mr-3 text-vtext-muted" />
                    <span className="text-sm font-semibold">My Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-3 text-red-600 active:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="text-sm font-semibold">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
