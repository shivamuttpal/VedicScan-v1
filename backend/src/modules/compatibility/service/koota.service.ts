/**
 * Koota Service — Vedic Compatibility Rules Engine
 * 
 * Implements the classical Ashta-Koota (8-factor) matching system
 * from Brihat Parashara Hora Shastra.
 * 
 * Total points: 36
 * 1. Varna (1)
 * 2. Vashya (2)
 * 3. Tara (3)
 * 4. Yoni (4)
 * 5. Maitri (5)
 * 6. Gana (6)
 * 7. Bhakut (7)
 * 8. Nadi (8)
 */

export interface NakshatraData {
    name: string;
    rashi: string;
    rashi_english: string;
    varna: string;
    vashya: string;
    yoni: string;
    gana: string;
    nadi: string;
    lord: string;
}

// Full mapping of the 27 Nakshatras to their Vedic properties
export const NAKSHATRA_TABLE: Record<string, NakshatraData> = {
    "Ashwini": { name: "Ashwini", rashi: "Mesha", rashi_english: "Aries", varna: "Kshatriya", vashya: "Chatushpad", yoni: "Ashwa", gana: "Deva", nadi: "Aadi", lord: "Ketu" },
    "Bharani": { name: "Bharani", rashi: "Mesha", rashi_english: "Aries", varna: "Kshatriya", vashya: "Chatushpad", yoni: "Gaja", gana: "Manushya", nadi: "Madhya", lord: "Venus" },
    "Krittika": { name: "Krittika", rashi: "Vrishabha", rashi_english: "Taurus", varna: "Vaishya", vashya: "Chatushpad", yoni: "Aja", gana: "Rakshasa", nadi: "Antya", lord: "Sun" },
    "Rohini": { name: "Rohini", rashi: "Vrishabha", rashi_english: "Taurus", varna: "Vaishya", vashya: "Chatushpad", yoni: "Sarpa", gana: "Manushya", nadi: "Antya", lord: "Moon" },
    "Mrigashira": { name: "Mrigashira", rashi: "Mithuna", rashi_english: "Gemini", varna: "Shudra", vashya: "Manav", yoni: "Sarp", gana: "Deva", nadi: "Madhya", lord: "Mars" },
    "Ardra": { name: "Ardra", rashi: "Mithuna", rashi_english: "Gemini", varna: "Shudra", vashya: "Manav", yoni: "Shwan", gana: "Manushya", nadi: "Aadi", lord: "Rahu" },
    "Punarvasu": { name: "Punarvasu", rashi: "Karka", rashi_english: "Cancer", varna: "Brahmin", vashya: "Jalachar", yoni: "Marjar", gana: "Deva", nadi: "Aadi", lord: "Jupiter" },
    "Pushya": { name: "Pushya", rashi: "Karka", rashi_english: "Cancer", varna: "Brahmin", vashya: "Jalachar", yoni: "Mesha", gana: "Deva", nadi: "Madhya", lord: "Saturn" },
    "Ashlesha": { name: "Ashlesha", rashi: "Karka", rashi_english: "Cancer", varna: "Brahmin", vashya: "Jalachar", yoni: "Marjar", gana: "Rakshasa", nadi: "Antya", lord: "Mercury" },
    "Magha": { name: "Magha", rashi: "Simha", rashi_english: "Leo", varna: "Kshatriya", vashya: "Vanachar", yoni: "Mushak", gana: "Rakshasa", nadi: "Aadi", lord: "Ketu" },
    "Purva Phalguni": { name: "Purva Phalguni", rashi: "Simha", rashi_english: "Leo", varna: "Kshatriya", vashya: "Vanachar", yoni: "Mushak", gana: "Manushya", nadi: "Madhya", lord: "Venus" },
    "Uttara Phalguni": { name: "Uttara Phalguni", rashi: "Kanya", rashi_english: "Virgo", varna: "Vaishya", vashya: "Manav", yoni: "Gau", gana: "Manushya", nadi: "Antya", lord: "Sun" },
    "Hasta": { name: "Hasta", rashi: "Kanya", rashi_english: "Virgo", varna: "Vaishya", vashya: "Manav", yoni: "Mahish", gana: "Deva", nadi: "Antya", lord: "Moon" },
    "Chitra": { name: "Chitra", rashi: "Tula", rashi_english: "Libra", varna: "Shudra", vashya: "Manav", yoni: "Vyaghra", gana: "Rakshasa", nadi: "Madhya", lord: "Mars" },
    "Swati": { name: "Swati", rashi: "Tula", rashi_english: "Libra", varna: "Shudra", vashya: "Manav", yoni: "Mahish", gana: "Deva", nadi: "Antya", lord: "Rahu" },
    "Vishakha": { name: "Vishakha", rashi: "Vrishchika", rashi_english: "Scorpio", varna: "Brahmin", vashya: "Keet", yoni: "Vyaghra", gana: "Rakshasa", nadi: "Antya", lord: "Jupiter" },
    "Anuradha": { name: "Anuradha", rashi: "Vrishchika", rashi_english: "Scorpio", varna: "Brahmin", vashya: "Keet", yoni: "Mruiga", gana: "Deva", nadi: "Madhya", lord: "Saturn" },
    "Jyeshtha": { name: "Jyeshtha", rashi: "Vrishchika", rashi_english: "Scorpio", varna: "Brahmin", vashya: "Keet", yoni: "Mruiga", gana: "Rakshasa", nadi: "Antya", lord: "Mercury" },
    "Mula": { name: "Mula", rashi: "Dhanu", rashi_english: "Sagittarius", varna: "Kshatriya", vashya: "Manav", yoni: "Shwan", gana: "Rakshasa", nadi: "Aadi", lord: "Ketu" },
    "Purva Ashadha": { name: "Purva Ashadha", rashi: "Dhanu", rashi_english: "Sagittarius", varna: "Kshatriya", vashya: "Manav", yoni: "Vanar", gana: "Manushya", nadi: "Madhya", lord: "Venus" },
    "Uttara Ashadha": { name: "Uttara Ashadha", rashi: "Makara", rashi_english: "Capricorn", varna: "Vaishya", vashya: "Jalachar", yoni: "Nakul", gana: "Manushya", nadi: "Antya", lord: "Sun" },
    "Shravana": { name: "Shravana", rashi: "Makara", rashi_english: "Capricorn", varna: "Vaishya", vashya: "Jalachar", yoni: "Vanar", gana: "Deva", nadi: "Antya", lord: "Moon" },
    "Dhanishta": { name: "Dhanishta", rashi: "Kumbha", rashi_english: "Aquarius", varna: "Shudra", vashya: "Manav", yoni: "Simha", gana: "Rakshasa", nadi: "Madhya", lord: "Mars" },
    "Shatabhisha": { name: "Shatabhisha", rashi: "Kumbha", rashi_english: "Aquarius", varna: "Shudra", vashya: "Manav", yoni: "Ashwa", gana: "Rakshasa", nadi: "Aadi", lord: "Rahu" },
    "Purva Bhadrapada": { name: "Purva Bhadrapada", rashi: "Meena", rashi_english: "Pisces", varna: "Brahmin", vashya: "Jalachar", yoni: "Simha", gana: "Manushya", nadi: "Aadi", lord: "Jupiter" },
    "Uttara Bhadrapada": { name: "Uttara Bhadrapada", rashi: "Meena", rashi_english: "Pisces", varna: "Brahmin", vashya: "Jalachar", yoni: "Gau", gana: "Manushya", nadi: "Madhya", lord: "Saturn" },
    "Revati": { name: "Revati", rashi: "Meena", rashi_english: "Pisces", varna: "Brahmin", vashya: "Jalachar", yoni: "Gaja", gana: "Deva", nadi: "Antya", lord: "Mercury" }
};

