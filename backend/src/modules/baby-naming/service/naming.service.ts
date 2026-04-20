/**
 * Naming Service — Vedic Baby Naming (Namakarana)
 * 
 * Maps Nakshatras and Padas to auspicious starting syllables (Aksharas).
 * Includes a curated database of Vedic names categorized by syllable and gender.
 */

export interface NameEntry {
    name: string;
    meaning: string;
    gender: 'Male' | 'Female' | 'Unisex';
    origin: string;
}

export interface SyllableMap {
    [nakshatra: string]: string[]; // Array of 4 syllables, one for each Pada
}

// Classical mapping of Nakshatra Padas to syllables
export const NAKSHATRA_SYLLABLES: SyllableMap = {
    "Ashwini": ["Chu", "Che", "Cho", "La"],
    "Bharani": ["Lee", "Lu", "Le", "Lo"],
    "Krittika": ["A", "Ee", "U", "Ae"],
    "Rohini": ["O", "Va", "Vi", "Vu"],
    "Mrigashira": ["Ve", "Vo", "Ka", "Ki"],
    "Ardra": ["Ku", "Gha", "Ng", "Chha"],
    "Punarvasu": ["Ke", "Ko", "Ha", "Hi"],
    "Pushya": ["Hu", "He", "Ho", "Da"],
    "Ashlesha": ["Dee", "Du", "De", "Do"],
    "Magha": ["Ma", "Me", "Mu", "Me"],
    "Purva Phalguni": ["Mo", "Ta", "Ti", "Tu"],
    "Uttara Phalguni": ["Te", "To", "Pa", "Pi"],
    "Hasta": ["Pu", "Sha", "Na", "Tha"],
    "Chitra": ["Pe", "Po", "Ra", "Ri"],
    "Swati": ["Ru", "Re", "Ro", "Ta"],
    "Vishakha": ["Ti", "Tu", "Te", "To"],
    "Anuradha": ["Na", "Ni", "Nu", "Ne"],
    "Jyeshtha": ["No", "Ya", "Yi", "Yu"],
    "Mula": ["Ye", "Yo", "Ba", "Bi"],
    "Purva Ashadha": ["Bu", "Dha", "Pha", "Dha"],
    "Uttara Ashadha": ["Be", "Bo", "Ja", "Ji"],
    "Shravana": ["Khi", "Khu", "Khe", "Kho"],
    "Dhanishta": ["Ga", "Gi", "Gu", "Ge"],
    "Shatabhisha": ["Go", "Sa", "Si", "Su"],
    "Purva Bhadrapada": ["Se", "So", "Da", "Di"],
    "Uttara Bhadrapada": ["Du", "Tha", "Jna", "Da"],
    "Revati": ["De", "Do", "Cha", "Chi"]
};

// Curated database of Vedic names
export const NAMES_DATABASE: NameEntry[] = [
    // A / Aa
    { name: "Aarav", meaning: "Peaceful; Wisdom", gender: "Male", origin: "Sanskrit" },
    { name: "Aanya", meaning: "Graceful; Inexhaustible", gender: "Female", origin: "Sanskrit" },
    { name: "Aditya", meaning: "Lord of the Sun", gender: "Male", origin: "Sanskrit" },
    { name: "Advait", meaning: "Unique; Non-dual", gender: "Male", origin: "Sanskrit" },
    { name: "Ananya", meaning: "Matchless; Unique", gender: "Female", origin: "Sanskrit" },
    { name: "Arjun", meaning: "Bright; Shining; Brave", gender: "Male", origin: "Sanskrit" },
    
    // Vi / Va (Rohini)
    { name: "Vihaan", meaning: "Dawn; Morning", gender: "Male", origin: "Sanskrit" },
    { name: "Vanya", meaning: "Gracious gift of God", gender: "Female", origin: "Sanskrit" },
    { name: "Veda", meaning: "Knowledge; Sacred text", gender: "Female", origin: "Sanskrit" },
    { name: "Vivaan", meaning: "Full of life", gender: "Male", origin: "Sanskrit" },
    
    // Ma (Magha)
    { name: "Madhav", meaning: "Lord Krishna", gender: "Male", origin: "Sanskrit" },
    { name: "Meher", meaning: "Grace; Benevolence", gender: "Female", origin: "Persian/Sanskrit" },
    { name: "Manas", meaning: "Mind; Intellect", gender: "Male", origin: "Sanskrit" },
    { name: "Mira", meaning: "Wonderful; Ocean", gender: "Female", origin: "Sanskrit" },
    
    // Ke / Ko (Punarvasu)
    { name: "Keshava", meaning: "Lord Vishnu", gender: "Male", origin: "Sanskrit" },
    { name: "Keerthi", meaning: "Fame; Glory", gender: "Female", origin: "Sanskrit" },
    
    // Sha / Shu (Hasta)
    { name: "Shreyas", meaning: "Superior; Auspicious", gender: "Male", origin: "Sanskrit" },
    { name: "Shanaya", meaning: "First ray of the sun", gender: "Female", origin: "Sanskrit" },
    { name: "Shiva", meaning: "The Auspicious One", gender: "Male", origin: "Sanskrit" },
    
    // Ra / Ri (Chitra)
    { name: "Rahul", meaning: "Conqueror of miseries", gender: "Male", origin: "Sanskrit" },
    { name: "Riya", meaning: "Singer; Graceful", gender: "Female", origin: "Sanskrit" },
    { name: "Rishi", meaning: "Sage; Seer", gender: "Male", origin: "Sanskrit" },
    
    // Default Fallbacks
    { name: "Ishaan", meaning: "Lord Shiva; Sun", gender: "Male", origin: "Sanskrit" },
    { name: "Ishani", meaning: "Desire; Goddess Parvati", gender: "Female", origin: "Sanskrit" }
];

export class NamingService {
    /**
     * Get allowed syllables for a Nakshatra and Pada
     */
    static getSyllables(nakshatra: string, pada: number): string[] {
        const syllables = NAKSHATRA_SYLLABLES[nakshatra];
        if (!syllables) return ["A", "Ra", "Sa"]; // Broad fallbacks
        
        const mainSyllable = syllables[pada - 1] || syllables[0];
        // Return a few variations (e.g. "Ma" -> "Ma", "Me", "Mu")
        return [mainSyllable];
    }

    /**
     * Find names starting with allowed syllables
     */
    static suggestNames(syllables: string[], gender: 'Male' | 'Female'): NameEntry[] {
        return NAMES_DATABASE.filter(name => {
            const matchesSyllable = syllables.some(s => 
                name.name.toLowerCase().startsWith(s.toLowerCase().substring(0, 1))
            );
            const matchesGender = name.gender === gender || name.gender === 'Unisex';
            return matchesSyllable && matchesGender;
        });
    }
}
