/**
 * MODUL: INTERNACIONALIZACE (I18N)
 * Překlady textů v uživatelském rozhraní.
 */

const I18n = {
  messages: null,
  currentLang: 'cs',

  /**
   * Inicializuje modul i18n.
   * Načte soubor s překlady (JSON) a aktuální jazyk aplikace z nastavení.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      let url = chrome.runtime.getURL('json/i18n-messages.json');
      let response = await fetch(url);
      this.messages = await response.json();

      let settings = await Storage.getSettings();
      this.currentLang = settings.appLang || 'cs';
    } catch (error) {
      console.error("Chyba při načítání i18n:", error);
    }
  },

  /**
   * Vrátí přeložený text pro daný klíč v aktuálním jazyce.
   * Podporuje nahrazování proměnných ve formátu {nazev}.
   * @param {string} key Klíč překladu z JSON souboru.
   * @param {Object} [variables] Volitelný objekt s proměnnými pro nahrazení v textu.
   * @returns {string} Přeložený text nebo samotný klíč, pokud překlad neexistuje.
   */
  t(key, variables) {
    if (!this.messages || !this.messages[this.currentLang]) return key;

    let message = this.messages[this.currentLang][key] || key;

    // Nahrazení proměnných v textu (např. {total})
    if (variables) {
      for (let nazev in variables) {
        message = message.replace('{' + nazev + '}', variables[nazev]);
      }
    }

    return message;
  },

  /**
   * Projde celou stránku a přeloží všechny elementy s atributy data-i18n a data-i18n-placeholder.
   * @returns {void}
   */
  translatePage() {
    let elements = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < elements.length; i++) {
      let key = elements[i].getAttribute('data-i18n');
      elements[i].textContent = this.t(key);
    }

    let placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (let i = 0; i < placeholders.length; i++) {
      let key = placeholders[i].getAttribute('data-i18n-placeholder');
      placeholders[i].placeholder = this.t(key);
    }
  }
};
