import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Baby, Sparkles, Star, Loader2, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import BetaBanner from '../components/BetaBanner';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatAIResponse } from '../utils/formatAI';
import { GoldCard, Mandala } from '../components/VedicUI';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BabyNaming = () => {
  const { isAuthenticated, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    gender: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateOfBirth || !formData.timeOfBirth || !formData.placeOfBirth || !formData.gender) {
      setError('Please fill in all required fields including gender');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedName(null);
    setExplanation(null);
    
    try {
      const token = getToken();
      if (!token) {
        setError('Please log in to use this feature');
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${BACKEND_URL}/api/baby-naming/generate`,
        {
          dateOfBirth: formData.dateOfBirth,
          timeOfBirth: formData.timeOfBirth,
          placeOfBirth: formData.placeOfBirth,
          gender: formData.gender
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setResult(response.data);
    } catch (err) {
      console.error('Error generating names:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to generate names. Please try again.';
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNameClick = async (name) => {
    if (selectedName?.name === name.name) {
      setSelectedName(null);
      setExplanation(null);
      return;
    }
    
    setSelectedName(name);
    setExplanationLoading(true);
    setExplanation(null);
    
    try {
      const token = getToken();
      if (!token) {
        setExplanation('Please log in to use this feature');
        setExplanationLoading(false);
        return;
      }
      const response = await axios.post(
        `${BACKEND_URL}/api/baby-naming/explain`,
        {
          name: name.name,
          meaning: name.meaning,
          nakshatra: result.nakshatra,
          pada: result.pada,
          syllable: result.allowed_syllables?.[0],
          gender: name.gender || formData.gender
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setExplanation(response.data.explanation);
    } catch (err) {
      console.error('Error getting explanation:', err);
      setExplanation('Unable to load explanation. Please try again.');
    } finally {
      setExplanationLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit">
      <BetaBanner />
      <Navbar />
      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-24 right-[-60px]">
          <Mandala size={240} opacity={0.03} color="#0C7C6B" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-vteal to-vteal-600 mb-4 shadow-lg">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-vtext mb-2 font-playfair">
              Baby Naming <span className="text-vteal">(Nāmakaraṇa)</span>
            </h1>
            <p className="text-base text-vtext-muted">
              Discover auspicious names based on your baby's birth Nakshatra
            </p>
          </div>

          {/* Input Form */}
          <GoldCard className="mb-8 shadow-lg">
            <div className="bg-vteal-soft/50 px-6 py-4 border-b border-vborder">
              <h2 className="flex items-center text-vteal font-semibold">
                <Sparkles className="w-5 h-5 mr-2" />
                Enter Birth Details
              </h2>
              <p className="text-sm text-vtext-muted mt-1">
                Provide the birth details to calculate the Moon Nakshatra and Pada
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-vtext-mid">
                      Date of Birth <span className="text-vred">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="vedic-input"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-vtext-mid">
                      Time of Birth <span className="text-vred">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.timeOfBirth}
                      onChange={(e) => handleInputChange('timeOfBirth', e.target.value)}
                      className="vedic-input"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-vtext-mid">
                      Place of Birth <span className="text-vred">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai, India"
                      value={formData.placeOfBirth}
                      onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                      className="vedic-input"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-vtext-mid">
                      Gender <span className="text-vred">*</span>
                    </label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleInputChange('gender', value)}
                      required
                    >
                      <SelectTrigger className="border-vborder bg-vedic-input focus:border-saffron rounded-xl h-[44px]">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Boy</SelectItem>
                        <SelectItem value="Female">Girl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-vred-soft border border-vred/20 rounded-xl text-vred text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-vteal to-vteal-600 hover:from-vteal-600 hover:to-vteal text-white font-semibold py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Names...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Names
                    </>
                  )}
                </Button>
              </form>
            </div>
          </GoldCard>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Nakshatra Info Card */}
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-vteal to-vteal-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm mb-1">Moon Nakshatra</p>
                      <h2 className="text-3xl font-bold font-playfair">{result.nakshatra}</h2>
                      <p className="text-white/70 text-lg font-devanagari">{result.nakshatra_hindi}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm mb-1">Pada (Quarter)</p>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 text-3xl font-bold backdrop-blur">
                        {result.pada}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 border border-vborder border-t-0 rounded-b-2xl">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-vtext-muted">Recommended syllables:</span>
                    {result.allowed_syllables.map((syllable, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 bg-vteal-soft text-vteal rounded-full text-sm font-semibold"
                      >
                        {syllable}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Names List */}
              <GoldCard className="shadow-lg">
                <div className="p-6 border-b border-vborder">
                  <h3 className="flex items-center text-saffron font-semibold">
                    <Star className="w-5 h-5 mr-2" />
                    Suggested Names ({result.suggested_names.length})
                  </h3>
                  <p className="text-sm text-vtext-muted mt-1">
                    Click on any name to see its spiritual significance
                  </p>
                </div>
                <div className="p-6">
                  {result.suggested_names.length === 0 ? (
                    <div className="text-center py-8 text-vtext-muted">
                      <Info className="w-12 h-12 mx-auto mb-3 text-vtext-dim" />
                      <p>No names found for this Nakshatra and Pada combination.</p>
                      <p className="text-sm mt-2">We are constantly adding new names. Please come back after a few days.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.suggested_names.map((name, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleNameClick(name)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            selectedName?.name === name.name 
                              ? 'border-saffron bg-saffron-pale shadow-md' 
                              : 'border-vborder hover:border-gold-border hover:bg-saffron-pale/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-vtext">{name.name}</p>
                              <p className="text-sm text-vtext-muted">{name.meaning}</p>
                            </div>
                            {name.gender && (
                              <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                                name.gender === 'Boy' 
                                  ? 'bg-saffron-pale text-saffron' 
                                  : name.gender === 'Girl'
                                  ? 'bg-maroon-pale text-maroon'
                                  : 'bg-vpurple-soft text-vpurple'
                              }`}>
                                {name.gender === 'Unisex' ? 'U' : name.gender === 'Boy' ? 'B' : 'G'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GoldCard>

              {/* AI Explanation */}
              {selectedName && (
                <GoldCard className="shadow-lg">
                  <div className="bg-saffron-pale/50 px-6 py-4 border-b border-vborder">
                    <h3 className="text-saffron font-semibold font-playfair text-lg">
                      About "{selectedName.name}"
                    </h3>
                  </div>
                  <div className="p-6">
                    {explanationLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
                        <span className="ml-3 text-vtext-muted">Loading explanation...</span>
                      </div>
                    ) : explanation ? (
                      <div 
                        className="prose prose-amber max-w-none text-vtext-mid leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatAIResponse(explanation) }}
                      />
                    ) : null}
                  </div>
                </GoldCard>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-vteal-soft/50 border border-vteal/20 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-vteal mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-vteal mb-1">About Vedic Baby Naming (Nāmakaraṇa)</p>
                <p className="text-vteal/80">
                  In Vedic tradition, the Moon's position at birth determines the Nakshatra (lunar mansion) and Pada (quarter), 
                  which suggests specific starting syllables for an auspicious name. This ancient practice is believed to 
                  harmonize the child's name with their cosmic blueprint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BabyNaming;
