import { IDosha } from '../model/kundali.model';

interface PlanetInfo {
  rashi: string;
  houseNumber: number;
}

type Lang = 'en' | 'hi';

const RASHI_HI: Record<string, string> = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या',
  Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};
const NODE_HI: Record<string, string> = { Rahu: 'राहु', Ketu: 'केतु' };
const SEV_HI: Record<string, string> = { High: 'उच्च', Medium: 'मध्यम', Low: 'निम्न', None: 'शून्य' };

/**
 * Detect doshas. Pass lang='hi' to receive Devanagari name/description/remedy so the
 * Hindi PDF can render them directly (mirrors the interpretations/interpretationsHi pattern).
 */
export function detectDoshas(
  planets: Record<string, PlanetInfo>,
  lagnaSign: string,
  houses: Array<{ number: number; sign: string; planets: string[] }>,
  lang: Lang = 'en'
): IDosha[] {
  const results: IDosha[] = [];
  const hi = lang === 'hi';
  const pick = (en: string, hin: string) => (hi ? hin : en);
  const rr = (r: string) => (hi ? (RASHI_HI[r] || r) : r);

  const mars = planets['Mars'];
  const rahu = planets['Rahu'];
  const ketu = planets['Ketu'];
  const sun = planets['Sun'];
  const jupiter = planets['Jupiter'];
  const saturn = planets['Saturn'];

  // ── Mangal Dosha (Kuja Dosha) ──
  const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];
  if (mars) {
    const hasMangal = MANGAL_DOSHA_HOUSES.includes(mars.houseNumber);
    const marsInOwnExalt = ['Aries', 'Scorpio', 'Capricorn'].includes(mars.rashi);
    const severity = hasMangal ? (marsInOwnExalt ? 'Medium' : mars.houseNumber === 7 || mars.houseNumber === 8 ? 'High' : 'Medium') : 'None';
    const sevWord = hi ? SEV_HI[severity] : severity.toLowerCase();
    results.push({
      name: pick('Mangal Dosha', 'मंगल दोष'),
      severity,
      isPresent: hasMangal,
      description: hasMangal
        ? pick(
            `Mars is placed in the ${mars.houseNumber}th house, creating Mangal Dosha. This can cause delays in marriage, conflicts in relationships, and accidents if not addressed. Severity is ${severity.toLowerCase()}.${marsInOwnExalt ? ' Partial cancellation applies as Mars is in own/exalted sign.' : ''}`,
            `मंगल ${mars.houseNumber}वें भाव में स्थित है, जिससे मंगल दोष बनता है। यदि उपचार न किया जाए तो यह विवाह में विलंब, संबंधों में मतभेद एवं दुर्घटनाओं का कारण बन सकता है। तीव्रता ${sevWord} है।${marsInOwnExalt ? ' मंगल के स्वराशि/उच्च राशि में होने से आंशिक शमन लागू होता है।' : ''}`
          )
        : pick(
            'Mars is not in any of the houses (1,2,4,7,8,12) that create Mangal Dosha. Your chart is free from this dosha.',
            'मंगल उन भावों (1,2,4,7,8,12) में स्थित नहीं है जो मंगल दोष बनाते हैं। आपकी कुंडली इस दोष से मुक्त है।'
          ),
      remedy: hasMangal
        ? pick(
            'Recite Hanuman Chalisa daily. Observe Tuesday fast. Wear Red Coral (Moonga) after consulting an astrologer. Perform Kuja Dosha Shanti Puja.',
            'प्रतिदिन हनुमान चालीसा का पाठ करें। मंगलवार का व्रत रखें। ज्योतिषी से परामर्श के पश्चात मूंगा धारण करें। कुज दोष शांति पूजा कराएँ।'
          )
        : '',
    });
  }

  // ── Kaal Sarp Dosha ──
  if (rahu && ketu) {
    const rahuHouse = rahu.houseNumber;
    const ketuHouse = ketu.houseNumber;
    const mainPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    let allBetween = true;
    for (const pname of mainPlanets) {
      const p = planets[pname];
      if (!p) { allBetween = false; break; }
      const h = p.houseNumber;
      const arcRK: number[] = [];
      let cursor = rahuHouse;
      for (let i = 0; i < 6; i++) {
        cursor = (cursor % 12) + 1;
        arcRK.push(cursor);
      }
      if (!arcRK.includes(h) && h !== rahuHouse && h !== ketuHouse) {
        allBetween = false;
        break;
      }
    }
    results.push({
      name: pick('Kaal Sarp Dosha', 'काल सर्प दोष'),
      severity: allBetween ? 'High' : 'None',
      isPresent: allBetween,
      description: allBetween
        ? pick(
            'All planets are hemmed between Rahu and Ketu, forming Kaal Sarp Dosha. This can create obstacles, delays in life goals, karmic challenges, and unexpected setbacks. However, it also grants great focus and potential for spiritual elevation.',
            'सभी ग्रह राहु एवं केतु के बीच सीमित हैं, जिससे काल सर्प दोष बनता है। यह जीवन-लक्ष्यों में बाधाएँ, विलंब, कार्मिक चुनौतियाँ एवं अप्रत्याशित अवरोध उत्पन्न कर सकता है। तथापि यह महान एकाग्रता एवं आध्यात्मिक उत्थान की क्षमता भी प्रदान करता है।'
          )
        : pick(
            'All planets are not hemmed between Rahu-Ketu. Kaal Sarp Dosha is absent in your chart.',
            'सभी ग्रह राहु-केतु के बीच सीमित नहीं हैं। आपकी कुंडली में काल सर्प दोष अनुपस्थित है।'
          ),
      remedy: allBetween
        ? pick(
            'Perform Kaal Sarp Dosha Puja at Tryambakeshwar or Ujjain. Recite Maha Mrityunjaya Mantra 108 times daily. Offer milk to Shiva linga on Mondays.',
            'त्र्यंबकेश्वर या उज्जैन में काल सर्प दोष पूजा कराएँ। प्रतिदिन महामृत्युंजय मंत्र का 108 बार जप करें। सोमवार को शिवलिंग पर दूध अर्पित करें।'
          )
        : '',
    });
  }

  // ── Pitra Dosha ──
  if (sun && rahu) {
    const sunRahuConjunct = sun.houseNumber === rahu.houseNumber;
    const inNinthOrFirst = [1, 9].includes(sun.houseNumber);
    const saturnWithSun = saturn && sun.houseNumber === saturn.houseNumber && [1, 7, 10].includes(sun.houseNumber);
    const isDosha = sunRahuConjunct || !!saturnWithSun;
    results.push({
      name: pick('Pitra Dosha', 'पितृ दोष'),
      severity: isDosha ? (sunRahuConjunct && inNinthOrFirst ? 'High' : 'Medium') : 'None',
      isPresent: isDosha,
      description: isDosha
        ? pick(
            'Pitra Dosha is indicated by the Sun\'s affliction with Rahu or Saturn. This suggests unresolved karmic debts from ancestors, causing obstacles in professional life and paternal relations.',
            'सूर्य का राहु या शनि से पीड़ित होना पितृ दोष का संकेत देता है। यह पूर्वजों के अनसुलझे कार्मिक ऋण को दर्शाता है, जो व्यावसायिक जीवन एवं पैतृक संबंधों में बाधाएँ उत्पन्न करता है।'
          )
        : pick(
            'Sun is free from affliction by Rahu/Saturn in sensitive positions. Pitra Dosha is not indicated.',
            'सूर्य संवेदनशील स्थानों में राहु/शनि की पीड़ा से मुक्त है। पितृ दोष का संकेत नहीं है।'
          ),
      remedy: isDosha
        ? pick(
            'Perform Pitra Tarpan on Amavasya (new moon). Offer water to ancestors on Shraddha Paksha. Feed Brahmins on Saturdays. Donate yellow items on Sundays.',
            'अमावस्या को पितृ तर्पण करें। श्राद्ध पक्ष में पूर्वजों को जल अर्पित करें। शनिवार को ब्राह्मणों को भोजन कराएँ। रविवार को पीले पदार्थ दान करें।'
          )
        : '',
    });
  }

  // ── Guru Chandal Dosha ──
  if (jupiter && rahu) {
    const isGuruChandal = jupiter.houseNumber === rahu.houseNumber;
    results.push({
      name: pick('Guru Chandal Dosha', 'गुरु चांडाल दोष'),
      severity: isGuruChandal ? 'Medium' : 'None',
      isPresent: isGuruChandal,
      description: isGuruChandal
        ? pick(
            'Jupiter and Rahu are conjunct, causing Guru Chandal Dosha. This can create confusion in wisdom, association with wrong advisors, and challenges in education or spiritual growth. Native may be misguided at key decisions.',
            'बृहस्पति एवं राहु की युति गुरु चांडाल दोष उत्पन्न करती है। यह ज्ञान में भ्रम, ग़लत सलाहकारों का संग, एवं शिक्षा या आध्यात्मिक विकास में चुनौतियाँ उत्पन्न कर सकता है। जातक महत्वपूर्ण निर्णयों पर भ्रमित हो सकता है।'
          )
        : pick(
            'Jupiter and Rahu are not conjunct. Guru Chandal Dosha is absent.',
            'बृहस्पति एवं राहु की युति नहीं है। गुरु चांडाल दोष अनुपस्थित है।'
          ),
      remedy: isGuruChandal
        ? pick(
            'Recite Guru Beeja Mantra: "Om Graam Greem Graum Sah Gurave Namah" 108 times on Thursdays. Donate yellow items to teachers. Seek blessings of genuine spiritual guides.',
            'गुरुवार को गुरु बीज मंत्र "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः" का 108 बार जप करें। शिक्षकों को पीले पदार्थ दान करें। सच्चे आध्यात्मिक गुरुओं का आशीर्वाद लें।'
          )
        : '',
    });
  }

  // ── Shani Dosha ──
  if (saturn) {
    const saturnInKendra = [1, 4, 7, 10].includes(saturn.houseNumber);
    const saturnDebilitated = saturn.rashi === 'Aries';
    const isShani = saturnInKendra && saturnDebilitated;
    results.push({
      name: pick('Shani Dosha', 'शनि दोष'),
      severity: isShani ? 'Medium' : 'None',
      isPresent: isShani,
      description: isShani
        ? pick(
            `Saturn is debilitated in ${saturn.rashi} and placed in the ${saturn.houseNumber}th house (Kendra). This creates delays, obstacles, and karmic tests in the area governed by that house. However, it ultimately builds tremendous resilience.`,
            `शनि ${rr(saturn.rashi)} राशि में नीच का है एवं ${saturn.houseNumber}वें भाव (केंद्र) में स्थित है। यह उस भाव द्वारा शासित क्षेत्र में विलंब, बाधाएँ एवं कार्मिक परीक्षाएँ उत्पन्न करता है। तथापि यह अंततः अपार दृढ़ता का निर्माण करता है।`
          )
        : saturn.houseNumber === 1 || saturn.houseNumber === 7
          ? pick(
              `Saturn in the ${saturn.houseNumber}th house may create some challenges in personality or marriage respectively, but without debilitation the effects are manageable.`,
              `${saturn.houseNumber}वें भाव में शनि क्रमशः व्यक्तित्व या विवाह में कुछ चुनौतियाँ उत्पन्न कर सकता है, किंतु नीच न होने से प्रभाव सह्य रहते हैं।`
            )
          : pick(
              'Saturn is well-placed without serious debilitation in a Kendra. Shani Dosha is not severe.',
              'शनि केंद्र में गंभीर नीचता के बिना भली प्रकार स्थित है। शनि दोष गंभीर नहीं है।'
            ),
      remedy: isShani
        ? pick(
            'Recite Shani Mantra on Saturdays. Light sesame oil lamp under Peepal tree on Saturdays. Donate black items to underprivileged. Chant "Om Sham Shanicharaya Namah" 108 times.',
            'शनिवार को शनि मंत्र का जप करें। शनिवार को पीपल वृक्ष के नीचे तिल के तेल का दीपक जलाएँ। वंचितों को काले पदार्थ दान करें। "ॐ शं शनैश्चराय नमः" का 108 बार जप करें।'
          )
        : '',
    });
  }

  // ── Rahu-Ketu on 1/7 Axis (Relationship Karma) ──
  if (rahu && ketu) {
    const rahuIn7 = rahu.houseNumber === 7;
    const ketuIn7 = ketu.houseNumber === 7;
    const onMarriageAxis = rahuIn7 || ketuIn7;
    if (onMarriageAxis) {
      const nodule = rahuIn7 ? 'Rahu' : 'Ketu';
      results.push({
        name: pick(`${nodule} in 7th House (Relationship Axis)`, `${NODE_HI[nodule]} सप्तम भाव में (संबंध अक्ष)`),
        severity: 'Low',
        isPresent: true,
        description: rahuIn7
          ? pick(
              'Rahu in the 7th house (house of marriage and partnerships) brings attraction to unconventional, foreign, or culturally different partners. There may be confusion or delay in settling into committed relationships, unusual relationship experiences, or a love-cum-arranged marriage dynamic. This is not a classical dosha but warrants mindful partner selection. The 1/7 nodal axis (Rahu in 7th, Ketu in 1st) creates strong desire for partnership alongside a simultaneous pull toward self-reliance.',
              'सप्तम भाव (विवाह एवं साझेदारी का भाव) में राहु अपरंपरागत, विदेशी या भिन्न सांस्कृतिक साथियों के प्रति आकर्षण लाता है। प्रतिबद्ध संबंधों में स्थिर होने में भ्रम या विलंब, असामान्य संबंध-अनुभव, या प्रेम-सह-अरेंज विवाह की स्थिति हो सकती है। यह शास्त्रीय दोष नहीं है किंतु साथी के सोच-समझकर चयन की अपेक्षा रखता है। 1/7 नोडल अक्ष (सप्तम में राहु, लग्न में केतु) साझेदारी की प्रबल इच्छा के साथ-साथ आत्मनिर्भरता की ओर खिंचाव भी उत्पन्न करता है।'
            )
          : pick(
              'Ketu in the 7th house brings a detached, spiritually oriented perspective on relationships. Past-life connections with the spouse are possible. Native may feel a sense of incompleteness or dissatisfaction in partnerships until spiritual evolution occurs.',
              'सप्तम भाव में केतु संबंधों के प्रति विरक्त, आध्यात्मिक दृष्टिकोण लाता है। जीवनसाथी से पूर्व-जन्म के संबंध संभव हैं। आध्यात्मिक विकास होने तक जातक साझेदारी में अपूर्णता या असंतोष अनुभव कर सकता है।'
            ),
        remedy: rahuIn7
          ? pick(
              'Chant "Om Bhraam Bhreem Bhraum Sah Rahave Namah" 108 times on Saturdays. Choose partners based on long-term compatibility rather than intense initial attraction. Avoid hasty commitments before age 27.',
              'शनिवार को "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः" का 108 बार जप करें। तीव्र प्रारंभिक आकर्षण के बजाय दीर्घकालिक अनुकूलता के आधार पर साथी चुनें। 27 वर्ष की आयु से पूर्व जल्दबाज़ी में प्रतिबद्धता से बचें।'
            )
          : pick(
              'Recite "Om Sraam Sreem Sraum Sah Ketave Namah" 108 times on Saturdays. Seek a spiritually compatible partner. Practice detachment in relationships without abandoning commitment.',
              'शनिवार को "ॐ स्रां स्रीं स्रौं सः केतवे नमः" का 108 बार जप करें। आध्यात्मिक रूप से अनुकूल साथी खोजें। प्रतिबद्धता त्यागे बिना संबंधों में विरक्ति का अभ्यास करें।'
            ),
      });
    }
  }

  // ── Ketu in Lagna (1st House) ──
  if (ketu && ketu.houseNumber === 1) {
    results.push({
      name: pick('Ketu in Lagna', 'केतु लग्न में'),
      severity: 'Low',
      isPresent: true,
      description: pick(
        'Ketu in the 1st house creates a spiritual, introspective personality. Native may have health sensitivity, a tendency toward self-doubt, or periods of withdrawal. However, this placement often grants deep wisdom, past-life intelligence, and a magnetic mystical aura. Physical vitality improves with spiritual practice.',
        'लग्न (प्रथम भाव) में केतु एक आध्यात्मिक, आत्मनिरीक्षी व्यक्तित्व रचता है। जातक को स्वास्थ्य-संवेदनशीलता, आत्म-संदेह की प्रवृत्ति, या एकांत के कालखंड हो सकते हैं। तथापि यह स्थिति प्रायः गहन ज्ञान, पूर्व-जन्म की बुद्धि एवं एक चुम्बकीय रहस्यमय आभा प्रदान करती है। आध्यात्मिक साधना से शारीरिक जीवन-शक्ति सुधरती है।'
      ),
      remedy: pick(
        'Recite Ketu Mantra: "Om Sraam Sreem Sraum Sah Ketave Namah" 108 times on Saturdays. Worship Ganesha regularly. Donate multi-colored items to the underprivileged.',
        'शनिवार को केतु मंत्र "ॐ स्रां स्रीं स्रौं सः केतवे नमः" का 108 बार जप करें। नियमित रूप से गणेश की उपासना करें। वंचितों को बहुरंगी पदार्थ दान करें।'
      ),
    });
  }

  return results;
}
