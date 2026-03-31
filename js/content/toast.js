/**
 * MODUL: TOAST OZNÁMENÍ
 * Zobrazuje krátké zprávy na obrazovce (např. "Slovo uloženo!").
 */

const Toast = {
  aktivniToast: null,

  /**
   * Zobrazí vizuální oznámení (toast) a případně přehraje zvuk.
   * @param {string} message Text zprávy k zobrazení.
   * @param {boolean} isPositive True pro pozitivní akci (zelený okraj), false pro negativní (červený).
   * @param {Object} settings Aktuální nastavení uživatele (pro kontrolu zvuku a vizuálu).
   * @returns {void}
   */
  show(message, isPositive, settings) {

    // Přehrajeme pípnutí, pokud je zvuk zapnutý
    if (settings.notifySound) {
      this.pip(isPositive);
    }

    // Pokud je vizuální oznámení vypnuté, skončíme
    if (!settings.notifyVisual) return;

    // Starý toast odstraníme, pokud ještě existuje
    if (this.aktivniToast) {
      this.aktivniToast.remove();
      this.aktivniToast = null;
    }

    // Vytvoříme nový toast element
    let toast = document.createElement("div");
    toast.className = "mt-toast mt-ui-element";
    toast.textContent = message;

    // Zelená barva pro přidání, červená pro odebrání
    if (isPositive) {
      toast.style.borderColor = "#4caf50";
      toast.style.boxShadow = "0 8px 32px rgba(76, 175, 80, 0.3)";
    } else {
      toast.style.borderColor = "#ff5252";
      toast.style.boxShadow = "0 8px 32px rgba(255, 82, 82, 0.3)";
    }

    document.body.appendChild(toast);
    this.aktivniToast = toast;

    // Po 2.5 sekundách toast zmizí
    let self = this;
    setTimeout(function () {
      if (self.aktivniToast === toast) {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";

        // Po dokončení animace ho úplně smažeme
        setTimeout(function () {
          if (self.aktivniToast === toast) {
            toast.remove();
            self.aktivniToast = null;
          }
        }, 400);
      }
    }, 2500);
  },

  /**
   * Vygeneruje a přehraje krátký zvukový signál (pípnutí).
   * @param {boolean} isPositive True pro vyšší tón, false pro nižší tón.
   * @returns {void}
   */
  pip(isPositive) {
    try {
      let ctx = new AudioContext();
      let oscillator = ctx.createOscillator();
      let gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      // Typ zvuku a hlasitost
      oscillator.type = "sine";
      gain.gain.value = 0.08;

      // Vysoké pípnutí pro přidání, nižší pro odebrání
      if (isPositive) {
        oscillator.frequency.value = 880;
      } else {
        oscillator.frequency.value = 440;
      }

      // Přehrajeme 150 ms
      oscillator.start();
      setTimeout(function () {
        oscillator.stop();
        ctx.close();
      }, 150);

    } catch (e) {
      console.error("Chyba zvuku:", e);
    }
  }
};
