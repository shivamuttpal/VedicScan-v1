// 12 Zodiac Signs Data — Navagraha Rashi System
// Copied from frontend VedicUI.jsx

export const SIGNS = [
  { rashi: 'Mesh', rashiDev: 'मेष', zodiac: 'Aries', sym: '♈', icon: '🔥', lord: 'Mars', el: 'Fire', date: 'Mar 21 – Apr 19' },
  { rashi: 'Vrishabh', rashiDev: 'वृषभ', zodiac: 'Taurus', sym: '♉', icon: '🌍', lord: 'Venus', el: 'Earth', date: 'Apr 20 – May 20' },
  { rashi: 'Mithun', rashiDev: 'मिथुन', zodiac: 'Gemini', sym: '♊', icon: '💨', lord: 'Mercury', el: 'Air', date: 'May 21 – Jun 20' },
  { rashi: 'Kark', rashiDev: 'कर्क', zodiac: 'Cancer', sym: '♋', icon: '🌊', lord: 'Moon', el: 'Water', date: 'Jun 21 – Jul 22' },
  { rashi: 'Simha', rashiDev: 'सिंह', zodiac: 'Leo', sym: '♌', icon: '🔥', lord: 'Sun', el: 'Fire', date: 'Jul 23 – Aug 22' },
  { rashi: 'Kanya', rashiDev: 'कन्या', zodiac: 'Virgo', sym: '♍', icon: '🌍', lord: 'Mercury', el: 'Earth', date: 'Aug 23 – Sep 22' },
  { rashi: 'Tula', rashiDev: 'तुला', zodiac: 'Libra', sym: '♎', icon: '💨', lord: 'Venus', el: 'Air', date: 'Sep 23 – Oct 22' },
  { rashi: 'Vrishchik', rashiDev: 'वृश्चिक', zodiac: 'Scorpio', sym: '♏', icon: '🌊', lord: 'Mars', el: 'Water', date: 'Oct 23 – Nov 21' },
  { rashi: 'Dhanu', rashiDev: 'धनु', zodiac: 'Sagittarius', sym: '♐', icon: '🔥', lord: 'Jupiter', el: 'Fire', date: 'Nov 22 – Dec 21' },
  { rashi: 'Makar', rashiDev: 'मकर', zodiac: 'Capricorn', sym: '♑', icon: '🌍', lord: 'Saturn', el: 'Earth', date: 'Dec 22 – Jan 19' },
  { rashi: 'Kumbh', rashiDev: 'कुंभ', zodiac: 'Aquarius', sym: '♒', icon: '💨', lord: 'Saturn', el: 'Air', date: 'Jan 20 – Feb 18' },
  { rashi: 'Meen', rashiDev: 'मीन', zodiac: 'Pisces', sym: '♓', icon: '🌊', lord: 'Jupiter', el: 'Water', date: 'Feb 19 – Mar 20' },
];

// Hindi translations for planetary lords and elements
export const LORD_HI = {
  Mars: 'मंगल',
  Venus: 'शुक्र',
  Mercury: 'बुध',
  Moon: 'चंद्र',
  Sun: 'सूर्य',
  Jupiter: 'बृहस्पति',
  Saturn: 'शनि',
};

export const EL_HI = {
  Fire: 'अग्नि',
  Earth: 'पृथ्वी',
  Air: 'वायु',
  Water: 'जल',
};

export const sampleQuestions = [
  'When will I get married?',
  'Will I study abroad?',
  'Should I start my own business?',
  'What career is best for me according to my kundli?',
  'When is the auspicious time for buying property?',
  'Can you analyze my relationship compatibility?',
];

export const sampleQuestionsHi = [
  'मेरा विवाह कब होगा?',
  'क्या मैं विदेश में पढ़ूँगा/पढ़ूँगी?',
  'क्या मुझे अपना व्यवसाय शुरू करना चाहिए?',
  'मेरी कुंडली के अनुसार मेरे लिए सर्वश्रेष्ठ करियर कौन-सा है?',
  'संपत्ति खरीदने का शुभ समय कब है?',
  'क्या आप मेरी संबंध अनुकूलता का विश्लेषण कर सकते हैं?',
];

// Language-aware accessor
export const getSampleQuestions = (lang) => (lang === 'hi' ? sampleQuestionsHi : sampleQuestions);
