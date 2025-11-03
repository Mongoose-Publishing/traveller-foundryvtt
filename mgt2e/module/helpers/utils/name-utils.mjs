/**
 * Generates a random Vilani name based on Traveller RPG lore.
 * A typical Vilani name is a Personal Name (sometimes with an Attributive Name) + Family Name.
 */
export function generateVilaniName() {
    // Phoneme and Syllable Structures (based on common generators/lore)
    const C = [
        "k", "g", "t", "d", "p", "b", "s", "z", "sh", "r", "l", "m", "n", "kh", "h", "ch"
    ]; // Consonants
    const V = [
        "a", "e", "i", "u", "o", "aa", "ii", "uu"
    ]; // Vowels (including long vowels)

    // Syllable patterns for name parts
    const patterns = [
        "CV", "CVC", "VC", "CVV", "CVCV"
    ];

    /**
     * Helper function to generate a random syllable based on phonemes.
     * @param {string} pattern - Syllable pattern string (e.g., "CVC").
     * @returns {string} The generated syllable.
     */
    function getSyllable(pattern) {
        let syllable = "";
        for (let char of pattern) {
            if (char === 'C') {
                syllable += C[Math.floor(Math.random() * C.length)];
            } else if (char === 'V') {
                syllable += V[Math.floor(Math.random() * V.length)];
            }
        }
        return syllable;
    }

    /**
     * Helper function to build a name component (Personal, Family).
     * @param {number} minSyllables - Minimum number of syllables.
     * @param {number} maxSyllables - Maximum number of syllables.
     * @returns {string} The generated name part.
     */
    function buildNamePart(minSyllables, maxSyllables) {
        const numSyllables = Math.floor(Math.random() * (maxSyllables - minSyllables + 1)) + minSyllables;
        let name = "";
        for (let i = 0; i < numSyllables; i++) {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            name += getSyllable(pattern);
        }

        // Capitalize the first letter
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    // --- 1. Personal Name (1-3 Syllables) ---
    const personalName = buildNamePart(1, 3);

    // --- 2. Attributive Name (Optional, 10% chance) ---
    // The attributive name is another personal name, sometimes added for an honored relative.
    let attributiveName = "";
    if (Math.random() < 0.1) {
        attributiveName = " " + buildNamePart(1, 2);
    }

    // --- 3. Family/Clan Name (2-4 Syllables) ---
    const familyName = buildNamePart(2, 3);

    // --- 4. Caste Name/Title (Optional, used in formal/business) ---
    // We'll skip the formal social/caste name for a common use name format.

    // Combine into a common format: Personal Name [Attributive Name] Family Name
    return `${personalName}${attributiveName} ${familyName}`;
}
