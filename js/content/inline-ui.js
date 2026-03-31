/**
 * MODUL: UI INLINE (PŘEKLAD NAD SLOVEM)
 * Zobrazuje překlad přímo nad aktivním slovem v testu Monkeytype.
 */

const InlineUI = {
  bubble: null,

  /**
   * Vytvoří HTML strukturu pro inline bublinu, pokud ještě neexistuje.
   * Přidá ji do těla dokumentu (body).
   * @returns {void}
   */
  create() {
    let existujici = document.getElementById('mt-inline-bubble');
    if (existujici) {
      this.bubble = existujici;
      return;
    }

    this.bubble = document.createElement('div');
    this.bubble.id = 'mt-inline-bubble';
    this.bubble.className = 'mt-ui-element mt-hidden';
    this.bubble.innerHTML = '<div class="mt-trans-inline">...</div>';

    document.body.appendChild(this.bubble);
  },

  /**
   * Aktualizuje text překladu v bublině a přepočítá její pozici nad aktivním slovem.
   * @param {string} transText Přeložený text, který se má zobrazit.
   * @returns {void}
   */
  update(transText) {
    if (!this.bubble) return;

    // Pokud je stránka mimo fokus, nebudeme zobrazovat
    if (typeof MainContent !== 'undefined' && MainContent.isOutOfFocus && MainContent.isOutOfFocus()) {
      this.hide();
      return;
    }

    let aktivniSlovo = document.querySelector('#words .word.active');

    if (aktivniSlovo) {
      let pozice = aktivniSlovo.getBoundingClientRect();
      this.bubble.querySelector('.mt-trans-inline').textContent = transText;
      this.bubble.classList.remove('mt-hidden');

      let bublinaPozice = this.bubble.getBoundingClientRect();

      // Umístíme bublinu nad aktivní slovo
      let top = pozice.top + window.scrollY - bublinaPozice.height - 5;
      let left = pozice.left + window.scrollX + (pozice.width / 2) - (bublinaPozice.width / 2);

      this.bubble.style.top = top + 'px';
      this.bubble.style.left = left + 'px';
    } else {
      this.hide();
    }
  },

  /**
   * Skryje inline bublinu přidáním CSS třídy mt-hidden.
   * @returns {void}
   */
  hide() {
    if (this.bubble) {
      this.bubble.classList.add('mt-hidden');
    }
  }
};
