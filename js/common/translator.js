/**
 * MODUL: PŘEKLADAČ (TRANSLATOR)
 * Komunikace s Google Translate API.
 */

const Translator = {

  /**
   * Provede překlad textu pomocí neoficiálního API Google Translate.
   * @param {string} text Text, který se má přeložit.
   * @param {string} targetLang Kód cílového jazyka (např. "cs").
   * @param {string} [sourceLang="auto"] Kód zdrojového jazyka (výchozí je automatická detekce).
   * @returns {Promise<Object>} Objekt obsahující translation (překlad) a detectedSourceLang (zjištěný jazyk).
   */
  async translate(text, targetLang, sourceLang) {
    if (!text || !targetLang) {
      return {translation: "---", detectedSourceLang: sourceLang};
    }

    if (!sourceLang) {
      sourceLang = 'auto';
    }

    try {
      let url = "https://translate.googleapis.com/translate_a/single?client=gtx"
        + "&sl=" + sourceLang
        + "&tl=" + targetLang
        + "&dt=t"
        + "&q=" + encodeURIComponent(text);

      let response = await fetch(url);
      let data = await response.json();

      // Odpověď je pole ve tvaru: [ [ ["překlad", "originál"] ] ]
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return {
          translation: data[0][0][0],
          detectedSourceLang: data[2] || sourceLang
        };
      }

      return {translation: "Chyba", detectedSourceLang: sourceLang};
    } catch (error) {
      console.error("Chyba při překladu:", error);
      return {translation: "Chyba API", detectedSourceLang: sourceLang};
    }
  },

  /**
   * Zjistí, v jakém jazyce je napsaný předaný text.
   * @param {string} text Text pro detekci jazyka.
   * @returns {Promise<string>} Kód zjištěného jazyka (např. "en", "cs") nebo "auto".
   */
  async detectLanguage(text) {
    if (!text) return 'auto';

    try {
      let url = "https://translate.googleapis.com/translate_a/single?client=gtx"
        + "&sl=auto"
        + "&tl=en"
        + "&dt=t"
        + "&q=" + encodeURIComponent(text);

      let response = await fetch(url);
      let data = await response.json();
      return data[2] || 'auto';
    } catch (e) {
      return 'auto';
    }
  }
};
