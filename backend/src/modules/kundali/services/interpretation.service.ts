import { IInterpretations, IYoga, IDosha } from '../model/kundali.model';

// ─── Static Template Data ───────────────────────────────────────────

const MOON_SIGN_TRAITS: Record<string, {
  personality: string; career: string; health: string; finance: string;
  marriage: string; strengths: string[]; challenges: string[];
}> = {
  Aries: {
    personality: 'You possess a pioneering, bold spirit driven by Mars. Emotionally impulsive and passionate, you lead with your heart. Quick to act, you thrive on new beginnings and excitement. Your emotional nature is direct and transparent.',
    career: 'Excellent for entrepreneurship, military, sports, surgery, engineering, and leadership roles. You excel when given autonomy. Administrative and government positions suit your commanding nature.',
    health: 'Prone to headaches, fever, and face/head-related issues. High energy levels but may burn out quickly. Regular exercise and cooling foods help maintain balance.',
    finance: 'Impulsive spending tendencies offset by strong earning ability. Your boldness drives financial risk-taking that often pays off. Build patience in investments.',
    marriage: 'Passionate and direct in relationships. You need an independent, understanding partner. Prone to short tempers in conflicts but quick to forgive. Avoid dominance.',
    strengths: ['Courageous', 'Natural leader', 'Enthusiastic', 'Direct', 'Independent'],
    challenges: ['Impatient', 'Impulsive', 'Hot-tempered', 'Selfish at times'],
  },
  Taurus: {
    personality: 'Grounded and steady under Venus, your emotional nature craves security and comfort. You are deeply loyal, patient, and value stability above all. Sensual appreciation for beauty, food, and nature defines you.',
    career: 'Excels in finance, banking, real estate, luxury goods, food industry, arts, music, and agriculture. You thrive in stable, long-term careers with tangible results.',
    health: 'Prone to throat, neck, and thyroid issues. Tendency toward weight gain. Regular movement, balanced diet, and avoiding overindulgence support good health.',
    finance: 'Natural wealth accumulator. Conservative but reliable investor. Excellent at building long-term financial security. Dislikes financial uncertainty.',
    marriage: 'Loyal, affectionate, and devoted partner. You seek stability and comfort in relationships. Slow to commit but deeply faithful once committed. Can be possessive.',
    strengths: ['Patient', 'Reliable', 'Sensual', 'Artistic', 'Determined'],
    challenges: ['Stubborn', 'Possessive', 'Resistant to change', 'Overindulgent'],
  },
  Gemini: {
    personality: 'Quick-witted and intellectually driven by Mercury, your emotions shift rapidly. Curious, communicative, and adaptable, you live in the realm of ideas. Social butterfly with a youthful spirit regardless of age.',
    career: 'Journalism, media, writing, teaching, sales, marketing, IT, and communications. Any field requiring quick thinking and versatile skills suits your nature.',
    health: 'Prone to respiratory, nervous system, and shoulder/arm issues. Mental restlessness affects overall health. Regular meditation and consistent routines help.',
    finance: 'Multiple income streams are natural for you. Financial success comes through communication-related work. Avoid scattering energies across too many ventures.',
    marriage: 'Needs an intellectually stimulating partner who keeps pace with your wit. Variety and mental connection are essential. May seem emotionally detached at times.',
    strengths: ['Intelligent', 'Versatile', 'Communicative', 'Witty', 'Adaptable'],
    challenges: ['Inconsistent', 'Superficial', 'Anxious', 'Indecisive'],
  },
  Cancer: {
    personality: 'Deeply intuitive and empathetic, ruled by the Moon in its own sign. Your emotional depth is extraordinary, making you highly sensitive to others\' feelings. Home, family, and tradition are central to your identity.',
    career: 'Nursing, counseling, teaching, real estate, hospitality, food industry, and caregiving. Any field involving nurturing or home life resonates deeply.',
    health: 'Prone to digestive, chest, and emotional health issues. Stress directly impacts physical health. Nurturing yourself emotionally protects physical well-being.',
    finance: 'Cautious and security-oriented with finances. Excellent at saving and property investment. May hold onto money too tightly due to insecurity.',
    marriage: 'Deeply devoted and nurturing partner. Creates a warm, loving home. Extremely loyal but may be too emotionally dependent or clingy at times.',
    strengths: ['Intuitive', 'Caring', 'Loyal', 'Protective', 'Imaginative'],
    challenges: ['Over-sensitive', 'Moody', 'Clinging', 'Withdrawn when hurt'],
  },
  Leo: {
    personality: 'Magnanimous and regal, ruled by the Sun. Your emotional expression is dramatic and generous. Natural charisma draws people to you. Pride and dignity are central to your emotional identity.',
    career: 'Leadership, entertainment, politics, management, education, creative arts, and luxury industries. You excel when in the spotlight or in authority positions.',
    health: 'Prone to heart, back, and spine issues. High stress from ego challenges affects health. Maintain humility and regular cardiac exercise.',
    finance: 'Generous spender with a taste for luxury. Strong earning capacity through leadership roles. Financial success tied to recognition and authority.',
    marriage: 'Romantic, passionate, and loyal. Needs admiration and respect from partner. Generous in love but requires emotional reciprocation. Pride can be a challenge.',
    strengths: ['Charismatic', 'Generous', 'Creative', 'Confident', 'Loyal'],
    challenges: ['Arrogant', 'Ego-driven', 'Demanding', 'Stubborn'],
  },
  Virgo: {
    personality: 'Analytical and perfectionist, ruled by Mercury. Your emotions process through logic and detail. Service-oriented with a desire to improve everything you touch. Critically observant but genuinely caring beneath the surface.',
    career: 'Healthcare, research, accounting, editing, data analysis, service industries, and technical fields. Precision work brings deep satisfaction.',
    health: 'Prone to digestive, intestinal, and nervous system issues. Excessive worry and perfectionism create health anxiety. Clean diet and stress management are essential.',
    finance: 'Excellent financial planner and analyst. Conservative and methodical with money. Risk-averse but steady wealth accumulation through disciplined saving.',
    marriage: 'Devoted, helpful, and practical partner. Expresses love through acts of service. May be overly critical of partner. Needs intellectual connection.',
    strengths: ['Analytical', 'Hardworking', 'Helpful', 'Precise', 'Reliable'],
    challenges: ['Overly critical', 'Perfectionist', 'Anxious', 'Inflexible'],
  },
  Libra: {
    personality: 'Balanced and harmonious under Venus, you crave beauty, fairness, and partnership. Emotionally diplomatic, you struggle with indecision when weighing all sides. Refined aesthetic sense and deep appreciation for art.',
    career: 'Law, diplomacy, fashion, beauty, interior design, counseling, and the arts. Fields requiring negotiation, aesthetics, or partnership suit you perfectly.',
    health: 'Prone to kidney, lower back, and skin issues. Emotional imbalance affects physical health. Maintain equilibrium through partnerships and regular relaxation.',
    finance: 'Moderate financial acumen, improved through partnerships. Tendency to spend on luxury and aesthetics. Financial decisions improve with a trusted advisor.',
    marriage: 'Relationship-oriented by nature. Marriage is central to your happiness. Devoted and charming partner who values harmony above all. Hates conflict.',
    strengths: ['Diplomatic', 'Fair-minded', 'Charming', 'Artistic', 'Cooperative'],
    challenges: ['Indecisive', 'People-pleasing', 'Avoids conflict', 'Superficial'],
  },
  Scorpio: {
    personality: 'Intensely transformative under Mars and Ketu, your emotional depth is unsurpassed. Psychic, perceptive, and powerful, you experience life at extremes. Deeply private but fiercely loyal to those you trust.',
    career: 'Research, psychology, surgery, occult sciences, investigation, finance, and transformation-related fields. Work requiring depth and perseverance is ideal.',
    health: 'Prone to reproductive, elimination, and psychological issues. Emotional suppression can manifest as physical illness. Emotional release through therapy or meditation is vital.',
    finance: 'Excellent at managing others\' money and resources. Intuitive investor with potential for great wealth. Secretive about personal finances.',
    marriage: 'Intensely devoted but emotionally complex partner. Requires complete honesty and loyalty. Deep transformative partnerships that change both lives.',
    strengths: ['Perceptive', 'Determined', 'Loyal', 'Transformative', 'Resourceful'],
    challenges: ['Jealous', 'Secretive', 'Controlling', 'Resentful'],
  },
  Sagittarius: {
    personality: 'Optimistic and philosophical under Jupiter, your emotional nature seeks expansion, truth, and adventure. Freedom-loving and enthusiastic, you inspire others with your vision. Natural teacher and truth-seeker.',
    career: 'Higher education, philosophy, religion, travel industry, law, publishing, and international business. Any field expanding horizons suits your nature.',
    health: 'Prone to hip, thigh, and liver issues. Overindulgence in food and drink. Maintaining physical activity and moderating excess preserves health.',
    finance: 'Optimistic financial outlook, sometimes excessive risk-taking. Generosity can strain finances. International or education-related ventures prove profitable.',
    marriage: 'Freedom-loving partner who needs intellectual and spiritual compatibility. Enthusiastic and inspiring in relationships but resistant to restrictions.',
    strengths: ['Optimistic', 'Philosophical', 'Generous', 'Honest', 'Adventurous'],
    challenges: ['Tactless', 'Overconfident', 'Restless', 'Excess risk-taking'],
  },
  Capricorn: {
    personality: 'Disciplined and ambitious under Saturn, your emotional expression is reserved and practical. You take responsibilities seriously and have a long-term vision. Patient and persistent, you build lasting structures.',
    career: 'Business, government, law, finance, engineering, and management. Leadership of established institutions and long-term career building suit your nature.',
    health: 'Prone to joint, knee, bone, and skin issues. Tendency toward depression from overwork. Work-life balance and regular movement support long-term health.',
    finance: 'Excellent long-term wealth builder. Conservative investor with appreciation for tangible assets like real estate. Financial success comes with age and patience.',
    marriage: 'Committed and responsible partner. May be emotionally reserved initially. Takes relationships seriously and builds lasting bonds. Career-family balance is key.',
    strengths: ['Disciplined', 'Ambitious', 'Patient', 'Responsible', 'Practical'],
    challenges: ['Cold', 'Workaholic', 'Pessimistic', 'Rigid'],
  },
  Aquarius: {
    personality: 'Humanitarian and original under Saturn and Rahu, your emotional nature is detached yet deeply concerned for humanity. Independent thinker with revolutionary ideas. Friends and community are central to your identity.',
    career: 'Technology, social work, research, astrology, aviation, and humanitarian fields. Any cutting-edge or group-oriented work resonates.',
    health: 'Prone to circulatory, ankle, and neurological issues. Irregular routines affect health. Consistent schedules and community activities support well-being.',
    finance: 'Unconventional financial approach. May profit from technology or group ventures. Generous with causes but may overlook personal financial security.',
    marriage: 'Needs intellectual equal who values freedom and friendship. May prioritize friendships over romance. Committed but maintains personal independence.',
    strengths: ['Original', 'Humanitarian', 'Intelligent', 'Independent', 'Visionary'],
    challenges: ['Detached', 'Unpredictable', 'Rebellious', 'Impersonal'],
  },
  Pisces: {
    personality: 'Deeply compassionate and spiritual under Jupiter and Ketu, you feel others\' emotions as your own. Dreamy, creative, and imaginative, you live between the material and spiritual worlds. Boundless empathy.',
    career: 'Arts, healing, spirituality, photography, film, counseling, and service professions. Creative and empathetic fields bring deep fulfillment.',
    health: 'Prone to lymphatic, foot, and immune system issues. Emotional boundaries are essential for physical health. Avoid escapism through substances.',
    finance: 'Inconsistent financial management due to idealism. Wealth through creative arts or spiritual work. Learning practical money management is essential.',
    marriage: 'Deeply romantic, selfless partner who merges completely. Needs a grounded partner to provide stability. May sacrifice too much; boundaries are important.',
    strengths: ['Compassionate', 'Spiritual', 'Creative', 'Intuitive', 'Selfless'],
    challenges: ['Escapist', 'Overly trusting', 'Boundary issues', 'Impractical'],
  },
};

