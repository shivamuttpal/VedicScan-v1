import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Heart, User, Loader2, CheckCircle, XCircle, AlertCircle, BookOpen, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BetaBanner from '../components/BetaBanner';
import api from '../utils/api';
import { toast } from 'sonner';
import { formatAIResponse } from '../utils/formatAI';
import { GoldCard, Mandala } from '../components/VedicUI';

const Compatibility = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  
  const [boyData, setBoyData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: ''
  });
  
  const [girlData, setGirlData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: ''
  });

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setAiExplanation('');
    
    try {
      const response = await api.post('/api/compatibility/analyze', {
        boy: boyData,
        girl: girlData
      });
      
      setResult(response.data);
      toast.success('Compatibility analysis complete!');
      
      // Now get AI explanation
      await getAiExplanation(response.data);
      
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to check compatibility');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.detail || 'Error analyzing compatibility');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getAiExplanation = async (compatibilityData) => {
    setLoadingAi(true);
    try {
      const message = `Please explain this compatibility analysis result. Remember: You must NOT alter any scores or doshas - just explain what they mean according to Vedic scriptures.

COMPATIBILITY DATA (DO NOT MODIFY - EXPLAIN ONLY):
${JSON.stringify(compatibilityData, null, 2)}

Please provide:
1. Brief summary of the compatibility score
2. Explanation of any doshas detected (if remedy_triggers exist, explain the traditional remedies from scriptures)
3. Key points about the match

Remember: The scores and doshas are calculated by a deterministic rules engine. You explain, you don't decide.`;

      const response = await api.post('/api/chat/message', {
        message: message,
        conversationId: null
      });
      
      setAiExplanation(response.data.response);
    } catch (error) {
      console.error('Error getting AI explanation:', error);
    } finally {
      setLoadingAi(false);
    }
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 75) return 'text-vgreen';
    if (percentage >= 50) return 'text-saffron';
    return 'text-vred';
  };

  const getVerdictStyle = (verdict) => {
    if (verdict?.includes('Excellent')) return 'text-vgreen bg-vgreen-soft border-vgreen/20';
    if (verdict?.includes('Good')) return 'text-vteal bg-vteal-soft border-vteal/20';
    if (verdict?.includes('Average')) return 'text-saffron bg-saffron-pale border-saffron/20';
    return 'text-vred bg-vred-soft border-vred/20';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-vred-soft text-vred border-vred/20';
      case 'Medium': return 'bg-saffron-pale text-saffron border-saffron/20';
      case 'Low': return 'bg-vteal-soft text-vteal border-vteal/20';
      default: return 'bg-vedic-bg text-vtext-mid border-vborder';
    }
  };

  const PersonForm = ({ title, data, setData, icon: Icon, accentColor, accentBg }) => (
    <GoldCard className="shadow-lg">
      <div className={`${accentBg} px-6 py-4 border-b border-vborder`}>
        <h3 className={`flex items-center ${accentColor} font-semibold`}>
          <Icon className="w-5 h-5 mr-2" />
          {title}
        </h3>
        <p className="text-sm text-vtext-muted mt-0.5">Enter birth details</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-vtext-mid">Full Name</label>
          <input
            value={data.name}
            onChange={(e) => setData({...data, name: e.target.value})}
            placeholder="Enter name"
            className="vedic-input"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-vtext-mid">Date of Birth</label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => setData({...data, dateOfBirth: e.target.value})}
            className="vedic-input"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-vtext-mid">Time of Birth</label>
          <input
            type="time"
            value={data.timeOfBirth}
            onChange={(e) => setData({...data, timeOfBirth: e.target.value})}
            className="vedic-input"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-vtext-mid">Place of Birth</label>
          <input
            value={data.placeOfBirth}
            onChange={(e) => setData({...data, placeOfBirth: e.target.value})}
            placeholder="City, Country"
            className="vedic-input"
            required
          />
        </div>
      </div>
    </GoldCard>
  );

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit">
      <BetaBanner />
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 right-[-60px]">
          <Mandala size={240} opacity={0.03} color="#7B1A38" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-maroon to-maroon-600 mb-4 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-vtext mb-2 font-playfair">
              Guna Milan <span className="text-maroon">Compatibility</span>
            </h1>
            <p className="text-base text-vtext-muted max-w-2xl mx-auto">
              Classical Ashta-Koota matching based on Brihat Parashara Hora Shastra. 
              100% deterministic, rules-driven analysis.
            </p>
          </div>

          {!result ? (
            /* Input Form */
            <form onSubmit={handleAnalyze}>
              <div className="grid md:grid-cols-2 gap-8">
                <PersonForm
                  title="Boy's Details"
                  data={boyData}
                  setData={setBoyData}
                  icon={User}
                  accentColor="text-saffron"
                  accentBg="bg-saffron-pale/50"
                />
                <PersonForm
                  title="Girl's Details"
                  data={girlData}
                  setData={setGirlData}
                  icon={User}
                  accentColor="text-maroon"
                  accentBg="bg-maroon-pale/50"
                />
              </div>

              <div className="mt-8 text-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-maroon to-saffron hover:from-maroon-600 hover:to-saffron-600 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2" />
                      Check Compatibility
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Results */
            <div className="space-y-8">
              {/* Score Overview */}
              <div className="rounded-2xl overflow-hidden shadow-xl border border-vborder">
                <div className="bg-gradient-to-r from-maroon to-saffron text-white p-8 text-center relative overflow-hidden">
                  <div className="absolute top-[-30px] right-[-30px] opacity-10">
                    <Mandala size={150} opacity={1} color="#B8860B" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 relative z-10">Compatibility Score</h2>
                  <div className="text-7xl font-bold mb-2 font-playfair relative z-10">
                    {result.guna_milan.total_score}/{result.guna_milan.max_score}
                  </div>
                  <p className="text-xl opacity-90 relative z-10">{result.guna_milan.percentage}% Match</p>
                </div>
                <div className="bg-white p-6">
                  <div className={`text-center py-4 px-6 rounded-xl border-2 ${getVerdictStyle(result.guna_milan.verdict)}`}>
                    <p className="text-2xl font-bold font-playfair">{result.guna_milan.verdict}</p>
                  </div>
                  
                  {/* Person Details */}
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-saffron-pale/50 p-4 rounded-xl border border-saffron/10">
                      <h4 className="font-semibold text-saffron mb-2">{result.boy.name || 'Boy'}</h4>
                      <p className="text-sm text-vtext-mid">Nakshatra: <span className="font-medium text-vtext">{result.boy.moon_nakshatra}</span></p>
                      <p className="text-sm text-vtext-mid">Rashi: <span className="font-medium text-vtext">{result.boy.rashi} ({result.boy.rashi_english})</span></p>
                    </div>
                    <div className="bg-maroon-pale/50 p-4 rounded-xl border border-maroon/10">
                      <h4 className="font-semibold text-maroon mb-2">{result.girl.name || 'Girl'}</h4>
                      <p className="text-sm text-vtext-mid">Nakshatra: <span className="font-medium text-vtext">{result.girl.moon_nakshatra}</span></p>
                      <p className="text-sm text-vtext-mid">Rashi: <span className="font-medium text-vtext">{result.girl.rashi} ({result.girl.rashi_english})</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Koota Breakdown */}
              <GoldCard className="shadow-lg">
                <div className="p-6 border-b border-vborder">
                  <h3 className="flex items-center text-saffron font-semibold">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Ashta-Koota Breakdown
                  </h3>
                  <p className="text-sm text-vtext-muted mt-1">Detailed scoring for all 8 Kootas</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {result.guna_milan.koota_breakdown.map((koota, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-vedic-bg rounded-xl">
                        <div className="flex items-center space-x-3">
                          {koota.passed ? (
                            <CheckCircle className="w-5 h-5 text-vgreen" />
                          ) : (
                            <XCircle className="w-5 h-5 text-vred" />
                          )}
                          <div>
                            <p className="font-medium text-vtext">{koota.koota}</p>
                            <p className="text-xs text-vtext-muted">{koota.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getScoreColor(koota.score, koota.max_score)}`}>
                            {koota.score}/{koota.max_score}
                          </p>
                          <p className="text-xs text-vtext-dim">{koota.rule_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GoldCard>

              {/* Doshas Detected */}
              {result.doshas && result.doshas.length > 0 && (
                <GoldCard className="shadow-lg border-saffron/30">
                  <div className="bg-saffron-pale/50 px-6 py-4 border-b border-vborder">
                    <h3 className="flex items-center text-saffron font-semibold">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Doshas Detected
                    </h3>
                    <p className="text-sm text-vtext-muted mt-0.5">These are independent of the Guna score</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {result.doshas.map((dosha, index) => (
                        <div key={index} className={`p-4 rounded-xl border-2 ${getSeverityColor(dosha.severity)}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{dosha.dosha_name}</h4>
                              <p className="text-sm mt-1">{dosha.description}</p>
                              {dosha.classical_reference && (
                                <p className="text-xs mt-2 italic opacity-75">📚 {dosha.classical_reference}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getSeverityColor(dosha.severity)}`}>
                                {dosha.severity}
                              </span>
                              <p className="text-xs mt-1">{dosha.cancellable ? 'Cancellable' : 'Non-cancellable'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GoldCard>
              )}

              {/* Remedy Triggers */}
              {result.remedy_triggers && result.remedy_triggers.length > 0 && (
                <GoldCard className="shadow-lg border-vpurple/20">
                  <div className="bg-vpurple-soft/50 px-6 py-4 border-b border-vborder">
                    <h3 className="flex items-center text-vpurple font-semibold">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Remedies Required
                    </h3>
                    <p className="text-sm text-vtext-muted mt-0.5">Classical remedies from Vedic scriptures</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {result.remedy_triggers.map((trigger, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-vpurple-soft/30 rounded-xl">
                          <span className="font-medium text-vtext">{trigger.dosha}</span>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getSeverityColor(trigger.severity)}`}>
                            {trigger.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-vtext-muted mt-4 italic">
                      * Specific remedies will be explained by Maharshi based on classical texts
                    </p>
                  </div>
                </GoldCard>
              )}

              {/* AI Explanation */}
              <GoldCard className="shadow-lg">
                <div className="bg-saffron-pale/50 px-6 py-4 border-b border-vborder">
                  <h3 className="flex items-center text-saffron font-semibold">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Maharshi's Explanation
                  </h3>
                  <p className="text-sm text-vtext-muted mt-0.5">Based on Vedic scriptures (AI explains, does not decide)</p>
                </div>
                <div className="p-6">
                  {loadingAi ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-saffron mr-2" />
                      <span className="text-vtext-muted">Consulting the ancient texts...</span>
                    </div>
                  ) : aiExplanation ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-vtext-mid leading-relaxed">
                        {formatAIResponse(aiExplanation)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-vtext-muted italic">
                      AI explanation will appear here after analysis.
                    </p>
                  )}
                </div>
              </GoldCard>

              {/* New Analysis Button */}
              <div className="text-center">
                <Button
                  onClick={() => {
                    setResult(null);
                    setAiExplanation('');
                    setBoyData({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
                    setGirlData({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
                  }}
                  variant="outline"
                  className="px-8 py-4 border-vborder text-vtext-mid hover:bg-saffron-pale hover:text-saffron hover:border-saffron rounded-xl transition-all"
                >
                  Check Another Match
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Compatibility;