const PLANETARY_FRIENDSHIP: Record<string, Record<string, number>> = {
    "Sun": { "Sun": 1, "Moon": 1, "Mars": 1, "Mercury": 0.5, "Jupiter": 1, "Venus": 0, "Saturn": 0 },
    "Moon": { "Sun": 1, "Moon": 1, "Mars": 0.5, "Mercury": 1, "Jupiter": 0.5, "Venus": 0.5, "Saturn": 0.5 },
    "Mars": { "Sun": 1, "Moon": 1, "Mars": 1, "Mercury": 0, "Jupiter": 1, "Venus": 0.5, "Saturn": 0.5 },
    "Mercury": { "Sun": 1, "Moon": 0, "Mars": 0.5, "Mercury": 1, "Jupiter": 0.5, "Venus": 1, "Saturn": 0.5 },
    "Jupiter": { "Sun": 1, "Moon": 1, "Mars": 1, "Mercury": 0, "Jupiter": 1, "Venus": 0, "Saturn": 0.5 },
    "Venus": { "Sun": 0, "Moon": 0, "Mars": 0.5, "Mercury": 1, "Jupiter": 0.5, "Venus": 1, "Saturn": 1 },
    "Saturn": { "Sun": 0, "Moon": 0, "Mars": 0, "Mercury": 1, "Jupiter": 0.5, "Venus": 1, "Saturn": 1 }
};