const NAKSHATRA_TRAITS: Record<string, { quality: string; deity: string; nature: string }> = {
  Ashwini: { quality: 'Swift and healing', deity: 'Ashwini Kumaras', nature: 'Pioneer with healing abilities; swift in action, bold spirit' },
  Bharani: { quality: 'Restraint and transformation', deity: 'Yama (deity of death)', nature: 'Strong-willed with a transformative nature; capable of great endurance' },
  Krittika: { quality: 'Sharp and purifying', deity: 'Agni (fire god)', nature: 'Sharp intellect, purifying nature; determined and ambitious leader' },
  Rohini: { quality: 'Creative and fertile', deity: 'Brahma (creator)', nature: 'Artistic and creative; magnetic personality with deep appreciation for beauty' },
  Mrigashira: { quality: 'Gentle and searching', deity: 'Soma (moon god)', nature: 'Curious and gentle seeker; adaptable with sensitivity to environment' },
  Ardra: { quality: 'Stormy and transformative', deity: 'Rudra (storm god)', nature: 'Intense and transformative; intellectual power that cuts through illusion' },
  Punarvasu: { quality: 'Renewing and optimistic', deity: 'Aditi (mother of gods)', nature: 'Optimistic and philosophical; returns after setbacks with renewed energy' },
  Pushya: { quality: 'Nourishing and supportive', deity: 'Brihaspati (Jupiter)', nature: 'Nurturing and responsible; natural caretaker with strong moral values' },
  Ashlesha: { quality: 'Clinging and serpentine', deity: 'Naga (serpent)', nature: 'Perceptive and psychic; penetrating wisdom with powerful intuition' },
  Magha: { quality: 'Regal and ancestral', deity: 'Pitras (ancestors)', nature: 'Authoritative and proud; connected to heritage with natural leadership' },
  'Purva Phalguni': { quality: 'Creative and pleasurable', deity: 'Bhaga (good fortune)', nature: 'Charming and creative; enjoys life\'s pleasures with artistic flair' },
  'Uttara Phalguni': { quality: 'Stable and service', deity: 'Aryaman (friendship)', nature: 'Reliable and service-oriented; builds lasting relationships and institutions' },
  Hasta: { quality: 'Skilled and crafty', deity: 'Savitar (sun god)', nature: 'Skilled with hands; quick-witted and resourceful in practical matters' },
  Chitra: { quality: 'Brilliant and artistic', deity: 'Tvashtar (divine architect)', nature: 'Brilliant and aesthetically gifted; natural designer and visionary' },
  Swati: { quality: 'Independent and moving', deity: 'Vayu (wind god)', nature: 'Independent and adaptable; ability to bend like a reed in the wind without breaking' },
  Vishakha: { quality: 'Purposeful and determined', deity: 'Indra-Agni', nature: 'Goal-oriented and determined; works with singular focus until achievement' },
  Anuradha: { quality: 'Devoted and cooperative', deity: 'Mitra (deity of friendship)', nature: 'Devoted and loyal; builds deep friendships and pursues spiritual paths' },
  Jyeshtha: { quality: 'Senior and protective', deity: 'Indra (king of gods)', nature: 'Protective and authoritative; natural protector with strong sense of duty' },
  Mula: { quality: 'Investigative and transformative', deity: 'Nirriti (dissolution)', nature: 'Goes to the root of everything; philosophical investigator of life\'s mysteries' },
  'Purva Ashadha': { quality: 'Invincible and purifying', deity: 'Apas (water goddess)', nature: 'Powerful and purifying; persistent in goals with early success' },
  'Uttara Ashadha': { quality: 'Final victory', deity: 'Vishwadevas (universal gods)', nature: 'Ultimate achiever; righteous conduct with lasting success and recognition' },
  Shravana: { quality: 'Listening and learning', deity: 'Vishnu (preserver)', nature: 'Excellent listener and learner; knowledge-seeker with wide connections' },
  Dhanishta: { quality: 'Wealthy and musical', deity: 'Eight Vasus (abundance gods)', nature: 'Talented and prosperous; musical and rhythmic sense with community orientation' },
  Shatabhisha: { quality: 'Healing and secretive', deity: 'Varuna (sky god)', nature: 'Healer and researcher; reclusive nature with access to hidden knowledge' },
  'Purva Bhadrapada': { quality: 'Fiery and transformative', deity: 'Aja Ekapada (one-footed goat)', nature: 'Intense and otherworldly; idealistic nature with passion for transformation' },
  'Uttara Bhadrapada': { quality: 'Deep and stabilizing', deity: 'Ahir Budhnya (serpent of deep)', nature: 'Wise and patient; deep thinker who stabilizes situations with calm wisdom' },
  Revati: { quality: 'Nourishing and complete', deity: 'Pushan (guide of souls)', nature: 'Compassionate and complete; protector of the vulnerable with spiritual depth' },
};

