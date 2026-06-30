/**
 * Koota Service — Vedic Compatibility Rules Engine
 *
 * Implements the classical Ashta-Koota (8-factor) matching system
 * from Brihat Parashara Hora Shastra.
 *
 * Total points: 36
 * 1. Varna   (1)  — ego / spiritual order
 * 2. Vashya  (2)  — mutual attraction / control
 * 3. Tara    (3)  — destiny / birth-star counting
 * 4. Yoni    (4)  — biological / temperamental compatibility
 * 5. Maitri  (5)  — planetary friendship (Graha Maitri)
 * 6. Gana    (6)  — temperament (Deva / Manushya / Rakshasa)
 * 7. Bhakut  (7)  — Rashi relationship / life-force
 * 8. Nadi    (8)  — genetic / health energy
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

// Full mapping of 27 Nakshatras — yoni spellings normalised to single canonical form
export const NAKSHATRA_TABLE: Record<string, NakshatraData> = {
    "Ashwini":           { name: "Ashwini",           rashi: "Mesha",      rashi_english: "Aries",       varna: "Kshatriya", vashya: "Chatushpad", yoni: "Ashwa",   gana: "Deva",      nadi: "Aadi",   lord: "Ketu"    },
    "Bharani":           { name: "Bharani",            rashi: "Mesha",      rashi_english: "Aries",       varna: "Kshatriya", vashya: "Chatushpad", yoni: "Gaja",    gana: "Manushya",  nadi: "Madhya", lord: "Venus"   },
    "Krittika":          { name: "Krittika",           rashi: "Vrishabha",  rashi_english: "Taurus",      varna: "Vaishya",   vashya: "Chatushpad", yoni: "Aja",     gana: "Rakshasa",  nadi: "Antya",  lord: "Sun"     },
    "Rohini":            { name: "Rohini",             rashi: "Vrishabha",  rashi_english: "Taurus",      varna: "Vaishya",   vashya: "Chatushpad", yoni: "Sarpa",   gana: "Manushya",  nadi: "Antya",  lord: "Moon"    },
    "Mrigashira":        { name: "Mrigashira",         rashi: "Mithuna",    rashi_english: "Gemini",      varna: "Shudra",    vashya: "Manav",      yoni: "Sarpa",   gana: "Deva",      nadi: "Madhya", lord: "Mars"    },
    "Ardra":             { name: "Ardra",              rashi: "Mithuna",    rashi_english: "Gemini",      varna: "Shudra",    vashya: "Manav",      yoni: "Shwan",   gana: "Manushya",  nadi: "Aadi",   lord: "Rahu"    },
    "Punarvasu":         { name: "Punarvasu",          rashi: "Karka",      rashi_english: "Cancer",      varna: "Brahmin",   vashya: "Jalachar",   yoni: "Marjar",  gana: "Deva",      nadi: "Aadi",   lord: "Jupiter" },
    "Pushya":            { name: "Pushya",             rashi: "Karka",      rashi_english: "Cancer",      varna: "Brahmin",   vashya: "Jalachar",   yoni: "Mesha",   gana: "Deva",      nadi: "Madhya", lord: "Saturn"  },
    "Ashlesha":          { name: "Ashlesha",           rashi: "Karka",      rashi_english: "Cancer",      varna: "Brahmin",   vashya: "Jalachar",   yoni: "Marjar",  gana: "Rakshasa",  nadi: "Antya",  lord: "Mercury" },
    "Magha":             { name: "Magha",              rashi: "Simha",      rashi_english: "Leo",         varna: "Kshatriya", vashya: "Vanachar",   yoni: "Mushak",  gana: "Rakshasa",  nadi: "Aadi",   lord: "Ketu"    },
    "Purva Phalguni":    { name: "Purva Phalguni",     rashi: "Simha",      rashi_english: "Leo",         varna: "Kshatriya", vashya: "Vanachar",   yoni: "Mushak",  gana: "Manushya",  nadi: "Madhya", lord: "Venus"   },
    "Uttara Phalguni":   { name: "Uttara Phalguni",    rashi: "Kanya",      rashi_english: "Virgo",       varna: "Vaishya",   vashya: "Manav",      yoni: "Gau",     gana: "Manushya",  nadi: "Antya",  lord: "Sun"     },
    "Hasta":             { name: "Hasta",              rashi: "Kanya",      rashi_english: "Virgo",       varna: "Vaishya",   vashya: "Manav",      yoni: "Mahish",  gana: "Deva",      nadi: "Antya",  lord: "Moon"    },
    "Chitra":            { name: "Chitra",             rashi: "Tula",       rashi_english: "Libra",       varna: "Shudra",    vashya: "Manav",      yoni: "Vyaghra", gana: "Rakshasa",  nadi: "Madhya", lord: "Mars"    },
    "Swati":             { name: "Swati",              rashi: "Tula",       rashi_english: "Libra",       varna: "Shudra",    vashya: "Manav",      yoni: "Mahish",  gana: "Deva",      nadi: "Antya",  lord: "Rahu"    },
    "Vishakha":          { name: "Vishakha",           rashi: "Vrishchika", rashi_english: "Scorpio",     varna: "Brahmin",   vashya: "Keet",       yoni: "Vyaghra", gana: "Rakshasa",  nadi: "Antya",  lord: "Jupiter" },
    "Anuradha":          { name: "Anuradha",           rashi: "Vrishchika", rashi_english: "Scorpio",     varna: "Brahmin",   vashya: "Keet",       yoni: "Mruiga",  gana: "Deva",      nadi: "Madhya", lord: "Saturn"  },
    "Jyeshtha":          { name: "Jyeshtha",           rashi: "Vrishchika", rashi_english: "Scorpio",     varna: "Brahmin",   vashya: "Keet",       yoni: "Mruiga",  gana: "Rakshasa",  nadi: "Antya",  lord: "Mercury" },
    "Mula":              { name: "Mula",               rashi: "Dhanu",      rashi_english: "Sagittarius", varna: "Kshatriya", vashya: "Manav",      yoni: "Shwan",   gana: "Rakshasa",  nadi: "Aadi",   lord: "Ketu"    },
    "Purva Ashadha":     { name: "Purva Ashadha",      rashi: "Dhanu",      rashi_english: "Sagittarius", varna: "Kshatriya", vashya: "Manav",      yoni: "Vanar",   gana: "Manushya",  nadi: "Madhya", lord: "Venus"   },
    "Uttara Ashadha":    { name: "Uttara Ashadha",     rashi: "Makara",     rashi_english: "Capricorn",   varna: "Vaishya",   vashya: "Jalachar",   yoni: "Nakul",   gana: "Manushya",  nadi: "Antya",  lord: "Sun"     },
    "Shravana":          { name: "Shravana",           rashi: "Makara",     rashi_english: "Capricorn",   varna: "Vaishya",   vashya: "Jalachar",   yoni: "Vanar",   gana: "Deva",      nadi: "Antya",  lord: "Moon"    },
    "Dhanishta":         { name: "Dhanishta",          rashi: "Kumbha",     rashi_english: "Aquarius",    varna: "Shudra",    vashya: "Manav",      yoni: "Simha",   gana: "Rakshasa",  nadi: "Madhya", lord: "Mars"    },
    "Shatabhisha":       { name: "Shatabhisha",        rashi: "Kumbha",     rashi_english: "Aquarius",    varna: "Shudra",    vashya: "Manav",      yoni: "Ashwa",   gana: "Rakshasa",  nadi: "Aadi",   lord: "Rahu"    },
    "Purva Bhadrapada":  { name: "Purva Bhadrapada",   rashi: "Meena",      rashi_english: "Pisces",      varna: "Brahmin",   vashya: "Jalachar",   yoni: "Simha",   gana: "Manushya",  nadi: "Aadi",   lord: "Jupiter" },
    "Uttara Bhadrapada": { name: "Uttara Bhadrapada",  rashi: "Meena",      rashi_english: "Pisces",      varna: "Brahmin",   vashya: "Jalachar",   yoni: "Gau",     gana: "Manushya",  nadi: "Madhya", lord: "Saturn"  },
    "Revati":            { name: "Revati",             rashi: "Meena",      rashi_english: "Pisces",      varna: "Brahmin",   vashya: "Jalachar",   yoni: "Gaja",    gana: "Deva",      nadi: "Antya",  lord: "Mercury" },
};

// ─── Planetary Friendship (Naisargika Maitri) — includes Rahu & Ketu ─────────
// Values: 1 = friend, 0.5 = neutral, 0 = enemy
const PLANETARY_FRIENDSHIP: Record<string, Record<string, number>> = {
    "Sun":     { "Sun": 1, "Moon": 1,   "Mars": 1,   "Mercury": 0.5, "Jupiter": 1,   "Venus": 0,   "Saturn": 0,   "Rahu": 0,   "Ketu": 0   },
    "Moon":    { "Sun": 1, "Moon": 1,   "Mars": 0.5, "Mercury": 1,   "Jupiter": 0.5, "Venus": 0.5, "Saturn": 0.5, "Rahu": 0,   "Ketu": 0   },
    "Mars":    { "Sun": 1, "Moon": 1,   "Mars": 1,   "Mercury": 0,   "Jupiter": 1,   "Venus": 0.5, "Saturn": 0.5, "Rahu": 0.5, "Ketu": 1   },
    "Mercury": { "Sun": 1, "Moon": 0,   "Mars": 0.5, "Mercury": 1,   "Jupiter": 0.5, "Venus": 1,   "Saturn": 0.5, "Rahu": 1,   "Ketu": 0   },
    "Jupiter": { "Sun": 1, "Moon": 1,   "Mars": 1,   "Mercury": 0,   "Jupiter": 1,   "Venus": 0,   "Saturn": 0.5, "Rahu": 0,   "Ketu": 0.5 },
    "Venus":   { "Sun": 0, "Moon": 0,   "Mars": 0.5, "Mercury": 1,   "Jupiter": 0.5, "Venus": 1,   "Saturn": 1,   "Rahu": 1,   "Ketu": 1   },
    "Saturn":  { "Sun": 0, "Moon": 0,   "Mars": 0,   "Mercury": 1,   "Jupiter": 0.5, "Venus": 1,   "Saturn": 1,   "Rahu": 1,   "Ketu": 0.5 },
    "Rahu":    { "Sun": 0, "Moon": 0,   "Mars": 0.5, "Mercury": 1,   "Jupiter": 0,   "Venus": 1,   "Saturn": 1,   "Rahu": 1,   "Ketu": 0   },
    "Ketu":    { "Sun": 0, "Moon": 0.5, "Mars": 1,   "Mercury": 0,   "Jupiter": 0.5, "Venus": 1,   "Saturn": 0.5, "Rahu": 0,   "Ketu": 1   },
};

// ─── Yoni: 7 classical enemy pairs (both directions) ─────────────────────────
// Classical sources: Ashwa-Mahish, Gaja-Simha, Aja-Vanar, Sarpa-Nakul,
// Shwan-Mruiga, Marjar-Mushak, Gau-Vyaghra
const YONI_ENEMIES: Record<string, string> = {
    "Ashwa": "Mahish", "Mahish": "Ashwa",
    "Gaja":  "Simha",  "Simha":  "Gaja",
    "Aja":   "Vanar",  "Vanar":  "Aja",
    "Sarpa": "Nakul",  "Nakul":  "Sarpa",
    "Shwan": "Mruiga", "Mruiga": "Shwan",
    "Marjar":"Mushak", "Mushak": "Marjar",
    "Gau":   "Vyaghra","Vyaghra":"Gau",
};

export class KootaService {
    static analyze(boyN: NakshatraData, girlN: NakshatraData) {
        const scores = [];

        // 1. Varna (max 1)
        const varnaScore = this.calcVarna(boyN.varna, girlN.varna);
        scores.push({ koota: "Varna", score: varnaScore, max_score: 1,
            description: "Ego and spiritual-order compatibility", passed: varnaScore >= 1 });

        // 2. Vashya (max 2)
        const vashyaScore = this.calcVashya(boyN.vashya, girlN.vashya);
        scores.push({ koota: "Vashya", score: vashyaScore, max_score: 2,
            description: "Mutual attraction and dominance", passed: vashyaScore >= 1.5 });

        // 3. Tara (max 3)
        const taraScore = this.calcTara(boyN.name, girlN.name);
        scores.push({ koota: "Tara", score: taraScore, max_score: 3,
            description: "Destiny and birth-star harmony", passed: taraScore >= 1.5 });

        // 4. Yoni (max 4)
        const yoniScore = this.calcYoni(boyN.yoni, girlN.yoni);
        scores.push({ koota: "Yoni", score: yoniScore, max_score: 4,
            description: "Physical and temperamental compatibility", passed: yoniScore >= 2 });

        // 5. Maitri / Graha Maitri (max 5)
        const maitriScore = this.calcMaitri(boyN.lord, girlN.lord);
        scores.push({ koota: "Maitri", score: maitriScore, max_score: 5,
            description: "Planetary friendship and psychological bond", passed: maitriScore >= 3 });

        // 6. Gana (max 6)
        const ganaScore = this.calcGana(boyN.gana, girlN.gana);
        scores.push({ koota: "Gana", score: ganaScore, max_score: 6,
            description: "Temperament and nature (Deva/Manushya/Rakshasa)", passed: ganaScore >= 4 });

        // 7. Bhakut (max 7)
        const bhakutScore = this.calcBhakut(boyN.rashi, girlN.rashi);
        scores.push({ koota: "Bhakut", score: bhakutScore, max_score: 7,
            description: "Rashi relationship and life-force compatibility", passed: bhakutScore >= 7 });

        // 8. Nadi (max 8)
        const nadiScore = this.calcNadi(boyN.nadi, girlN.nadi);
        scores.push({ koota: "Nadi", score: nadiScore, max_score: 8,
            description: "Genetic and health energy (Aadi/Madhya/Antya)", passed: nadiScore >= 8 });

        const totalScore = scores.reduce((sum, k) => sum + k.score, 0);
        return {
            total_score: totalScore,
            max_score: 36,
            percentage: Math.round((totalScore / 36) * 100),
            verdict: this.getVerdict(totalScore),
            koota_breakdown: scores,
        };
    }

    // ── 1. Varna ──────────────────────────────────────────────────────────────
    // Boy's varna rank must be ≥ girl's for 1 pt; otherwise 0.
    private static calcVarna(boy: string, girl: string): number {
        const rank: Record<string, number> = { "Brahmin": 4, "Kshatriya": 3, "Vaishya": 2, "Shudra": 1 };
        return (rank[boy] ?? 0) >= (rank[girl] ?? 0) ? 1 : 0;
    }

    // ── 2. Vashya ─────────────────────────────────────────────────────────────
    // Same group = 2, friendly groups = 1, others = 0.5
    private static calcVashya(boy: string, girl: string): number {
        if (boy === girl) return 2;
        // Friendly group pairs (Brihat Parashara / Muhurta Chintamani)
        const friendly: Record<string, string[]> = {
            "Chatushpad": ["Manav"],
            "Manav":      ["Chatushpad", "Jalachar"],
            "Jalachar":   ["Manav", "Keet"],
            "Vanachar":   [],
            "Keet":       ["Jalachar"],
        };
        return friendly[boy]?.includes(girl) ? 1 : 0.5;
    }

    // ── 3. Tara ───────────────────────────────────────────────────────────────
    // Count girl's nakshatra from boy's (and reverse). Divide by 9 → position 1-9.
    // Positions 2,4,6,8,9 (Sampat, Kshema, Sadhaka, Mitra, Ati-Mitra) = auspicious → 3 pts each.
    // Positions 1,3,5,7 (Janma, Vipat, Pratyak, Vadha) = inauspicious → 0 pts each.
    // Final score = average of both directions.
    private static calcTara(boy: string, girl: string): number {
        const names = Object.keys(NAKSHATRA_TABLE);
        const idxB = names.indexOf(boy);
        const idxG = names.indexOf(girl);

        const taraPosition = (from: number, to: number): number => {
            const count = ((to - from + 27) % 27) || 27; // 1-27
            return ((count - 1) % 9) + 1;                // 1-9
        };

        const favorable = (pos: number) => [2, 4, 6, 8, 9].includes(pos);
        const s1 = favorable(taraPosition(idxB, idxG)) ? 3 : 0;
        const s2 = favorable(taraPosition(idxG, idxB)) ? 3 : 0;
        return (s1 + s2) / 2;
    }

    // ── 4. Yoni ───────────────────────────────────────────────────────────────
    // Same yoni = 4, classical enemy pair = 0, all other combinations = 2.
    private static calcYoni(boy: string, girl: string): number {
        if (boy === girl) return 4;
        if (YONI_ENEMIES[boy] === girl) return 0;
        return 2; // neutral
    }

    // ── 5. Maitri (Graha Maitri) ──────────────────────────────────────────────
    // Uses full friendship table including Rahu & Ketu.
    // Both friends=5, Friend+Neutral=4, Both neutral=3,
    // Friend+Enemy=2, Neutral+Enemy=1, Both enemy=0.
    private static calcMaitri(boyLord: string, girlLord: string): number {
        const f1 = PLANETARY_FRIENDSHIP[boyLord]?.[girlLord] ?? 0;
        const f2 = PLANETARY_FRIENDSHIP[girlLord]?.[boyLord] ?? 0;
        if (f1 === 1   && f2 === 1)   return 5;
        if ((f1 === 1   && f2 === 0.5) || (f1 === 0.5 && f2 === 1))   return 4;
        if (f1 === 0.5 && f2 === 0.5) return 3;
        if ((f1 === 1   && f2 === 0)   || (f1 === 0   && f2 === 1))   return 2;
        if ((f1 === 0.5 && f2 === 0)   || (f1 === 0   && f2 === 0.5)) return 1;
        return 0; // both enemy
    }

    // ── 6. Gana ───────────────────────────────────────────────────────────────
    // Same gana = 6. Deva ↔ Manushya = 5.
    // Deva ↔ Rakshasa = 1. Manushya ↔ Rakshasa = 0.
    private static calcGana(boy: string, girl: string): number {
        if (boy === girl) return 6; // Deva+Deva, Manushya+Manushya, Rakshasa+Rakshasa all = 6
        if ((boy === "Deva"     && girl === "Manushya") ||
            (boy === "Manushya" && girl === "Deva"))     return 5;
        if ((boy === "Deva"     && girl === "Rakshasa") ||
            (boy === "Rakshasa" && girl === "Deva"))     return 1;
        // Manushya ↔ Rakshasa
        return 0;
    }

    // ── 7. Bhakut ─────────────────────────────────────────────────────────────
    // Dosha combinations (Rashi index difference): 2/12=1|11, 5/9=4|8, 6/8=5|7 → 0 pts.
    // All other combinations (1/1, 3/11, 4/10, 7/7 etc.) → 7 pts.
    private static calcBhakut(boyR: string, girlR: string): number {
        const rashis = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya",
                        "Tula","Vrishchika","Dhanu","Makara","Kumbha","Meena"];
        const b = rashis.indexOf(boyR);
        const g = rashis.indexOf(girlR);
        const diff = Math.abs(b - g);
        return [1, 11, 4, 8, 5, 7].includes(diff) ? 0 : 7;
    }

    // ── 8. Nadi ───────────────────────────────────────────────────────────────
    // Different Nadi = 8 pts. Same Nadi = 0 (Nadi Dosha).
    private static calcNadi(boy: string, girl: string): number {
        return boy !== girl ? 8 : 0;
    }

    // ── Verdict ───────────────────────────────────────────────────────────────
    private static getVerdict(score: number): string {
        if (score >= 32) return "Exceptional Match. Highly auspicious union.";
        if (score >= 25) return "Excellent Match. Strongly recommended.";
        if (score >= 18) return "Good Match. Can proceed.";
        if (score >= 14) return "Average Match. Remedies advised.";
        return "Not Recommended. High risk of incompatibility.";
    }
}
