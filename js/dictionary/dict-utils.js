/**
 * MODUL: DICTIONARY UTILS
 * Pomocné funkce pro slovník - zvuky, výslovnost.
 */

const DictUtils = {

  /**
   * Vygeneruje a přehraje zvuk pípnutí při přidání/odebrání z oblíbených.
   * Kontroluje, zda je zvuk v nastavení povolen.
   * @param {boolean} isPositive True pro vysoký tón (přidání), false pro nízký (odebrání).
   * @param {Object} settings Aktuální nastavení aplikace.
   * @returns {void}
   */
  playToggleSound(isPositive, settings) {
    if (!settings || !settings.notifySound) return;

    try {
      let ctx = new AudioContext();
      let oscillator = ctx.createOscillator();
      let gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'sine';
      gain.gain.value = 0.08;

      // Vysoké pípnutí pro přidání, nižší pro odebrání
      if (isPositive) {
        oscillator.frequency.value = 880;
      } else {
        oscillator.frequency.value = 440;
      }

      oscillator.start();

      setTimeout(function() {
        oscillator.stop();
        ctx.close();
      }, 150);

    } catch (e) {
      console.error("Chyba zvuku:", e);
    }
  },

  /**
   * Přečte předané slovo nahlas pomocí hlasové syntézy prohlížeče.
   * @param {string} word Text k přečtení.
   * @param {string} lang Jazykový kód (např. "en-US").
   * @returns {void}
   */
  speakWord(word, lang) {
    try {
      if (!word || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      let u = new SpeechSynthesisUtterance(word);
      u.lang = lang || 'en-US';
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error("Chyba výslovnosti:", e);
    }
  }
};