const DASHA_INFLUENCES: Record<string, { theme: string; guidance: string; mantra: string; fasting: string }> = {
  Sun: { theme: 'Authority, government, father, soul, leadership', guidance: 'This is a period for asserting yourself, building authority, and working on career advancement. Respect for elders and authorities brings blessings.', mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah', fasting: 'Sunday' },
  Moon: { theme: 'Emotions, mother, mind, home, intuition', guidance: 'Focus on emotional healing, home matters, and deepening intuition. This period favors public relations, nurturing work, and emotional growth.', mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah', fasting: 'Monday' },
  Mars: { theme: 'Energy, courage, property, siblings, competition', guidance: 'Channel your energy into property matters, physical endeavors, and courageous action. Avoid impulsive conflicts and legal disputes.', mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah', fasting: 'Tuesday' },
  Rahu: { theme: 'Foreign, technology, materialism, ambition, innovation', guidance: 'Unprecedented growth is possible through unconventional means. Foreign connections, technology, and out-of-the-box thinking open new doors. Stay grounded spiritually.', mantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah', fasting: 'Saturday' },
  Jupiter: { theme: 'Wisdom, expansion, children, guru, spirituality', guidance: 'A highly auspicious period for higher education, spiritual growth, marriage, and expansion. Seek guidance from mentors. Generosity attracts abundance.', mantra: 'Om Graam Greem Graum Sah Gurave Namah', fasting: 'Thursday' },
  Saturn: { theme: 'Discipline, karma, delays, hard work, longevity', guidance: 'Patience and perseverance are tested now. Hard work brings karmic rewards. Serve the underprivileged. Avoid shortcuts. Foundation building leads to lasting success.', mantra: 'Om Praam Preem Praum Sah Shanaye Namah', fasting: 'Saturday' },
  Mercury: { theme: 'Intelligence, business, communication, siblings, skills', guidance: 'Business ventures, education, and communication-based work thrive. This is an excellent period for writing, learning new skills, and commercial success.', mantra: 'Om Braam Breem Braum Sah Budhaya Namah', fasting: 'Wednesday' },
  Ketu: { theme: 'Spirituality, liberation, past karma, isolation, moksha', guidance: 'Deep spiritual transformation is underway. Let go of material attachments. Focus on inner development, meditation, and resolving past karma.', mantra: 'Om Sraam Sreem Sraum Sah Ketave Namah', fasting: 'Saturday' },
  Venus: { theme: 'Love, luxury, arts, marriage, pleasure, creativity', guidance: 'Excellent period for romance, creative pursuits, financial gains, and aesthetic pleasures. Marriage proposals or artistic success are highlighted. Enjoy life\'s beauty.', mantra: 'Om Draam Dreem Draum Sah Shukraya Namah', fasting: 'Friday' },
};

const PLANET_GEMSTONES: Record<string, string> = {
  Sun: 'Ruby (Manikya)', Moon: 'Pearl (Moti)', Mars: 'Red Coral (Moonga)',
  Mercury: 'Emerald (Panna)', Jupiter: 'Yellow Sapphire (Pukhraj)',
  Venus: 'Diamond (Heera) or White Sapphire', Saturn: 'Blue Sapphire (Neelam)',
  Rahu: 'Hessonite Garnet (Gomed)', Ketu: 'Cat\'s Eye (Lehsunia)',
};

const LAGNA_RULER: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

// Lagna-specific gemstone recommendations based on house lordship analysis
const LAGNA_GEMS: Record<string, { recommend: string[]; avoid: string[] }> = {
  Aries:       { recommend: ['Red Coral (Moonga) — Mars, Lagna lord', 'Yellow Sapphire (Pukhraj) — Jupiter, 9th lord', 'Ruby (Manikya) — Sun, 5th lord'], avoid: ['Diamond — Venus rules 2nd and 7th (maraka)'] },
  Taurus:      { recommend: ['Diamond or White Sapphire — Venus, Lagna lord', 'Blue Sapphire (Neelam) — Saturn, 9th lord (Yogakaraka)', 'Emerald (Panna) — Mercury, 2nd and 5th lord'], avoid: ['Red Coral — Mars rules 7th and 12th', 'Yellow Sapphire — Jupiter rules 8th and 11th'] },
  Gemini:      { recommend: ['Emerald (Panna) — Mercury, Lagna lord', 'Diamond or White Sapphire — Venus, 5th lord'], avoid: ['Yellow Sapphire — Jupiter rules 7th (maraka) and 10th'] },
  Cancer:      { recommend: ['Pearl (Moti) — Moon, Lagna lord', 'Red Coral (Moonga) — Mars, 5th lord', 'Yellow Sapphire (Pukhraj) — Jupiter, 9th lord'], avoid: ['Blue Sapphire — Saturn rules 7th and 8th'] },
  Leo:         { recommend: ['Ruby (Manikya) — Sun, Lagna lord', 'Red Coral (Moonga) — Mars, 9th lord', 'Yellow Sapphire (Pukhraj) — Jupiter, 5th lord'], avoid: ['Blue Sapphire — Saturn rules 6th and 7th (maraka)', 'Diamond — Venus rules 3rd and 10th (maraka)'] },
  Virgo:       { recommend: ['Emerald (Panna) — Mercury, Lagna lord', 'Diamond or White Sapphire — Venus, 2nd and 9th lord'], avoid: ['Yellow Sapphire — Jupiter rules 4th and 7th (maraka)', 'Red Coral — Mars rules 3rd and 8th'] },
  Libra:       { recommend: ['Diamond or White Sapphire — Venus, Lagna lord', 'Blue Sapphire (Neelam) — Saturn, 4th and 5th lord (Yogakaraka)', 'Emerald (Panna) — Mercury, 9th lord'], avoid: ['Red Coral — Mars rules 2nd and 7th (double maraka)', 'Yellow Sapphire — Jupiter rules 3rd and 6th'] },
  Scorpio:     { recommend: ['Yellow Sapphire (Pukhraj) — Jupiter, 2nd and 5th lord (most beneficial)', 'Pearl (Moti) — Moon, 9th lord', 'Red Coral (Moonga) — Mars, Lagna lord'], avoid: ['Emerald — Mercury rules 8th and 11th; not recommended for Scorpio lagna', 'Diamond — Venus rules 7th (maraka) and 12th'] },
  Sagittarius: { recommend: ['Yellow Sapphire (Pukhraj) — Jupiter, Lagna lord', 'Red Coral (Moonga) — Mars, 5th lord', 'Ruby (Manikya) — Sun, 9th lord'], avoid: ['Emerald — Mercury rules 7th (maraka) and 10th', 'Diamond — Venus rules 6th and 11th'] },
  Capricorn:   { recommend: ['Blue Sapphire (Neelam) — Saturn, Lagna lord', 'Diamond or White Sapphire — Venus, 5th and 10th lord (Yogakaraka)', 'Emerald (Panna) — Mercury, 9th lord'], avoid: ['Red Coral — Mars rules 4th and 11th', 'Yellow Sapphire — Jupiter rules 3rd and 12th'] },
  Aquarius:    { recommend: ['Blue Sapphire (Neelam) — Saturn, Lagna lord', 'Diamond or White Sapphire — Venus, 4th and 9th lord', 'Emerald (Panna) — Mercury, 5th lord'], avoid: ['Yellow Sapphire — Jupiter rules 2nd and 11th (maraka)', 'Red Coral — Mars rules 3rd and 10th'] },
  Pisces:      { recommend: ['Yellow Sapphire (Pukhraj) — Jupiter, Lagna lord', 'Red Coral (Moonga) — Mars, 2nd and 9th lord', 'Pearl (Moti) — Moon, 5th lord'], avoid: ['Emerald — Mercury rules 4th and 7th (maraka)', 'Blue Sapphire — Saturn rules 11th and 12th'] },
};

const SIGN_LORDS_INTERP: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

const RASHIS_LIST = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function buildCareerInsights(
  planets: Record<string, { rashi: string; houseNumber: number }>,
  lagnaSign: string,
  yogas: IYoga[]
): string {
  const parts: string[] = [];
  const j  = planets['Jupiter'];
  const me = planets['Mercury'];
  const v  = planets['Venus'];
  const su = planets['Sun'];

  const in9th  = Object.entries(planets).filter(([, p]) => p.houseNumber === 9).map(([n]) => n);
  const in10th = Object.entries(planets).filter(([, p]) => p.houseNumber === 10).map(([n]) => n);

  if (in9th.length >= 3) {
    parts.push(`A powerful 9th house stellium (${in9th.join(', ')}) indicates high achiever energy — career driven by expertise, authority, and ethical principles. Consulting, academia, finance, law, and entrepreneurship are natural fits.`);
  }
  if (j && j.rashi === 'Cancer' && j.houseNumber === 9) {
    parts.push('Exalted Jupiter in the 9th house is a supreme placement — teaching, law, consulting, philosophy, finance, and international opportunities are natural vocational fits. This brings respected, authoritative positions.');
  } else if (j && j.houseNumber === 10) {
    parts.push('Jupiter in the 10th house grants authority and recognition in education, law, finance, and advisory roles.');
  }
  if (me && (me.houseNumber === 9 || me.houseNumber === 10)) {
    parts.push(`Mercury in the ${me.houseNumber}th house strongly supports technology, data science, analytics, research, writing, and communication-intensive careers.`);
  }
  if (v && v.houseNumber === 10) {
    parts.push('Venus in the 10th house (Amala Yoga) brings sustained recognition in business, luxury industries, finance, creative management, and public-facing roles.');
  }
  if (su && su.houseNumber === 10) {
    parts.push('Sun in the 10th house gives strong career authority and is excellent for government, administration, and leadership.');
  }
  const lagnaLord = SIGN_LORDS_INTERP[lagnaSign];
  if (lagnaLord && planets[lagnaLord]) {
    const llH = planets[lagnaLord].houseNumber;
    if (llH === 9) parts.push(`${lagnaLord} (Lagna lord) in the 9th house directs personal drive toward dharma, fortune, and a career with strong ethical foundations.`);
    else if (llH === 10) parts.push(`${lagnaLord} (Lagna lord) in the 10th house makes career a central life focus with strong drive toward professional achievement.`);
  }
  if (yogas.find(y => y.name === 'Guru-Mangal Yoga' && y.isPresent)) {
    parts.push('Guru-Mangal Yoga also favors engineering, medicine, military, project management, and high-energy entrepreneurial ventures.');
  }
  return parts.join(' ');
}

function buildMarriageInsights(
  planets: Record<string, { rashi: string; houseNumber: number }>,
  lagnaSign: string
): string {
  const parts: string[] = [];
  const lagnaIdx = RASHIS_LIST.indexOf(lagnaSign);
  if (lagnaIdx === -1) return '';

  const house7Sign = RASHIS_LIST[(lagnaIdx + 6) % 12];
  const lord7 = SIGN_LORDS_INTERP[house7Sign];
  const lord7Info = lord7 ? planets[lord7] : null;
  const in7th = Object.entries(planets).filter(([, p]) => p.houseNumber === 7).map(([n]) => n);

  if (in7th.includes('Rahu')) {
    parts.push('Rahu in the 7th house brings attraction toward unconventional or cross-cultural partners. The relationship journey may involve confusion and delay before settling, but ultimately creates a transformative partnership. A love-cum-arranged marriage blending is most likely. Avoid rushing into commitment due to intense early attraction.');
  }
  if (in7th.includes('Ketu')) {
    parts.push('Ketu in the 7th house brings a spiritually nuanced view of relationships. Past-life connections with the spouse are indicated. Contentment in marriage grows with spiritual maturity.');
  }
  if (in7th.includes('Jupiter')) {
    parts.push('Jupiter in the 7th house is highly auspicious — spouse is likely wise, educated, and generous. Marriage brings expansion and good fortune.');
  }
  if (in7th.includes('Saturn')) {
    parts.push('Saturn in the 7th often delays marriage timing but brings a responsible, stable, and mature spouse.');
  }
  if (in7th.includes('Venus')) {
    parts.push('Venus in the 7th (own kendra placement) is ideal — a romantic, attractive, and artistically inclined spouse is indicated.');
  }
  if (lord7Info) {
    const h = lord7Info.houseNumber;
    if (h === 10) parts.push(`The 7th lord (${lord7}) in the 10th house suggests a career-oriented or professionally accomplished spouse, possibly met in a work environment.`);
    else if (h === 9) parts.push(`The 7th lord (${lord7}) in the 9th house points toward a spouse from a different region or cultural background with strong values and a philosophical outlook.`);
    else if (h === 5) parts.push(`The 7th lord (${lord7}) in the 5th house strongly favors a love marriage arising from a romantic connection.`);
    else if (h === 1) parts.push(`The 7th lord (${lord7}) in the Lagna creates a strong personality influence from the spouse — marriage deeply shapes the native's identity.`);
  }
  return parts.join(' ');
}

const CHARITY_BY_PLANET: Record<string, string> = {
  Sun: 'Donate wheat, jaggery, or copper on Sundays',
  Moon: 'Donate milk, rice, or white cloth on Mondays',
  Mars: 'Donate red lentils, copper, or land on Tuesdays',
  Mercury: 'Donate green vegetables, books, or money to students on Wednesdays',
  Jupiter: 'Donate yellow items, turmeric, or books to teachers on Thursdays',
  Venus: 'Donate white items, sugar, or perfume on Fridays',
  Saturn: 'Donate black sesame, iron, or oil on Saturdays',
  Rahu: 'Donate blue or black items, coal, or sesame on Saturdays',
  Ketu: 'Donate multi-colored items or blankets to the poor on Saturdays',
};

// ─── Hindi Static Data ────────────────────────────────────────────────────────

const RASHI_HI: Record<string, string> = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
  Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};

const PLANET_HI: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'बृहस्पति', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

const MOON_SIGN_TRAITS_HI: Record<string, {
  personality: string; career: string; health: string; finance: string;
  marriage: string; strengths: string[]; challenges: string[];
}> = {
  Aries: {
    personality: 'मंगल द्वारा संचालित, आपका स्वभाव अग्रणी और साहसी है। आप हृदय से नेतृत्व करते हैं, नई शुरुआत और उत्साह में फलते-फूलते हैं। आपकी भावनाएं प्रत्यक्ष और पारदर्शी होती हैं।',
    career: 'उद्यमिता, सेना, खेल, शल्य-चिकित्सा, इंजीनियरिंग और नेतृत्व पदों के लिए उत्तम। स्वायत्तता मिलने पर आप सर्वश्रेष्ठ प्रदर्शन करते हैं।',
    health: 'सिरदर्द, बुखार और सिर/चेहरे से संबंधित समस्याओं की संभावना। नियमित व्यायाम और शीतलन आहार संतुलन बनाए रखता है।',
    finance: 'आवेगशील खर्च की प्रवृत्ति, परंतु मजबूत कमाई की क्षमता। निवेश में धैर्य विकसित करें।',
    marriage: 'संबंधों में जोशीले और प्रत्यक्ष। स्वतंत्र और समझदार साथी की आवश्यकता। क्रोध जल्दी आता है पर माफ भी जल्दी करते हैं।',
    strengths: ['साहसी', 'प्राकृतिक नेता', 'उत्साही', 'प्रत्यक्ष', 'स्वतंत्र'],
    challenges: ['अधीर', 'आवेगशील', 'क्रोधी स्वभाव', 'कभी-कभी स्वार्थी'],
  },
  Taurus: {
    personality: 'शुक्र द्वारा स्थिर और धरातल से जुड़े, आपकी भावनाएं सुरक्षा और आराम की चाह रखती हैं। आप गहरे वफादार, धैर्यवान हैं और सौंदर्य की सराहना करते हैं।',
    career: 'वित्त, बैंकिंग, रियल एस्टेट, विलासिता वस्तुएं, खाद्य उद्योग, कला और कृषि में उत्कृष्ट। स्थिर और दीर्घकालिक करियर में सफलता मिलती है।',
    health: 'गले, गर्दन और थायरॉइड की समस्याओं की संभावना। संतुलित आहार और नियमित गतिविधि स्वास्थ्य के लिए आवश्यक है।',
    finance: 'प्राकृतिक धन संचयकर्ता। रूढ़िवादी लेकिन विश्वसनीय निवेशक। दीर्घकालिक वित्तीय सुरक्षा निर्मित करने में उत्कृष्ट।',
    marriage: 'वफादार, स्नेही और समर्पित साथी। सुरक्षा और आराम की चाह। धीरे-धीरे प्रतिबद्ध होते हैं पर गहराई से वफादार रहते हैं।',
    strengths: ['धैर्यवान', 'विश्वसनीय', 'कलाप्रिय', 'दृढ़', 'व्यावहारिक'],
    challenges: ['जिद्दी', 'अधिकार जताने वाले', 'परिवर्तन से प्रतिरोधी', 'अति-भोगी'],
  },
  Gemini: {
    personality: 'बुध द्वारा तीक्ष्ण-बुद्धि और बौद्धिक रूप से सक्रिय, आपकी भावनाएं तेजी से बदलती हैं। जिज्ञासु, संचारशील और अनुकूलनशील, आप विचारों की दुनिया में रहते हैं।',
    career: 'पत्रकारिता, मीडिया, लेखन, शिक्षा, बिक्री, विपणन, आईटी और संचार क्षेत्र। त्वरित सोच और बहुमुखी कौशल वाले क्षेत्र उपयुक्त हैं।',
    health: 'श्वसन, तंत्रिका तंत्र और कंधे/बांह की समस्याओं की संभावना। मानसिक बेचैनी समग्र स्वास्थ्य को प्रभावित करती है। ध्यान सहायक है।',
    finance: 'आपके लिए अनेक आय स्रोत स्वाभाविक हैं। संचार-संबंधी कार्य से वित्तीय सफलता मिलती है।',
    marriage: 'बौद्धिक रूप से उत्तेजक साथी की आवश्यकता। विविधता और मानसिक जुड़ाव अत्यंत आवश्यक है।',
    strengths: ['बुद्धिमान', 'बहुमुखी', 'संचारशील', 'हाजिरजवाब', 'अनुकूलनशील'],
    challenges: ['असंगत', 'सतही', 'चिंतित', 'अनिर्णायक'],
  },
  Cancer: {
    personality: 'चंद्रमा द्वारा गहरी अंतर्ज्ञान और सहानुभूति से युक्त, आपकी भावनात्मक गहराई असाधारण है। घर, परिवार और परंपरा आपकी पहचान के केंद्र में हैं।',
    career: 'नर्सिंग, परामर्श, शिक्षा, रियल एस्टेट, आतिथ्य, खाद्य उद्योग और देखभाल सेवाएं उपयुक्त हैं।',
    health: 'पाचन, छाती और भावनात्मक स्वास्थ्य समस्याओं की संभावना। तनाव सीधे शारीरिक स्वास्थ्य को प्रभावित करता है।',
    finance: 'वित्त के प्रति सतर्क और सुरक्षा-उन्मुख। बचत और संपत्ति निवेश में उत्कृष्ट।',
    marriage: 'गहरे समर्पित और पोषणकारी साथी। एक गर्म, प्रेमपूर्ण घर बनाते हैं। बेहद वफादार।',
    strengths: ['अंतर्ज्ञानी', 'देखभाल करने वाले', 'वफादार', 'सुरक्षात्मक', 'कल्पनाशील'],
    challenges: ['अति-संवेदनशील', 'मूडी', 'अत्यधिक लगाव', 'आहत होने पर खुद को बंद कर लेना'],
  },
  Leo: {
    personality: 'सूर्य द्वारा उदार और शाही, आपकी भावनात्मक अभिव्यक्ति नाटकीय और उदार है। स्वाभाविक करिश्मा लोगों को आपकी ओर आकर्षित करता है।',
    career: 'नेतृत्व, मनोरंजन, राजनीति, प्रबंधन, शिक्षा, रचनात्मक कलाएं और विलासिता उद्योग। प्रकाश में रहने पर या अधिकार के पदों पर उत्कृष्ट।',
    health: 'हृदय, पीठ और रीढ़ की समस्याओं की संभावना। अहंकार से जुड़ा तनाव स्वास्थ्य को प्रभावित करता है। नियमित हृदय व्यायाम करें।',
    finance: 'विलासिता में उदार खर्च। नेतृत्व भूमिकाओं के माध्यम से मजबूत कमाई की क्षमता।',
    marriage: 'रोमांटिक, जोशीले और वफादार। साथी से प्रशंसा और सम्मान की आवश्यकता। प्रेम में उदार।',
    strengths: ['करिश्माई', 'उदार', 'रचनात्मक', 'आत्मविश्वासी', 'वफादार'],
    challenges: ['अहंकारी', 'अहं-प्रेरित', 'मांग करने वाले', 'जिद्दी'],
  },
  Virgo: {
    personality: 'बुध द्वारा विश्लेषणात्मक और परफेक्शनिस्ट, आपकी भावनाएं तर्क और विवरण के माध्यम से प्रक्रिया करती हैं। सेवा-उन्मुख और सुधार की इच्छा रखने वाले।',
    career: 'स्वास्थ्य सेवा, अनुसंधान, लेखांकन, संपादन, डेटा विश्लेषण और तकनीकी क्षेत्र। परिशुद्धता कार्य में गहरी संतुष्टि मिलती है।',
    health: 'पाचन, आंतों और तंत्रिका तंत्र की समस्याओं की संभावना। अत्यधिक चिंता स्वास्थ्य चिंता पैदा करती है।',
    finance: 'उत्कृष्ट वित्तीय योजनाकार। अनुशासित बचत के माध्यम से स्थिर धन संचय।',
    marriage: 'समर्पित, सहायक और व्यावहारिक साथी। सेवा के कार्यों से प्रेम व्यक्त करते हैं। बौद्धिक जुड़ाव की आवश्यकता।',
    strengths: ['विश्लेषणात्मक', 'मेहनती', 'सहायक', 'परिशुद्ध', 'विश्वसनीय'],
    challenges: ['अत्यधिक आलोचनात्मक', 'परफेक्शनिस्ट', 'चिंतित', 'अनम्य'],
  },
  Libra: {
    personality: 'शुक्र द्वारा संतुलित और सामंजस्यपूर्ण, आप सौंदर्य, निष्पक्षता और साझेदारी की चाह रखते हैं। भावनात्मक रूप से राजनयिक, परंतु निर्णय लेने में संघर्ष।',
    career: 'कानून, कूटनीति, फैशन, सौंदर्य, इंटीरियर डिजाइन, परामर्श और कलाएं। बातचीत और सौंदर्यशास्त्र वाले क्षेत्र उपयुक्त हैं।',
    health: 'गुर्दे, पीठ के निचले हिस्से और त्वचा की समस्याओं की संभावना। साझेदारी और नियमित विश्राम से संतुलन बनाए रखें।',
    finance: 'साझेदारी के माध्यम से सुधरी वित्तीय समझ। विलासिता पर खर्च की प्रवृत्ति।',
    marriage: 'स्वभाव से संबंध-उन्मुख। विवाह आपकी खुशी के लिए केंद्रीय है। समर्पित और आकर्षक साथी।',
    strengths: ['राजनयिक', 'निष्पक्ष', 'आकर्षक', 'कलाप्रिय', 'सहयोगी'],
    challenges: ['अनिर्णायक', 'सबको खुश करने की प्रवृत्ति', 'संघर्ष से बचते हैं', 'सतही'],
  },
  Scorpio: {
    personality: 'मंगल और केतु द्वारा गहरे परिवर्तनकारी, आपकी भावनात्मक गहराई अद्वितीय है। मनोदर्शी, सूक्ष्मदर्शी और शक्तिशाली, आप जीवन को चरम सीमाओं पर अनुभव करते हैं।',
    career: 'अनुसंधान, मनोविज्ञान, शल्य-चिकित्सा, गुप्त विज्ञान, जांच, वित्त और परिवर्तन-संबंधी क्षेत्र। गहराई और दृढ़ता वाला कार्य आदर्श है।',
    health: 'प्रजनन, उत्सर्जन और मनोवैज्ञानिक समस्याओं की संभावना। भावनात्मक दमन शारीरिक बीमारी के रूप में प्रकट हो सकता है।',
    finance: 'दूसरों के धन और संसाधनों के प्रबंधन में उत्कृष्ट। सहज निवेशक जिसमें महान धन की क्षमता है।',
    marriage: 'तीव्र रूप से समर्पित लेकिन भावनात्मक रूप से जटिल साथी। पूर्ण ईमानदारी और वफादारी की आवश्यकता।',
    strengths: ['सूक्ष्मदर्शी', 'दृढ़', 'वफादार', 'परिवर्तनकारी', 'साधन-संपन्न'],
    challenges: ['ईर्ष्यालु', 'रहस्यमय', 'नियंत्रण करने वाले', 'मनमुटाव रखने वाले'],
  },
  Sagittarius: {
    personality: 'बृहस्पति द्वारा आशावादी और दार्शनिक, आपका स्वभाव विस्तार, सत्य और साहसिकता की तलाश करता है। स्वतंत्रता-प्रेमी और उत्साही, आप अपनी दृष्टि से दूसरों को प्रेरित करते हैं।',
    career: 'उच्च शिक्षा, दर्शन, धर्म, यात्रा उद्योग, कानून, प्रकाशन और अंतर्राष्ट्रीय व्यापार। क्षितिज विस्तार करने वाले क्षेत्र उपयुक्त हैं।',
    health: 'कूल्हे, जांघ और यकृत की समस्याओं की संभावना। शारीरिक गतिविधि बनाए रखें और अति-भोग से बचें।',
    finance: 'आशावादी वित्तीय दृष्टिकोण, कभी-कभी अत्यधिक जोखिम लेना। अंतर्राष्ट्रीय या शिक्षा-संबंधी उद्यम लाभदायक साबित होते हैं।',
    marriage: 'स्वतंत्रता-प्रेमी साथी जिसे बौद्धिक और आध्यात्मिक अनुकूलता की आवश्यकता है। संबंधों में उत्साही और प्रेरक।',
    strengths: ['आशावादी', 'दार्शनिक', 'उदार', 'ईमानदार', 'साहसी'],
    challenges: ['बेधड़क बोलने वाले', 'अति-आत्मविश्वासी', 'बेचैन', 'अत्यधिक जोखिम लेने वाले'],
  },
  Capricorn: {
    personality: 'शनि द्वारा अनुशासित और महत्वाकांक्षी, आपकी भावनात्मक अभिव्यक्ति संयमित और व्यावहारिक है। आप जिम्मेदारियों को गंभीरता से लेते हैं और दीर्घकालिक दृष्टिकोण रखते हैं।',
    career: 'व्यापार, सरकार, कानून, वित्त, इंजीनियरिंग और प्रबंधन। स्थापित संस्थाओं का नेतृत्व और दीर्घकालिक करियर निर्माण।',
    health: 'जोड़ों, घुटने, हड्डी और त्वचा की समस्याओं की संभावना। अत्यधिक काम से अवसाद की प्रवृत्ति। कार्य-जीवन संतुलन आवश्यक है।',
    finance: 'उत्कृष्ट दीर्घकालिक धन निर्माता। अनुशासित बचत और रियल एस्टेट जैसी मूर्त संपत्तियों में निवेश।',
    marriage: 'प्रतिबद्ध और जिम्मेदार साथी। शुरू में भावनात्मक रूप से संयमित हो सकते हैं। संबंधों को गंभीरता से लेते हैं।',
    strengths: ['अनुशासित', 'महत्वाकांक्षी', 'धैर्यवान', 'जिम्मेदार', 'व्यावहारिक'],
    challenges: ['ठंडे', 'काम में डूबे रहने वाले', 'निराशावादी', 'कठोर'],
  },
  Aquarius: {
    personality: 'शनि और राहु द्वारा मानवतावादी और मौलिक, आपकी भावनाओं में अलगाव है फिर भी आप मानवता की गहरी परवाह करते हैं। मित्र और समुदाय आपकी पहचान के केंद्र में हैं।',
    career: 'प्रौद्योगिकी, सामाजिक कार्य, अनुसंधान, ज्योतिष, विमानन और मानवीय क्षेत्र। अत्याधुनिक या समूह-उन्मुख कार्य उपयुक्त है।',
    health: 'संचार, टखने और तंत्रिका संबंधी समस्याओं की संभावना। समुदायिक गतिविधियां और नियमित दिनचर्या स्वास्थ्य के लिए अच्छी है।',
    finance: 'अपरंपरागत वित्तीय दृष्टिकोण। प्रौद्योगिकी या समूह उद्यमों से लाभ। कारणों के साथ उदार।',
    marriage: 'एक बौद्धिक समकक्ष की जरूरत जो स्वतंत्रता और मित्रता को महत्व दे। प्रतिबद्ध लेकिन व्यक्तिगत स्वतंत्रता बनाए रखते हैं।',
    strengths: ['मौलिक', 'मानवतावादी', 'बुद्धिमान', 'स्वतंत्र', 'दूरदर्शी'],
    challenges: ['अलग', 'अप्रत्याशित', 'विद्रोही', 'व्यक्तिहीन'],
  },
  Pisces: {
    personality: 'बृहस्पति और केतु द्वारा गहरे दयालु और आध्यात्मिक, आप दूसरों की भावनाओं को अपनी तरह महसूस करते हैं। स्वप्निल, रचनात्मक और कल्पनाशील।',
    career: 'कलाएं, उपचार, आध्यात्मिकता, फोटोग्राफी, फिल्म, परामर्श और सेवा व्यवसाय। रचनात्मक और सहानुभूतिपूर्ण क्षेत्र गहरी संतुष्टि देते हैं।',
    health: 'लसीका, पैर और प्रतिरक्षा तंत्र की समस्याओं की संभावना। शारीरिक स्वास्थ्य के लिए भावनात्मक सीमाएं आवश्यक हैं।',
    finance: 'आदर्शवाद के कारण असंगत वित्तीय प्रबंधन। रचनात्मक कलाओं या आध्यात्मिक कार्य से धन। व्यावहारिक धन प्रबंधन सीखना आवश्यक है।',
    marriage: 'गहरे रोमांटिक, निःस्वार्थ साथी जो पूरी तरह घुल-मिल जाते हैं। एक स्थिर साथी की जरूरत। सीमाएं महत्वपूर्ण हैं।',
    strengths: ['दयालु', 'आध्यात्मिक', 'रचनात्मक', 'अंतर्ज्ञानी', 'निःस्वार्थ'],
    challenges: ['पलायनवादी', 'अत्यधिक भरोसेमंद', 'सीमा की समस्याएं', 'अव्यावहारिक'],
  },
};

const NAKSHATRA_TRAITS_HI: Record<string, string> = {
  Ashwini: 'अश्विनी कुमारों द्वारा संचालित — त्वरित और उपचारक; साहसी अग्रणी जो तेज गति से कार्य करते हैं',
  Bharani: 'यम देव द्वारा संचालित — संयम और परिवर्तन; महान सहनशक्ति वाले दृढ़-इच्छाशक्ति के धनी',
  Krittika: 'अग्नि देव द्वारा संचालित — तीक्ष्ण और पवित्र; दृढ़ और महत्वाकांक्षी नेता',
  Rohini: 'ब्रह्मा द्वारा संचालित — रचनात्मक और उपजाऊ; सुंदरता के प्रति गहरी सराहना वाले',
  Mrigashira: 'सोम द्वारा संचालित — कोमल और खोजी; जिज्ञासु और पर्यावरण के प्रति संवेदनशील',
  Ardra: 'रुद्र द्वारा संचालित — तीव्र और परिवर्तनकारी; भ्रम को काटने वाली बौद्धिक शक्ति',
  Punarvasu: 'अदिति द्वारा संचालित — नवीकरण और आशावाद; असफलताओं के बाद नई ऊर्जा से लौटते हैं',
  Pushya: 'बृहस्पति द्वारा संचालित — पोषण और समर्थन; मजबूत नैतिक मूल्यों वाले प्राकृतिक देखभालकर्ता',
  Ashlesha: 'नाग देव द्वारा संचालित — सूक्ष्मदर्शी और मनोदर्शी; शक्तिशाली अंतर्ज्ञान वाली गहरी प्रज्ञा',
  Magha: 'पितरों द्वारा संचालित — शाही और पैतृक; अधिकारपूर्ण और विरासत से जुड़े',
  'Purva Phalguni': 'भग देव द्वारा संचालित — रचनात्मक और आनंदमय; कलात्मक उत्कर्ष के साथ जीवन का आनंद लेने वाले',
  'Uttara Phalguni': 'अर्यमन द्वारा संचालित — स्थिर और सेवाभावी; स्थायी संबंध और संस्थाएं बनाने वाले',
  Hasta: 'सविता द्वारा संचालित — कुशल और चतुर; हाथों से कुशल और व्यावहारिक मामलों में साधन-संपन्न',
  Chitra: 'त्वष्टा द्वारा संचालित — प्रतिभाशाली और कलात्मक; प्राकृतिक डिजाइनर और दूरदर्शी',
  Swati: 'वायु देव द्वारा संचालित — स्वतंत्र और गतिशील; बिना टूटे लहराने की क्षमता',
  Vishakha: 'इंद्र-अग्नि द्वारा संचालित — लक्ष्य-उन्मुख और दृढ़; एकाग्र प्रयास से सफलता',
  Anuradha: 'मित्र देव द्वारा संचालित — समर्पित और सहयोगी; गहरी मित्रता और आध्यात्मिक मार्ग अपनाने वाले',
  Jyeshtha: 'इंद्र देव द्वारा संचालित — वरिष्ठ और सुरक्षात्मक; कर्तव्य की मजबूत भावना वाले प्राकृतिक रक्षक',
  Mula: 'निरृति द्वारा संचालित — अन्वेषण और परिवर्तन; जीवन के रहस्यों का दार्शनिक अन्वेषक',
  'Purva Ashadha': 'जल देवी द्वारा संचालित — अजेय और शुद्धिकरण; लक्ष्यों में दृढ़, प्रारंभिक सफलता',
  'Uttara Ashadha': 'विश्वेदेवाओं द्वारा संचालित — अंतिम विजय; धर्मनिष्ठ आचरण के साथ स्थायी सफलता',
  Shravana: 'विष्णु द्वारा संचालित — श्रवण और अध्ययन; व्यापक संपर्कों वाले ज्ञान साधक',
  Dhanishta: 'आठ वसुओं द्वारा संचालित — धनी और संगीतमय; प्रतिभाशाली और सामुदायिक अभिविन्यास',
  Dhanishtha: 'आठ वसुओं द्वारा संचालित — धनी और संगीतमय; प्रतिभाशाली और सामुदायिक अभिविन्यास',
  Shatabhisha: 'वरुण द्वारा संचालित — उपचारक और रहस्यमय; छिपे ज्ञान तक पहुंच वाले शोधकर्ता',
  'Purva Bhadrapada': 'अज एकपाद द्वारा संचालित — तीव्र और अलौकिक; परिवर्तन के जुनून वाले आदर्शवादी',
  'Uttara Bhadrapada': 'अहिर बुध्न्य द्वारा संचालित — गहरे और स्थिरीकरण करने वाले; शांत ज्ञान से स्थिरता लाने वाले धैर्यशील',
  Revati: 'पूषन द्वारा संचालित — पोषण करने वाले और पूर्ण; आध्यात्मिक गहराई वाले दयालु',
};

const DASHA_INFLUENCES_HI: Record<string, { theme: string; guidance: string }> = {
  Sun: { theme: 'अधिकार, सरकार, पिता, आत्मा, नेतृत्व', guidance: 'यह आत्मविश्वास, अधिकार बनाने और करियर उन्नति के लिए कार्य करने का समय है। बड़ों और अधिकारियों का सम्मान आशीर्वाद दिलाता है।' },
  Moon: { theme: 'भावनाएं, माता, मन, घर, अंतर्ज्ञान', guidance: 'भावनात्मक उपचार, गृह मामलों और अंतर्ज्ञान गहराने पर ध्यान दें। यह अवधि सार्वजनिक संपर्क और भावनात्मक विकास के लिए अनुकूल है।' },
  Mars: { theme: 'ऊर्जा, साहस, संपत्ति, भाई-बहन, प्रतिस्पर्धा', guidance: 'अपनी ऊर्जा को संपत्ति मामलों, शारीरिक प्रयासों और साहसी कार्य में लगाएं। आवेगशील विवादों और कानूनी मामलों से बचें।' },
  Rahu: { theme: 'विदेश, प्रौद्योगिकी, भौतिकवाद, महत्वाकांक्षा, नवाचार', guidance: 'अपरंपरागत माध्यमों से अभूतपूर्व विकास संभव है। विदेशी संपर्क, प्रौद्योगिकी और नवीन सोच नए द्वार खोलती है। आध्यात्मिक रूप से स्थिर रहें।' },
  Jupiter: { theme: 'ज्ञान, विस्तार, संतान, गुरु, आध्यात्मिकता', guidance: 'उच्च शिक्षा, आध्यात्मिक विकास, विवाह और विस्तार के लिए अत्यंत शुभ अवधि। गुरुजनों से मार्गदर्शन लें। उदारता से प्रचुरता आती है।' },
  Saturn: { theme: 'अनुशासन, कर्म, विलंब, कठिन परिश्रम, दीर्घायु', guidance: 'धैर्य और दृढ़ता की परीक्षा होती है। कठिन परिश्रम कर्मफल देता है। जरूरतमंदों की सेवा करें। शॉर्टकट से बचें। नींव बनाना स्थायी सफलता दिलाता है।' },
  Mercury: { theme: 'बुद्धि, व्यापार, संचार, भाई-बहन, कौशल', guidance: 'व्यापारिक उद्यम, शिक्षा और संचार-आधारित कार्य में सफलता। लेखन, नए कौशल सीखने और वाणिज्यिक सफलता के लिए उत्कृष्ट अवधि।' },
  Ketu: { theme: 'आध्यात्मिकता, मोक्ष, पूर्व कर्म, एकांत, मुक्ति', guidance: 'गहरा आध्यात्मिक परिवर्तन चल रहा है। भौतिक आसक्तियों को छोड़ें। आंतरिक विकास, ध्यान और पूर्व कर्म के समाधान पर ध्यान दें।' },
  Venus: { theme: 'प्रेम, विलासिता, कलाएं, विवाह, आनंद, रचनात्मकता', guidance: 'रोमांस, रचनात्मक प्रयासों, वित्तीय लाभ और सौंदर्य के आनंद के लिए उत्कृष्ट अवधि। विवाह प्रस्ताव या कलात्मक सफलता उजागर होती है।' },
};

const PLANET_GEMSTONES_HI: Record<string, string> = {
  Sun: 'माणिक्य (Ruby)', Moon: 'मोती (Pearl)', Mars: 'मूंगा (Red Coral)',
  Mercury: 'पन्ना (Emerald)', Jupiter: 'पुखराज (Yellow Sapphire)',
  Venus: 'हीरा (Diamond) या सफेद पुखराज', Saturn: 'नीलम (Blue Sapphire)',
  Rahu: 'गोमेद (Hessonite Garnet)', Ketu: 'लहसुनिया (Cat\'s Eye)',
};

// Devanagari beeja mantras per planet (so the Hindi report shows the mantra in script)
const PLANET_MANTRA_HI: Record<string, string> = {
  Sun: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
  Moon: 'ॐ श्रां श्रीं श्रौं सः चंद्राय नमः',
  Mars: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
  Mercury: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
  Jupiter: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
  Venus: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
  Saturn: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
  Rahu: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
  Ketu: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
};

const CHARITY_BY_PLANET_HI: Record<string, string> = {
  Sun: 'रविवार को गेहूं, गुड़ या तांबा दान करें',
  Moon: 'सोमवार को दूध, चावल या सफेद कपड़ा दान करें',
  Mars: 'मंगलवार को लाल दाल, तांबा या भूमि दान करें',
  Mercury: 'बुधवार को हरी सब्जियां, किताबें या छात्रों को धन दान करें',
  Jupiter: 'गुरुवार को पीले पदार्थ, हल्दी या शिक्षकों को किताबें दान करें',
  Venus: 'शुक्रवार को सफेद पदार्थ, चीनी या इत्र दान करें',
  Saturn: 'शनिवार को काले तिल, लोहा या तेल दान करें',
  Rahu: 'शनिवार को नीले या काले पदार्थ, कोयला या तिल दान करें',
  Ketu: 'शनिवार को रंगीन पदार्थ या कंबल गरीबों को दान करें',
};

// ─── Hindi Interpretation Generator ──────────────────────────────────────────

export function generateInterpretationsHi(
  name: string,
  lagnaSign: string,
  moonSign: string,
  moonNakshatra: string,
  _sunSign: string,
  planets: Record<string, { rashi: string; houseNumber: number }>,
  currentMahadasha: string,
  currentAntardasha: string,
  yogas: IYoga[],
  doshas: IDosha[]
): IInterpretations {
  const moonData = MOON_SIGN_TRAITS_HI[moonSign] || MOON_SIGN_TRAITS_HI['Aries'];
  const nakNature = NAKSHATRA_TRAITS_HI[moonNakshatra] || 'संतुलित और अनुकूलनशील स्वभाव';
  const dashaData = DASHA_INFLUENCES_HI[currentMahadasha] || DASHA_INFLUENCES_HI['Sun'];
  const _antarData = DASHA_INFLUENCES_HI[currentAntardasha] || DASHA_INFLUENCES_HI['Moon'];
  const lagnaRuler = LAGNA_RULER[lagnaSign] || 'Sun';
  const lagnaHi = RASHI_HI[lagnaSign] || lagnaSign;
  const moonHi = RASHI_HI[moonSign] || moonSign;
  const mdHi = PLANET_HI[currentMahadasha] || currentMahadasha;
  const adHi = PLANET_HI[currentAntardasha] || currentAntardasha;
  const lagnaRulerHi = PLANET_HI[lagnaRuler] || lagnaRuler;
  const mantraHi = PLANET_MANTRA_HI[currentMahadasha] || 'ॐ नमः शिवाय';
  const presentYogas = yogas.filter(y => y.isPresent).map(y => y.name).join(', ') || 'कोई प्रमुख योग नहीं';
  const _presentDoshas = doshas.filter(d => d.isPresent).map(d => d.name).join(', ') || 'कोई नहीं';

  const personality = [
    `${name} का व्यक्तित्व ${lagnaHi} लग्न (उदय राशि) और ${moonHi} चंद्र राशि द्वारा निर्मित है।`,
    moonData.personality,
    `${moonNakshatra} नक्षत्र में चंद्रमा — ${nakNature}.`,
    `${lagnaHi} लग्न के साथ, आप दुनिया को ${lagnaHi.toLowerCase()} गुण प्रदर्शित करते हैं।`,
    presentYogas !== 'कोई प्रमुख योग नहीं' ? `आपकी कुंडली में विशेष योग (${presentYogas}) आपके स्वाभाविक गुणों को और ऊंचा उठाते हैं।` : '',
  ].filter(Boolean).join(' ');

  const career = [
    moonData.career,
    `${mdHi} महादशा वर्तमान में करियर को प्रभावित कर रही है: ${dashaData.theme}.`,
    dashaData.guidance,
    yogas.find(y => y.name === 'Budhaditya Yoga' && y.isPresent) ? 'बुधादित्य योग आपको प्रशासनिक या बौद्धिक भूमिकाओं के लिए तीव्र बुद्धि प्रदान करता है।' : '',
    yogas.find(y => y.name === 'Saraswati Yoga' && y.isPresent) ? 'सरस्वती योग विद्वत्, कलात्मक और शिक्षण करियर के लिए असाधारण योग्यता देता है।' : '',
  ].filter(Boolean).join(' ');

  const finance = [
    moonData.finance,
    `आपकी ${lagnaHi} लग्न और ${lagnaRulerHi} लग्नेश वित्तीय पैटर्न निर्धारित करते हैं।`,
    yogas.find(y => y.name === 'Lakshmi Yoga' && y.isPresent) ? 'आपकी कुंडली में लक्ष्मी योग असाधारण धन और वित्तीय समृद्धि का वादा करता है।' : 'अपनी चंद्र राशि की प्रवृत्तियों के अनुरूप अनुशासित बचत और निवेश से धन बनाएं।',
    `${mdHi} महादशा के दौरान ${dashaData.theme.toLowerCase()} से संबंधित वित्तीय अवसर उजागर होंगे।`,
  ].filter(Boolean).join(' ');

  const marriage = [
    moonData.marriage,
    `सप्तम भाव और शुक्र की स्थिति आपके विवाह पैटर्न को प्रभावित करती है।`,
    doshas.find(d => d.name === 'Mangal Dosha' && d.isPresent) ? 'मांगलिक दोष एक अनुकूल साथी के सावधानीपूर्वक चयन की सलाह देता है; दूसरे मांगलिक से मिलान अनुशंसित है।' : 'आपकी कुंडली सामंजस्यपूर्ण विवाह के लिए अनुकूल परिस्थितियां दिखाती है।',
    yogas.find(y => y.name === 'Gajakesari Yoga' && y.isPresent) ? 'गजकेसरी योग आपके संबंधों को ज्ञान और स्थिरता से आशीर्वाद देता है।' : '',
  ].filter(Boolean).join(' ');

  const health = [
    moonData.health,
    `${lagnaHi} लग्न के शरीर क्षेत्र से संबंधित समस्याओं पर ध्यान दें।`,
    doshas.find(d => d.name === 'Shani Dosha' && d.isPresent) ? 'शनि की स्थिति जोड़ों, हड्डियों और पुरानी बीमारियों पर ध्यान देने की सलाह देती है।' : '',
    `"${mantraHi}" मंत्र वर्तमान ${mdHi} दशा के दौरान समग्र स्वास्थ्य को सहारा देता है।`,
  ].filter(Boolean).join(' ');

  const education = [
    `बुध बुद्धि और शिक्षा पर शासन करता है। ${RASHI_HI[planets['Mercury']?.rashi] || planets['Mercury']?.rashi || 'इसकी स्थिति'} में बुध के साथ,`,
    `आपकी सीखने की शैली ${moonSign === 'Gemini' || moonSign === 'Virgo' ? 'विश्लेषणात्मक और तकनीकी विषयों' : moonSign === 'Sagittarius' || moonSign === 'Pisces' ? 'दर्शन और व्यापक विषयों' : 'व्यावहारिक और संरचित शिक्षा'} के पक्ष में है।`,
    yogas.find(y => y.name === 'Saraswati Yoga' && y.isPresent) ? 'सरस्वती योग आपको शैक्षणिक गतिविधियों में स्वाभाविक रूप से प्रतिभाशाली बनाता है।' : '',
    `${RASHI_HI[planets['Jupiter']?.rashi] || planets['Jupiter']?.rashi || 'अपनी स्थिति'} में बृहस्पति आपकी उच्च शिक्षा और ज्ञान अर्जन को प्रभावित करता है।`,
  ].filter(Boolean).join(' ');

  const children = [
    `पंचम भाव संतान और रचनात्मक अभिव्यक्ति पर शासन करता है।`,
    `${RASHI_HI[planets['Jupiter']?.rashi] || 'आपकी कुंडली'} में बृहस्पति की स्थिति संतान के मामलों को आशीर्वाद देती है।`,
    yogas.find(y => y.name === 'Gajakesari Yoga' && y.isPresent) ? 'गजकेसरी योग संतान के लिए शुभ है और उनकी समृद्धि सुनिश्चित करता है।' : '',
    `${mdHi} महादशा के दौरान संतान से संबंधित मामले ${dashaData.theme.toLowerCase()} से प्रभावित होंगे।`,
  ].filter(Boolean).join(' ');

  const spirituality = [
    `आपकी ${moonHi} चंद्र राशि और ${moonNakshatra} नक्षत्र एक आध्यात्मिक नींव बनाते हैं।`,
    `${mdHi} महादशा का विषय "${dashaData.theme}" आपकी वर्तमान आध्यात्मिक यात्रा को गहराई से प्रभावित करता है।`,
    doshas.find(d => d.name === 'Kaal Sarp Dosha' && d.isPresent) ? 'काल सर्प दोष, हालांकि चुनौतीपूर्ण, अक्सर असाधारण आध्यात्मिक गहराई और मनोदर्शी क्षमता पैदा करता है।' : '',
    yogas.find(y => y.name === 'Hamsa Yoga' && y.isPresent) ? 'हंस योग (केंद्र में बृहस्पति का उच्च) आपको आध्यात्मिक ज्ञान और धर्मनिष्ठता से आशीर्वाद देता है।' : '',
    `"${mantraHi}" का ${mdHi} दशा में मंत्र ध्यान आध्यात्मिक प्रगति लाता है।`,
  ].filter(Boolean).join(' ');

  return {
    personality,
    career,
    finance,
    marriage,
    health,
    education,
    spirituality,
    children,
    strengths: moonData.strengths,
    challenges: moonData.challenges,
    mantras: [
      mantraHi,
      'ॐ नमो नारायणाय (सम्पूर्ण सुरक्षा के लिए)',
      'गायत्री मंत्र (ज्ञान और स्पष्टता के लिए)',
    ],
    gemstones: [
      `प्राथमिक: ${PLANET_GEMSTONES_HI[lagnaRuler] || 'पुखराज'} (लग्नेश ${lagnaRulerHi} के लिए)`,
      `द्वितीयक: ${PLANET_GEMSTONES_HI['Moon']} (चंद्रमा के लिए)`,
      `दशा रत्न: ${PLANET_GEMSTONES_HI[currentMahadasha] || 'पुखराज'} (${mdHi} महादशा के लिए)`,
    ],
    fastingDays: [
      `${DASHA_INFLUENCES[currentMahadasha]?.fasting === 'Sunday' ? 'रविवार' : DASHA_INFLUENCES[currentMahadasha]?.fasting === 'Monday' ? 'सोमवार' : DASHA_INFLUENCES[currentMahadasha]?.fasting === 'Tuesday' ? 'मंगलवार' : DASHA_INFLUENCES[currentMahadasha]?.fasting === 'Wednesday' ? 'बुधवार' : DASHA_INFLUENCES[currentMahadasha]?.fasting === 'Thursday' ? 'गुरुवार' : DASHA_INFLUENCES[currentMahadasha]?.fasting === 'Friday' ? 'शुक्रवार' : 'शनिवार'} — ${mdHi} महादशा के लाभ के लिए`,
      'सोमवार — चंद्रमा के लिए (मन और भावनात्मक संतुलन)',
    ],
    charities: [
      CHARITY_BY_PLANET_HI[currentMahadasha] || 'अपने दशा ग्रह के दिन दान करें',
      CHARITY_BY_PLANET_HI['Moon'] || 'सोमवार को दूध या चावल दान करें',
      'गो-सेवा (गायों को चारा देना) — समग्र ग्रहीय सामंजस्य के लिए',
    ],
  };
}

// ─── Main Interpretation Generator ────────────────────────────────────────────

export function generateInterpretations(
  name: string,
  lagnaSign: string,
  moonSign: string,
  moonNakshatra: string,
  sunSign: string,
  planets: Record<string, { rashi: string; houseNumber: number }>,
  currentMahadasha: string,
  currentAntardasha: string,
  yogas: IYoga[],
  doshas: IDosha[]
): IInterpretations {
  const moonData = MOON_SIGN_TRAITS[moonSign] || MOON_SIGN_TRAITS['Aries'];
  const nakData = NAKSHATRA_TRAITS[moonNakshatra] || { quality: 'Balanced', deity: 'Universal', nature: 'Balanced and adaptable nature' };
  const dashaData = DASHA_INFLUENCES[currentMahadasha] || DASHA_INFLUENCES['Sun'];
  const _antar = DASHA_INFLUENCES[currentAntardasha] || DASHA_INFLUENCES['Moon'];
  const lagnaRuler = LAGNA_RULER[lagnaSign] || 'Sun';
  const presentYogas = yogas.filter(y => y.isPresent).map(y => y.name).join(', ') || 'None major';
  const _presentDoshas = doshas.filter(d => d.isPresent).map(d => d.name).join(', ') || 'None';

  const personality = [
    `${name}'s personality is shaped by a ${lagnaSign} Lagna (Ascendant) and ${moonSign} Moon Sign.`,
    moonData.personality,
    `The Moon in ${moonNakshatra} Nakshatra (ruled by ${nakData.deity}) adds: ${nakData.nature}.`,
    `With ${lagnaSign} rising, you project ${lagnaSign.toLowerCase()} qualities to the world.`,
    presentYogas !== 'None major' ? `Special yogas in your chart (${presentYogas}) further elevate your natural gifts.` : '',
  ].filter(Boolean).join(' ');

  const positionCareer = buildCareerInsights(planets, lagnaSign, yogas);
  const career = [
    positionCareer || moonData.career,
    positionCareer ? `Moon in ${moonSign} also contributes ${moonData.career.split('.')[0].toLowerCase()}.` : '',
    `The ${currentMahadasha} Mahadasha currently influences career through: ${dashaData.theme}. ${dashaData.guidance}`,
    yogas.find(y => y.name === 'Budhaditya Yoga' && y.isPresent) ? 'Budhaditya Yoga blesses you with sharp intellect for administrative or intellectual roles.' : '',
    yogas.find(y => y.name === 'Saraswati Yoga' && y.isPresent) ? 'Saraswati Yoga grants exceptional aptitude for scholarly, artistic, and teaching careers.' : '',
  ].filter(Boolean).join(' ');

  const finance = [
    moonData.finance,
    `Your ${lagnaSign} Ascendant and ${lagnaRuler} as Lagna lord determine financial patterns.`,
    yogas.find(y => y.name === 'Lakshmi Yoga' && y.isPresent) ? 'Lakshmi Yoga in your chart promises extraordinary wealth and financial prosperity.' : 'Build wealth through disciplined saving and investment aligned with your Moon sign tendencies.',
    `During ${currentMahadasha} Mahadasha, financial opportunities related to ${dashaData.theme.toLowerCase()} will be prominent.`,
  ].filter(Boolean).join(' ');

  const positionMarriage = buildMarriageInsights(planets, lagnaSign);
  const marriage = [
    positionMarriage || moonData.marriage,
    positionMarriage ? moonData.marriage : '',
    doshas.find(d => d.name === 'Mangal Dosha' && d.isPresent) ? 'Mangal Dosha advises careful selection of a compatible partner; matching with another Mangalik is recommended.' : '',
    yogas.find(y => y.name === 'Gajakesari Yoga' && y.isPresent) ? 'Gajakesari Yoga blesses your relationships with wisdom and stability.' : '',
  ].filter(Boolean).join(' ');

  const health = [
    moonData.health,
    `Watch for issues related to the ${lagnaSign} Ascendant's body zone.`,
    doshas.find(d => d.name === 'Shani Dosha' && d.isPresent) ? 'Saturn\'s position warrants attention to joints, bones, and chronic conditions.' : '',
    `Mantra: "${dashaData.mantra}" supports overall well-being during your current ${currentMahadasha} period.`,
  ].filter(Boolean).join(' ');

  const education = [
    `Mercury governs intellect and education. With ${planets['Mercury']?.rashi || 'its position'} placement,`,
    `your learning style favors ${moonSign === 'Gemini' || moonSign === 'Virgo' ? 'analytical and technical subjects' : moonSign === 'Sagittarius' || moonSign === 'Pisces' ? 'philosophy and broad subjects' : 'practical and structured learning'}.`,
    yogas.find(y => y.name === 'Saraswati Yoga' && y.isPresent) ? 'Saraswati Yoga makes you naturally gifted in academic pursuits.' : '',
    `Jupiter in ${planets['Jupiter']?.rashi || 'its position'} influences your higher education and wisdom acquisition.`,
  ].filter(Boolean).join(' ');

  const children = [
    `The 5th house governs children and creative expression.`,
    `Jupiter's placement in ${planets['Jupiter']?.rashi || 'your chart'} blesses matters of children.`,
    yogas.find(y => y.name === 'Gajakesari Yoga' && y.isPresent) ? 'Gajakesari Yoga is auspicious for children and ensures their prosperity.' : '',
    `During ${currentMahadasha} Mahadasha, matters related to children will be influenced by ${dashaData.theme.toLowerCase()}.`,
  ].filter(Boolean).join(' ');

  const spirituality = [
    `Your ${moonSign} Moon and ${moonNakshatra} Nakshatra (${nakData.deity}) create a ${nakData.quality} spiritual foundation.`,
    `The ${currentMahadasha} Mahadasha's theme of "${dashaData.theme}" deeply influences your current spiritual journey.`,
    doshas.find(d => d.name === 'Kaal Sarp Dosha' && d.isPresent) ? 'Kaal Sarp Dosha, while challenging, often creates exceptional spiritual depth and psychic abilities.' : '',
    yogas.find(y => y.name === 'Hamsa Yoga' && y.isPresent) ? 'Hamsa Yoga (Jupiter exalted in Kendra) blesses you with spiritual wisdom and righteousness.' : '',
    `Mantra meditation on "${dashaData.mantra}" during ${currentMahadasha} Dasha brings spiritual progress.`,
  ].filter(Boolean).join(' ');

  return {
    personality,
    career,
    finance,
    marriage,
    health,
    education,
    spirituality,
    children,
    strengths: moonData.strengths,
    challenges: moonData.challenges,
    mantras: [
      dashaData.mantra,
      `Om Namo Narayanaya (for overall protection)`,
      `Gayatri Mantra (for wisdom and clarity)`,
    ],
    gemstones: (() => {
      const lagnaGems = LAGNA_GEMS[lagnaSign];
      if (lagnaGems) {
        const gems = [...lagnaGems.recommend.map(g => `Recommended: ${g}`)];
        if (lagnaGems.avoid.length > 0) gems.push(`Caution — ${lagnaGems.avoid[0]}`);
        return gems;
      }
      return [
        `Primary: ${PLANET_GEMSTONES[lagnaRuler]} (for Lagna lord ${lagnaRuler})`,
        `Secondary: ${PLANET_GEMSTONES['Moon']} (for Moon)`,
        `Dasha gem: ${PLANET_GEMSTONES[currentMahadasha] || 'Yellow Sapphire'} (for ${currentMahadasha} Mahadasha)`,
      ];
    })(),
    fastingDays: [
      `${dashaData.fasting} — for ${currentMahadasha} Mahadasha benefits`,
      `Monday — for Moon (mind and emotional balance)`,
    ],
    charities: [
      CHARITY_BY_PLANET[currentMahadasha] || 'Donate to charity on your dasha planet\'s day',
      CHARITY_BY_PLANET['Moon'] || 'Donate milk or rice on Mondays',
      `Feed cows (go-seva) for overall planetary harmony`,
    ],
  };
}
