const Observer = {
  posledniSlovo: "",
  callbackFunkce: null,

  /**
   * Spustí sledování testu na stránce.
   * Přidá posluchač na klávesu Space a začne hledat nová slova.
   * @param {Function} callback Funkce, která se zavolá při nalezení nového slova.
   * @returns {void}
   */
  start(callback) {
    this.callbackFunkce = callback;
    let kontejner = document.getElementById('words');

    if (!kontejner) {
      let self = this;
      setTimeout(function() {
        self.start(callback);
      }, 1000);
      return;
    }
    let self = this;
    document.addEventListener('keyup', function(udalost) {
      if (udalost.code === 'Space') {
          self.najdiNoveSlovo();
      }
    });

    this.najdiNoveSlovo();
  },

  /**
   * Najde aktuálně aktivní slovo v testu, poskládá ho z písmen a zavolá callback.
   * @returns {void}
   */
  najdiNoveSlovo() {
    let aktivniElement = document.querySelector('.word.active');
    
    if (!aktivniElement) {
        return;
    }

    let pismena = aktivniElement.querySelectorAll('letter:not(.extra)');
    let slovo = "";

    for (let i = 0; i < pismena.length; i++) {
        slovo += pismena[i].textContent;
    }

    slovo = slovo.toLowerCase().trim();

    if (slovo !== "" && slovo !== this.posledniSlovo && this.callbackFunkce !== null) {
        this.posledniSlovo = slovo;
        this.callbackFunkce(slovo, this.ziskejOkolniSlova()); 
    }
  },

  /**
   * Získá text okolních slov (kontext) pro lepší detekci jazyka.
   * @returns {string} Řetězec obsahující prvních 10 slov testu.
   */
  ziskejOkolniSlova() {
    let kontext = "";
    let vsechnaSlova = document.querySelectorAll('.word');
    
    let pocetSlov = 10;
    if (vsechnaSlova.length < 10) {
        pocetSlov = vsechnaSlova.length;
    }

    for (let i = 0; i < pocetSlov; i++) {
        let pismena = vsechnaSlova[i].querySelectorAll('letter:not(.extra)');
        for (let j = 0; j < pismena.length; j++) {
            kontext += pismena[j].textContent;
        }
        kontext += " ";
    }

    return kontext.trim();
  },

  /**
   * Zastaví sledování a odstraní callback funkci.
   * @returns {void}
   */
  stop() {
    this.callbackFunkce = null;
  }
};