/**
 * MODUL: TTS (VÝSLOVNOST)
 * Přečte slovo nahlas pomocí Web Speech API.
 */

const TTS = {

  /**
   * Přečte předaný text nahlas pomocí Web Speech API.
   * Pokusí se najít hlas odpovídající zadanému jazyku.
   * @param {string} text Text, který se má přečíst.
   * @param {string} lang Kód jazyka (např. "en-US", "cs-CZ").
   * @returns {void}
   */
  speak(text, lang) {
    if (!text) return;

    // Prohlížeč musí podporovat čtení nahlas
    if (!window.speechSynthesis) {
      console.log("Tento prohlížeč nepodporuje hlasové čtení.");
      return;
    }

    let slovo = text.trim();
    if (slovo === "") return;

    let synth = window.speechSynthesis;

    // Zastavíme, pokud ještě něco hraje
    synth.cancel();

    let utterance = new SpeechSynthesisUtterance(slovo);
    utterance.lang = lang || "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Zkusíme najít správný hlas pro daný jazyk
    let hlasy = synth.getVoices();

    if (hlasy.length > 0) {
      let hledanyJazyk = utterance.lang.toLowerCase();
      let nalezenyHlas = null;

      // Nejprve hledáme přesnou shodu (např. "en-US")
      for (let i = 0; i < hlasy.length; i++) {
        if ((hlasy[i].lang || "").toLowerCase() === hledanyJazyk) {
          nalezenyHlas = hlasy[i];
          break;
        }
      }

      // Pokud přesnou shodu nenajdeme, bereme aspoň stejný jazyk (např. "en")
      if (!nalezenyHlas) {
        let zakladJazyka = hledanyJazyk.split("-")[0];
        for (let i = 0; i < hlasy.length; i++) {
          if ((hlasy[i].lang || "").toLowerCase().indexOf(zakladJazyka) === 0) {
            nalezenyHlas = hlasy[i];
            break;
          }
        }
      }

      if (nalezenyHlas) {
        utterance.voice = nalezenyHlas;
      }
    }

    // Přehrajeme slovo
    try {
      synth.speak(utterance);
    } catch (chyba) {
      console.error("Chyba při přehrávání:", chyba);
    }
  }
};
