// Mock data for VedicScan app

export const mockKundliData = {
  personalInfo: {
    name: "Rahul Kumar",
    dateOfBirth: "1995-08-15",
    timeOfBirth: "14:30",
    placeOfBirth: "enter city, state, country"
  },
  basicDetails: {
    rashi: "Simha (Leo)",
    nakshatra: "Purva Phalguni",
    lagna: "Tula (Libra)",
    chandra: "Simha (Leo)",
    yoni: "Mushak (Rat)",
    gan: "Manushya",
    nadi: "Madhya"
  },
  planetaryPositions: [
    { planet: "Sun (Surya)", sign: "Leo", house: "11th", degree: "22°45'", nakshatra: "Purva Phalguni" },
    { planet: "Moon (Chandra)", sign: "Leo", house: "11th", degree: "15°30'", nakshatra: "Purva Phalguni" },
    { planet: "Mars (Mangal)", sign: "Virgo", house: "12th", degree: "08°15'", nakshatra: "Uttara Phalguni" },
    { planet: "Mercury (Budh)", sign: "Leo", house: "11th", degree: "28°20'", nakshatra: "Uttara Phalguni" },
    { planet: "Jupiter (Guru)", sign: "Sagittarius", house: "3rd", degree: "12°45'", nakshatra: "Mula" },
    { planet: "Venus (Shukra)", sign: "Cancer", house: "10th", degree: "19°30'", nakshatra: "Ashlesha" },
    { planet: "Saturn (Shani)", sign: "Aquarius", house: "5th", degree: "25°10'", nakshatra: "Purva Bhadrapada" },
    { planet: "Rahu", sign: "Scorpio", house: "2nd", degree: "03°45'", nakshatra: "Anuradha" },
    { planet: "Ketu", sign: "Taurus", house: "8th", degree: "03°45'", nakshatra: "Krittika" }
  ],
  dashaSystem: {
    currentMahaDasha: "Venus (Shukra) - 2020 to 2040",
    currentAntarDasha: "Sun (Surya) - 2024 to 2025",
    upcomingDashas: [
      "Venus-Moon: 2025-2027",
      "Venus-Mars: 2027-2029",
      "Venus-Rahu: 2029-2032"
    ]
  },
  predictions: {
    career: "Strong planetary positions in 11th house indicate gains through business and networking. Jupiter in 3rd house favors communication and entrepreneurship.",
    love: "Venus in 10th house brings romantic opportunities through work. Moon in 11th house ensures emotional fulfillment in relationships.",
    health: "Mars in 12th house requires attention to hidden health issues. Regular meditation and yoga recommended.",
    wealth: "Multiple planets in 11th house promise financial gains. Period after 2027 will bring significant monetary growth."
  },
  remedies: [
    "Chant Surya Mantra 'Om Suryaya Namah' 108 times daily during sunrise",
    "Wear Ruby gemstone on right hand ring finger on Sunday",
    "Donate wheat and jaggery on Sundays",
    "Perform Surya Namaskar 12 times daily",
    "Visit Hanuman temple on Tuesdays and Saturdays"
  ]
};

export const mockCompatibilityData = {
  person1: {
    name: "Priya Sharma",
    dateOfBirth: "1996-03-20",
    timeOfBirth: "10:15",
    placeOfBirth: "Delhi, India",
    rashi: "Meena (Pisces)",
    nakshatra: "Revati"
  },
  person2: {
    name: "Arjun Patel",
    dateOfBirth: "1994-11-08",
    timeOfBirth: "16:45",
    placeOfBirth: "Ahmedabad, Gujarat",
    rashi: "Vrishchik (Scorpio)",
    nakshatra: "Anuradha"
  },
  gunaScore: 28,
  maxScore: 36,
  compatibility: "78%",
  verdict: "Excellent Match",
  detailedScores: [
    { guna: "Varna (Spiritual Compatibility)", score: 1, maxScore: 1, status: "Match" },
    { guna: "Vashya (Mutual Attraction)", score: 2, maxScore: 2, status: "Match" },
    { guna: "Tara (Birth Star Compatibility)", score: 3, maxScore: 3, status: "Match" },
    { guna: "Yoni (Sexual Compatibility)", score: 3, maxScore: 4, status: "Good" },
    { guna: "Graha Maitri (Mental Compatibility)", score: 4, maxScore: 5, status: "Good" },
    { guna: "Gana (Temperament)", score: 5, maxScore: 6, status: "Excellent" },
    { guna: "Bhakoot (Love & Affection)", score: 5, maxScore: 7, status: "Good" },
    { guna: "Nadi (Health & Genes)", score: 5, maxScore: 8, status: "Good" }
  ],
  strengths: [
    "Strong emotional understanding and mental compatibility",
    "Excellent temperament matching ensures harmonious relationship",
    "Good spiritual alignment for long-term partnership",
    "Birth stars indicate mutual support and growth",
    "Planetary positions favor prosperity after marriage"
  ],
  weaknesses: [
    "Minor differences in approach to intimacy - can be resolved with communication",
    "Some doshas detected but can be mitigated with remedies",
    "Different paces in life decisions - patience required"
  ],
  recommendations: [
    "Perform marriage on auspicious muhurat between March-May 2025",
    "Chant 'Om Namah Shivaya' together for relationship harmony",
    "Wear matching gemstones - Pearl for her, Red Coral for him",
    "Visit temple together every Tuesday",
    "Respect each other's moon signs for emotional balance"
  ],
  mangalDosha: {
    person1: "No Mangal Dosha",
    person2: "Mild Mangal Dosha (Cancels out after marriage)",
    impact: "Negligible"
  }
};

export const mockChatResponses = [
  {
    question: "When will I get married?",
    answer: "Based on your birth chart, Jupiter's transit through your 7th house from March 2025 to June 2026 is highly favorable for marriage. The period between April-May 2025 shows strong indications of meeting your life partner. Your Venus Mahadasha also supports romantic relationships. I recommend checking compatibility with potential partners during this period."
  },
  {
    question: "Will I study abroad?",
    answer: "Your 9th house (house of higher education and foreign travel) is well aspected by Jupiter and Rahu. The period from late 2025 to 2027 is excellent for foreign education. Countries in the West or North direction from your birthplace will be particularly favorable. Mercury's position suggests success in technical or business-related studies."
  },
  {
    question: "Should I start my own business?",
    answer: "Your chart shows strong entrepreneurial potential with Sun and Mercury in the 11th house. The current Venus Mahadasha (2020-2040) is favorable for business ventures. However, I recommend waiting until the Venus-Mars Antardasha (2027-2029) for optimal results. Technology, creative fields, or luxury goods businesses would be particularly suitable for you."
  },
  {
    question: "Can you analyze my relationship compatibility?",
    answer: "I'd be happy to analyze relationship compatibility! Please provide the birth details (date, time, and place) of both individuals. I'll examine the Kundli Milan, Guna matching score, and planetary positions to give you detailed insights about emotional compatibility, mutual understanding, and long-term harmony."
  }
];

export const mockUserProfiles = [
  {
    id: "profile-1",
    name: "Rahul Kumar",
    dateOfBirth: "1995-08-15",
    timeOfBirth: "14:30",
    placeOfBirth: "enter city, state, country",
    relationship: "Self"
  }
];

export const sampleQuestions = [
  "When will I get married?",
  "Will I study abroad?",
  "Should I start my own business?",
  "Can you analyze the relationship compatibility with my partner?",
  "What career is best for me according to my kundli?",
  "When is the auspicious time for buying property?"
];