const YONI_FRIENDSHIP: Record<string, string[]> = {
    "Ashwa": ["Ashwa", "Vanar"], "Gaja": ["Gaja", "Nakul"], "Aja": ["Aja", "Vanar"], "Sarpa": ["Sarpa"],
    "Sarp": ["Sarp"], "Shwan": ["Shwan", "Mushak"], "Marjar": ["Marjar", "Mushak"], "Mesha": ["Mesha"],
    "Mushak": ["Mushak", "Shwan", "Marjar"], "Gau": ["Gau", "Vyaghra"], "Mahish": ["Mahish", "Ashwa"],
    "Vyaghra": ["Vyaghra", "Gau"], "Vanar": ["Vanar", "Ashwa", "Aja"], "Nakul": ["Nakul", "Gaja"], "Simha": ["Simha"]
};

export class KootaService {
    /**
     * Calculate Ashta-Koota points between two individuals
     */
    static analyze(boyN: NakshatraData, girlN: NakshatraData) {
        let scores = [];
        
        // 1. Varna (1 Point)
        const varnaScore = this.calcVarna(boyN.varna, girlN.varna);
        scores.push({ koota: "Varna", score: varnaScore, max_score: 1, description: "Ego and Work compatibility", passed: varnaScore >= 1 });

        // 2. Vashya (2 Points)
        const vashyaScore = this.calcVashya(boyN.vashya, girlN.vashya);
        scores.push({ koota: "Vashya", score: vashyaScore, max_score: 2, description: "Mutual attraction and control", passed: vashyaScore >= 1.5 });

        // 3. Tara (3 Points)
        const taraScore = this.calcTara(boyN.name, girlN.name);
        scores.push({ koota: "Tara", score: taraScore, max_score: 3, description: "Destiny and Luck", passed: taraScore >= 1.5 });

        // 4. Yoni (4 Points)
        const yoniScore = this.calcYoni(boyN.yoni, girlN.yoni);
        scores.push({ koota: "Yoni", score: yoniScore, max_score: 4, description: "Biological and Physical compatibility", passed: yoniScore >= 2 });

        // 5. Maitri (5 Points)
        const maitriScore = this.calcMaitri(boyN.lord, girlN.lord);
        scores.push({ koota: "Maitri", score: maitriScore, max_score: 5, description: "Intellectual and Psychological friendship", passed: maitriScore >= 3 });

        // 6. Gana (6 Points)
        const ganaScore = this.calcGana(boyN.gana, girlN.gana);
        scores.push({ koota: "Gana", score: ganaScore, max_score: 6, description: "Temperament and behavior", passed: ganaScore >= 3 });

        // 7. Bhakut (7 Points)
        const bhakutScore = this.calcBhakut(boyN.rashi, girlN.rashi);
        scores.push({ koota: "Bhakut", score: bhakutScore, max_score: 7, description: "Life force and prosperity", passed: bhakutScore >= 7 });

        // 8. Nadi (8 Points)
        const nadiScore = this.calcNadi(boyN.nadi, girlN.nadi);
        scores.push({ koota: "Nadi", score: nadiScore, max_score: 8, description: "Health and Genetics", passed: nadiScore >= 8 });

        const totalScore = scores.reduce((sum, k) => sum + k.score, 0);
        
        return {
            total_score: totalScore,
            max_score: 36,
            percentage: Math.round((totalScore / 36) * 100),
            verdict: this.getVerdict(totalScore),
            koota_breakdown: scores
        };
    }

