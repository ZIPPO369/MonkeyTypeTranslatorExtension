/**
 * MODUL: HLAVNÍ CONTENT SKRIPT
 * Spojuje všechny moduly dohromady a spouští rozšíření na stránce.
 */

const MainContent = {
  settings: null,
  lastWord: "",
  uiEnabled: false,
  pageWatcher: null,
  sessionLang: 'auto',

  /**
   * Hlavní inicializační funkce modulu.
   * Načte nastavení, inicializuje i18n, nastaví téma a spustí sledování stránky.
   * @returns {Promise<void>}
   */
  async init() {
    console.log("Monkeytype Translator (Maturita v2) - Start");

    // 1. Načteme překlady a nastavení
    await I18n.init();
    this.settings = await Storage.getSettings();

    // 2. Nastavíme téma
    if (this.settings.theme === 'monkeytype') {
      await ThemeEngine.syncWithMonkeytype();
      ThemeEngine.startAutoSync();
    } else {
      ThemeEngine.apply(this.settings.theme);
    }

    // 3. Spustíme sledování a zkratky
    this.setupShortcuts();
    this.refreshPageState();
    this.startPageWatcher();

    // 4. Posloucháme změny nastavení (když uživatel změní popup)
    let self = this;
    /**
     * Poslouchá změny nastavení rozšíření a reaguje na ně.
     * @param {object} changes - Objekt obsahující změněné vlastnosti a jejich staré a nové hodnoty.
     * @param {string} area - Oblast úložiště, ve které ke změně došlo (např. 'local', 'sync').
     */
    chrome.storage.onChanged.addListener(async function(changes, area) {
      if (area !== 'local') return;
      if (!changes.settings) return;

      let noveNastaveni = changes.settings.newValue;
      if (!noveNastaveni) return;

      let stareNastaveni = self.settings || {};

      // Zjistíme co se změnilo
      let zmenaTematu = stareNastaveni.theme !== noveNastaveni.theme;
      let zmenaRezimu = stareNastaveni.mode !== noveNastaveni.mode;
      let zmenaJazykaUI = stareNastaveni.appLang !== noveNastaveni.appLang;
      let zmenaJazykuPrekladu = stareNastaveni.targetLang !== noveNastaveni.targetLang;

      // Změna tématu
      if (zmenaTematu) {
        if (noveNastaveni.theme === 'monkeytype') {
          await ThemeEngine.syncWithMonkeytype();
          ThemeEngine.startAutoSync();
        } else {
          ThemeEngine.apply(noveNastaveni.theme);
        }
      }

      // Změna jazyka UI
      if (zmenaJazykaUI) {
        I18n.currentLang = noveNastaveni.appLang;
        self.updateUITranslations();
      }

      self.settings = noveNastaveni;

      // Změna režimu (inline / panel)
      if (zmenaRezimu) {
        self.refreshPageState();
      }

      // Změna cílového jazyka — přeložíme aktuální slovo znovu
      if (zmenaJazykuPrekladu && self.lastWord) {
        self.handleNewWord(self.lastWord, "", true);
      }
    });
  },

  /**
   * Aktualizuje texty v uživatelském rozhraní (panel, mini-slovník) podle aktuálního jazyka.
   * @returns {void}
   */
  updateUITranslations() {
    if (typeof PanelUI !== 'undefined' && PanelUI.panel) {
      PanelUI.saveBtn.title = I18n.t('ext.panel.save');
      PanelUI.ttsBtn.title = I18n.t('ext.panel.tts');
      PanelUI.dictBtn.title = I18n.t('ext.panel.dict');
    }
    if (typeof MiniDict !== 'undefined' && MiniDict.overlay) {
      let header = MiniDict.overlay.querySelector('.mt-mini-header h3');
      if (header) header.textContent = I18n.t('ext.panel.dict');
      let fullBtn = document.getElementById('mt-mini-full-btn');
      if (fullBtn) fullBtn.textContent = I18n.t('popup.dict');
      let favBtns = MiniDict.overlay.querySelectorAll('.mt-mini-fav');
      for (let i = 0; i < favBtns.length; i++) {
        favBtns[i].title = I18n.t('ext.panel.save');
      }
    }
  },

  /**
   * Zkontroluje, zda se uživatel nachází na hlavní stránce s testem psaní.
   * @returns {boolean} True, pokud je na testovací stránce, jinak false.
   */
  isTestPage() {
    let words = document.getElementById('words');
    if (location.pathname === '/' && words) {
      return true;
    }
    return false;
  },

  /**
   * Zkontroluje, zda stránka Monkeytype ztratila fokus (zobrazuje se varování "Out of focus").
   * @returns {boolean} True, pokud je stránka mimo fokus, jinak false.
   */
  isOutOfFocus() {
    let warning = document.querySelector('.outOfFocusWarning');
    if (warning && !warning.classList.contains('hidden')) {
      return true;
    }
    return false;
  },

  /**
   * Rozhoduje o zobrazení nebo skrytí UI prvků (panelu/bubliny) na základě aktuálního stavu stránky.
   * @returns {void}
   */
  refreshPageState() {
    let naTestu = this.isTestPage();
    let bezFokusu = this.isOutOfFocus();

    if (naTestu) {
      // Zapneme sledování slov
      if (!this.uiEnabled) {
        let self = this;
        Observer.start(async function(wordText, context) {
          self.handleNewWord(wordText, context);
        });
        this.uiEnabled = true;
        this.sessionLang = 'auto';
      }

      // Zobrazení/skrytí podle fokusu
      if (bezFokusu) {
        InlineUI.hide();
        PanelUI.hide();
      } else {
        if (this.settings.mode === 'inline') {
          InlineUI.create();
          if (this.lastWord) this.updateUIContent();
          PanelUI.hide();
        } else {
          PanelUI.create();
          if (this.lastWord) this.updateUIContent();
          InlineUI.hide();
        }
      }
      return;
    }

    // Klidový stav — nic nezobrazujeme
    if (this.uiEnabled) {
      Observer.stop();
      InlineUI.hide();
      PanelUI.hide();
      this.lastWord = "";
      this.uiEnabled = false;
      this.sessionLang = 'auto';
    }
  },

  /**
   * Načte data pro poslední zpracované slovo ze slovníku a aktualizuje jimi aktivní UI.
   * @returns {Promise<void>}
   */
  async updateUIContent() {
    if (!this.lastWord || this.isOutOfFocus()) {
      InlineUI.hide();
      PanelUI.hide();
      return;
    }

    let dictionary = await Storage.getDictionary();
    let zaznam = dictionary[this.lastWord.toLowerCase().trim()];

    if (!zaznam) {
      zaznam = {trans: "...", saved: false};
    }

    if (this.settings.mode === 'inline') {
      InlineUI.update(zaznam.trans);
    } else {
      PanelUI.update(this.lastWord, zaznam.trans, zaznam.saved);
    }
  },

  /**
   * Spustí intervalový dohled (watcher), který pravidelně kontroluje stav stránky a fokusu.
   * @returns {void}
   */
  startPageWatcher() {
    if (this.pageWatcher) return;

    let self = this;
    this.pageWatcher = setInterval(function() {
      self.refreshPageState();
    }, 700);
  },

  // Zpracuje nové slovo z testu
  /**
   * Zpracuje nové slovo z testu, přeloží ho a aktualizuje UI.
   * @param {string} wordText - Nově napsané slovo z testu.
   * @param {string} context - Kontext (okolní slova) pro detekci jazyka.
   * @param {boolean} force - Vynutí překlad i když je slovo stejné jako poslední.
   */
  async handleNewWord(wordText, context, force) {
    if (!this.uiEnabled || !wordText) return;
    if (!force && wordText === this.lastWord) return;
    this.lastWord = wordText;

    // Detekce jazyka
    if (this.sessionLang === 'auto' && context) {
      this.sessionLang = await Translator.detectLanguage(context);
    }

    // Dočasný stav "Načítání"
    if (this.settings.mode === 'inline') {
      InlineUI.update("...");
    } else {
      PanelUI.update(wordText, "...", false);
    }

    // Překlad
    let result = await Translator.translate(wordText, this.settings.targetLang, this.sessionLang);
    let entry = await Storage.saveWord(wordText, result.translation, this.sessionLang);

    // Aktualizace UI
    if (!this.isOutOfFocus()) {
      if (this.settings.mode === 'inline') {
        InlineUI.update(result.translation);
      } else {
        PanelUI.update(wordText, result.translation, entry.saved);
      }
    }
  },

  /**
   * Inicializuje posluchače událostí pro klávesové zkratky (slovník, uložení slova, TTS).
   * @returns {void}
   */
  setupShortcuts() {
    let self = this;
    /**
     * Zpracovává události stisku kláves a spouští odpovídající akce (zkratky).
     * @param {KeyboardEvent} e - Objekt události klávesnice.
     */
    window.addEventListener('keydown', async function(e) {
      let stisknute = [];

      if (e.ctrlKey) stisknute.push('Ctrl');
      if (e.shiftKey) stisknute.push('Shift');
      if (e.altKey) stisknute.push('Alt');

      // Zjistíme stisknuté písmeno nebo číslo
      if (e.code.indexOf('Key') === 0) {
        stisknute.push(e.code.replace('Key', ''));
      } else if (e.code.indexOf('Digit') === 0) {
        stisknute.push(e.code.replace('Digit', ''));
      }

      let zkratka = stisknute.join('+');

      // Zkratka pro slovník
      if (zkratka === self.settings.shortcuts.openDict) {
        e.preventDefault();
        if (typeof MiniDict !== 'undefined' && MiniDict) {
          MiniDict.open();
        } else {
          window.open(chrome.runtime.getURL('html/dictionary.html'), '_blank');
        }
      }

      // Zkratka pro uložení/odebrání z oblíbených
      if (zkratka === self.settings.shortcuts.saveWord) {
        e.preventDefault();
        if (self.lastWord) {
          let entry = await Storage.toggleSavedState(self.lastWord);

          let msg;
          if (entry.saved) {
            msg = I18n.t('ext.msg.saved', {word: self.lastWord});
          } else {
            msg = I18n.t('ext.msg.removed', {word: self.lastWord});
          }

          if (!self.isOutOfFocus()) {
            Toast.show(msg, entry.saved, self.settings);
            if (self.settings.mode === 'panel') {
              PanelUI.update(self.lastWord, entry.trans, entry.saved);
            }
          }
        }
      }

      // Zkratka pro výslovnost
      if (zkratka === self.settings.shortcuts.tts) {
        e.preventDefault();
        if (self.lastWord) {
          let dictionary = await Storage.getDictionary();
          let entry = dictionary[self.lastWord.toLowerCase().trim()];
          let jazyk = 'en-US';
          if (entry) jazyk = entry.sl;
          TTS.speak(self.lastWord, jazyk);
        }
      }
    });
  }
};

// Spuštění aplikace
MainContent.init();
