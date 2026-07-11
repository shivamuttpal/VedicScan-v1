import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { User, Calendar, Clock, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BetaBanner from '../components/BetaBanner';
import api from '../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { GoldCard, Mandala } from '../components/VedicUI';
import VedicLoader from '../components/VedicLoader';
import LocationInput from '../components/LocationInput';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth, refreshProfileStatus, logout } = useAuth();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [enforceProfile, setEnforceProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    relationship: 'Self',
    isDefault: false
  });

  // Auto-populate name from user context
  useEffect(() => {
    // Only auto-populate for 'Self' relationship and if name is empty
    if (!editingProfile && showForm && formData.relationship === 'Self' && !formData.name && user) {
      const nameFromContext = (user.firstName || user.name || '').trim();
      const lastNameFromContext = (user.lastName || '').trim();
      const fullName = `${nameFromContext} ${lastNameFromContext}`.trim();
      
      if (fullName) {
        setFormData(prev => ({ ...prev, name: fullName }));
      } else if (user.email) {
        // Fallback to email prefix if no name is available
        const emailPrefix = user.email.split('@')[0];
        setFormData(prev => ({ ...prev, name: emailPrefix }));
      }
    }
  }, [user, showForm, formData.relationship, editingProfile, formData.name]);

  useEffect(() => {
    // Check if first time user or redirected via enforcement
    if (location.state?.isFirstTime) {
      setIsFirstTime(true);
      setShowForm(true);
      toast.info('Welcome! Please create your profile to get started.');
    }
    if (location.state?.enforceProfile) {
      setEnforceProfile(true);
      setShowForm(true);
    }
    fetchProfiles();
  }, [location.state]);

  // Automatically show form when there are no profiles
  useEffect(() => {
    if (!loadingProfiles && profiles.length === 0 && !showForm) {
      setShowForm(true);
    }
  }, [profiles, showForm, loadingProfiles]);

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const response = await api.get('/api/profiles');
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if trying to create another "Self" profile (only for new profiles)
    if (!editingProfile && formData.relationship === 'Self') {
      const existingSelfProfile = profiles.find(p => p.relationship === 'Self');
      if (existingSelfProfile) {
        toast.error('You can only have one "Self" profile. Please choose a different relationship.');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (editingProfile) {
        // Update existing profile
        const response = await api.put(`/api/profiles/${editingProfile.id}`, formData);
        setProfiles(profiles.map(p => p.id === editingProfile.id ? response.data : p));
        toast.success('Profile updated successfully!');
        setEditingProfile(null);
      } else {
        // Create new profile
        const response = await api.post('/api/profiles', formData);
        setProfiles([...profiles, response.data]);
        toast.success('Profile created successfully!');
        
        // Refresh profile status in context
        await refreshProfileStatus();
        
        // If first time user, mark profile as completed
        if (isFirstTime) {
          setIsFirstTime(false);
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        relationship: 'Self'
      });
      setShowForm(false);
      
      // If was first time or enforced, redirect to dashboard
      if ((isFirstTime || enforceProfile) && !editingProfile) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(editingProfile ? 'Failed to update profile' : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      dateOfBirth: profile.dateOfBirth,
      timeOfBirth: profile.timeOfBirth,
      placeOfBirth: profile.placeOfBirth,
      relationship: profile.relationship,
      isDefault: profile.isDefault || false
    });
    setShowForm(true);
  };

  const handleSetDefault = async (profileId) => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      if (profile.isDefault) return;

      const response = await api.put(`/api/profiles/${profileId}`, { isDefault: true });
      fetchProfiles(); // Refresh to update all isDefault flags
      toast.success(`${profile.name} is now your primary profile`);
    } catch (error) {
      console.error('Error setting primary profile:', error);
      toast.error('Failed to update primary profile');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return;
    }
    
    try {
      await api.delete(`/api/profiles/${profileId}`);
      setProfiles(profiles.filter(p => p.id !== profileId));
      toast.success('Profile deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account?\n\nThis permanently deletes your account, ALL birth profiles, ' +
      'kundalis, and chat history. This cannot be undone.'
    );
    if (!confirmed) return;
    try {
      setDeletingAccount(true);
      await api.delete('/api/users/account');
      toast.success('Your account and data have been permanently deleted.');
      logout();
      navigate('/signup');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProfile(null);
    setFormData({
      name: '',
      dateOfBirth: '',
      timeOfBirth: '',
      placeOfBirth: '',
      relationship: 'Self',
      isDefault: false
    });
  };

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit">
      <BetaBanner />
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute bottom-0 left-[-60px]">
          <Mandala size={200} opacity={0.03} color="#D4760A" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-1 text-vtext font-playfair">My Profiles</h1>
              <p className="text-vtext-muted">Manage your birth details and family members</p>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Profile
            </Button>
          </div>
          
          {/* Welcome/Enforcement Alert */}
          {enforceProfile && profiles.length === 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-saffron-soft to-maroon-soft border border-saffron/20 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Mandala size={120} color="#7B1A38" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-maroon font-playfair mb-2">Welcome to VedicScan! 🎉</h2>
                <p className="text-vtext-mid leading-relaxed">
                  To unlock your personalized daily rashifal, AI astrology insights, and compatibility tools, 
                  please start by creating your **primary birth profile**. This will be used as your main identity for all cosmic analysis.
                </p>
              </div>
            </div>
          )}

          {/* Add/Edit Profile Form */}
          {showForm && (
            <GoldCard className="mb-8 shadow-lg">
              <div className="bg-saffron-pale/50 px-6 py-4 border-b border-vborder">
                <h2 className="font-semibold text-saffron font-playfair text-lg">
                  {editingProfile ? 'Edit Profile' : 'Add New Profile'}
                </h2>
                <p className="text-sm text-vtext-muted mt-0.5">
                  {editingProfile 
                    ? 'Update the birth details for this profile' 
                    : 'Enter birth details to generate Kundli and get predictions'}
                </p>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-vtext-mid">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      required
                      className="vedic-input mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="dateOfBirth" className="text-sm font-medium text-vtext-mid">Date of Birth</label>
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="vedic-input mt-1"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="timeOfBirth" className="text-sm font-medium text-vtext-mid">Time of Birth</label>
                      <input
                        id="timeOfBirth"
                        name="timeOfBirth"
                        type="time"
                        value={formData.timeOfBirth}
                        onChange={handleInputChange}
                        required
                        className="vedic-input mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="placeOfBirth" className="text-sm font-medium text-vtext-mid">Place of Birth</label>
                    <LocationInput
                      id="placeOfBirth"
                      name="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={handleInputChange}
                      placeholder="City, State, Country"
                      className="vedic-input mt-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="relationship" className="text-sm font-medium text-vtext-mid">Relationship</label>
                    <select
                      id="relationship"
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      className="vedic-input mt-1"
                    >
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Partner">Partner</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-saffron border-vborder rounded focus:ring-saffron"
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium text-vtext-mid cursor-pointer">
                      Make this my primary profile (Default for Home Screen)
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-2">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold rounded-xl shadow-md"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : (editingProfile ? 'Update Profile' : 'Save Profile')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelForm}
                      disabled={loading}
                      className="border-vborder text-vtext-mid hover:bg-saffron-pale hover:text-saffron rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </GoldCard>
          )}

          {/* Profiles List */}
          {loadingProfiles ? (
            <VedicLoader message="Loading your profiles..." />
          ) : profiles.length === 0 && !showForm ? (
            <GoldCard className="text-center py-16 animate-in fade-in duration-500">
              <div className="p-6">
                <div className="w-16 h-16 rounded-2xl bg-saffron-pale flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-saffron" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-vtext font-playfair">Create Your First Profile</h3>
                <p className="text-vtext-muted mb-6">Add your birth details to get started with personalized predictions</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold rounded-xl shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Profile
                </Button>
              </div>
            </GoldCard>
          ) : profiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profiles.map((profile) => (
                <GoldCard key={profile.id} className="hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-vtext font-playfair">{profile.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold text-saffron bg-saffron-pale rounded-lg">
                            {profile.relationship}
                          </span>
                          {profile.isDefault && (
                            <span className="inline-block px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gold to-saffron rounded-lg shadow-sm">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!profile.isDefault && (
                          <button
                            onClick={() => handleSetDefault(profile.id)}
                            className="p-2 text-gold hover:text-saffron hover:bg-gold-pale rounded-xl transition-colors"
                            title="Set as primary"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditProfile(profile)}
                          className="p-2 text-vtext-muted hover:text-saffron hover:bg-saffron-pale rounded-xl transition-colors"
                          title="Edit profile"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="p-2 text-vtext-muted hover:text-vred hover:bg-vred-soft rounded-xl transition-colors"
                          title="Delete profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center text-sm text-vtext-mid">
                        <Calendar className="w-4 h-4 mr-2 text-saffron" />
                        {new Date(profile.dateOfBirth).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center text-sm text-vtext-mid">
                        <Clock className="w-4 h-4 mr-2 text-saffron" />
                        {profile.timeOfBirth}
                      </div>
                      <div className="flex items-center text-sm text-vtext-mid">
                        <MapPin className="w-4 h-4 mr-2 text-saffron" />
                        {profile.placeOfBirth}
                      </div>
                    </div>
                  </div>
                </GoldCard>
              ))}
            </div>
          )}

          {/* Danger Zone — account deletion */}
          {!showForm && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="rounded-lg border border-red-200 bg-red-50/40 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-700">Delete Account</h3>
                    <p className="text-xs text-red-600/70 mt-0.5">
                      Permanently delete your account and data. <a href="/data-deletion" className="underline hover:text-red-700">Learn more</a>
                    </p>
                  </div>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 px-3 h-auto ml-3 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {deletingAccount ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