    private static calcVarna(boy: string, girl: string): number {
        const ranks = { "Brahmin": 4, "Kshatriya": 3, "Vaishya": 2, "Shudra": 1 };
        return (ranks[boy as keyof typeof ranks] >= ranks[girl as keyof typeof ranks]) ? 1 : 0;
    }

    private static calcVashya(boy: string, girl: string): number {
        if (boy === girl) return 2;
        // Simplified Logic: 1 if both same category or friends
        return 1; 
    }

    private static calcTara(boy: string, girl: string): number {
        const names = Object.keys(NAKSHATRA_TABLE);
        const idxB = names.indexOf(boy);
        const idxG = names.indexOf(girl);
        const diff1 = (idxG - idxB + 27) % 9;
        const diff2 = (idxB - idxG + 27) % 9;
        const score1 = [0, 1.5, 3][diff1 % 3] || 1.5;
        const score2 = [0, 1.5, 3][diff2 % 3] || 1.5;
        return (score1 + score2) / 2;
    }

    private static calcYoni(boy: string, girl: string): number {
        if (boy === girl) return 4;
        if (YONI_FRIENDSHIP[boy]?.includes(girl)) return 3;
        return 1;
    }

    private static calcMaitri(boyL: string, girlL: string): number {
        const f1 = PLANETARY_FRIENDSHIP[boyL]?.[girlL] || 0;
        const f2 = PLANETARY_FRIENDSHIP[girlL]?.[boyL] || 0;
        if (f1 === 1 && f2 === 1) return 5;
        if ((f1 === 1 && f2 === 0.5) || (f1 === 0.5 && f2 === 1)) return 4;
        if (f1 === 0.5 && f2 === 0.5) return 3;
        return 0;
    }

    private static calcGana(boy: string, girl: string): number {
        if (boy === girl) return 6;
        if (boy === "Deva" && girl === "Manushya") return 5;
        if (boy === "Manushya" && girl === "Deva") return 5;
        if (boy === "Rakshasa" || girl === "Rakshasa") return 0;
        return 1;
    }

    private static calcBhakut(boyR: string, girlR: string): number {
        const rashis = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
        const b = rashis.indexOf(boyR);
        const g = rashis.indexOf(girlR);
        const diff = Math.abs(b - g);
        // Doshas: 2/12, 5/9, 6/8
        if ([1, 11, 4, 8, 5, 7].includes(diff)) return 0;
        return 7;
    }

    private static calcNadi(boy: string, girl: string): number {
        return (boy !== girl) ? 8 : 0;
    }

    private static getVerdict(score: number): string {
        if (score >= 28) return "Excellent Match! Highly recommended.";
        if (score >= 21) return "Good Match. Can proceed.";
        if (score >= 18) return "Average Match. Remedies may be needed.";
        return "Not Recommended. High risk of incompatibility.";
    }
}
