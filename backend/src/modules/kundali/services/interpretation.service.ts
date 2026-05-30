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
  const antar = DASHA_INFLUENCES[currentAntardasha] || DASHA_INFLUENCES['Moon'];
  const lagnaRuler = LAGNA_RULER[lagnaSign] || 'Sun';
  const presentYogas = yogas.filter(y => y.isPresent).map(y => y.name).join(', ') || 'None major';
  const presentDoshas = doshas.filter(d => d.isPresent).map(d => d.name).join(', ') || 'None';

  const personality = [
    `${name}'s personality is shaped by a ${lagnaSign} Lagna (Ascendant) and ${moonSign} Moon Sign.`,
    moonData.personality,
    `The Moon in ${moonNakshatra} Nakshatra (ruled by ${nakData.deity}) adds: ${nakData.nature}.`,
    `With ${lagnaSign} rising, you project ${lagnaSign.toLowerCase()} qualities to the world.`,
    presentYogas !== 'None major' ? `Special yogas in your chart (${presentYogas}) further elevate your natural gifts.` : '',
  ].filter(Boolean).join(' ');

  const career = [
    moonData.career,
    `The ${currentMahadasha} Mahadasha currently influences career through: ${dashaData.theme}.`,
    dashaData.guidance,
    yogas.find(y => y.name === 'Budhaditya Yoga' && y.isPresent) ? 'Budhaditya Yoga blesses you with sharp intellect for administrative or intellectual roles.' : '',
    yogas.find(y => y.name === 'Saraswati Yoga' && y.isPresent) ? 'Saraswati Yoga grants exceptional aptitude for scholarly, artistic, and teaching careers.' : '',
  ].filter(Boolean).join(' ');

  const finance = [
    moonData.finance,
    `Your ${lagnaSign} Ascendant and ${lagnaRuler} as Lagna lord determine financial patterns.`,
    yogas.find(y => y.name === 'Lakshmi Yoga' && y.isPresent) ? 'Lakshmi Yoga in your chart promises extraordinary wealth and financial prosperity.' : 'Build wealth through disciplined saving and investment aligned with your Moon sign tendencies.',
    `During ${currentMahadasha} Mahadasha, financial opportunities related to ${dashaData.theme.toLowerCase()} will be prominent.`,
  ].filter(Boolean).join(' ');

  const marriage = [
    moonData.marriage,
    `The 7th house and Venus position influence your marriage patterns.`,
    doshas.find(d => d.name === 'Mangal Dosha' && d.isPresent) ? 'Mangal Dosha advises careful selection of a compatible partner; matching with another Mangalik is recommended.' : 'Your chart shows favorable conditions for a harmonious marriage.',
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
    gemstones: [
      `Primary: ${PLANET_GEMSTONES[lagnaRuler]} (for Lagna lord ${lagnaRuler})`,
      `Secondary: ${PLANET_GEMSTONES['Moon']} (for Moon)`,
      `Dasha gem: ${PLANET_GEMSTONES[currentMahadasha] || 'Yellow Sapphire'} (for ${currentMahadasha} Mahadasha)`,
    ],
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
