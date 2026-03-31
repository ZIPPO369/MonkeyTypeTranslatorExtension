/**
 * MODUL: LOGIKA SLOVNÍKU (DICTIONARY MAIN)
 * Hlavní vstupní bod pro stránku slovníku.
 */

const DictionaryMain = {
  dictionary: {},
  seznamSlov: [],
  zobrazenyPocet: 0,
  velikostDavky: 30,
  clearModal: null,
  clearModalKeydown: null,
  settings: null,

  /**
   * Inicializuje stránku slovníku.
   * Načte překlady, nastavení, téma a samotná data slovníku.
   * @returns {Promise<void>}
   */
  async init() {
    // Načteme jazykové překlady a nastavení
    await I18n.init();
    I18n.translatePage();
    document.title = I18n.t('ext.dict.title');

    this.settings = await Storage.getSettings();
    await DictUI.applyTheme(this.settings.theme);
    document.body.classList.add('is-ready');

    // Načtení dat a první vykreslení
    this.dictionary = await Storage.getDictionary();
    this.filtrujASetrid();
    this.vykresliPrvniDavku();
    this.nastavUdalosti();
    DictUI.updateStats(this.dictionary);
  },

  /**
   * Filtruje slova podle typu (všechna/uložená) a řadí je podle zvoleného kritéria (nejnovější, nejčastější, atd.).
   * @returns {void}
   */
  filtrujASetrid() {
    let filterType = document.getElementById('filter-type').value;
    let sortType = document.getElementById('sort-type').value;

    // Sesbíráme slova do pole
    this.seznamSlov = [];
    for (let slovo in this.dictionary) {
      if (filterType === 'saved') {
        // Filtr: pouze uložená (s hvězdičkou)
        if (this.dictionary[slovo].saved === true) {
          this.seznamSlov.push(slovo);
        }
      } else {
        this.seznamSlov.push(slovo);
      }
    }

    // Seřadíme podle zvoleného způsobu
    let dict = this.dictionary;
    if (sortType === 'newest') {
      this.seznamSlov.sort(function(a, b) {
        return dict[b].added.localeCompare(dict[a].added);
      });
    } else if (sortType === 'oldest') {
      this.seznamSlov.sort(function(a, b) {
        return dict[a].added.localeCompare(dict[b].added);
      });
    } else if (sortType === 'most_frequent') {
      this.seznamSlov.sort(function(a, b) {
        return dict[b].count - dict[a].count;
      });
    } else if (sortType === 'alphabetical') {
      this.seznamSlov.sort(function(a, b) {
        return a.localeCompare(b);
      });
    }

    this.zobrazenyPocet = 0;
    document.getElementById('dict-body').innerHTML = '';
  },

  /**
   * Vykreslí prvních X slov (definováno ve velikostDavky) do tabulky.
   * @returns {void}
   */
  vykresliPrvniDavku() {
    this.vykresliDalsiDavku();
  },

  /**
   * Přidá další várku slov do tabulky (lazy loading).
   * @returns {void}
   */
  vykresliDalsiDavku() {
    let tbody = document.getElementById('dict-body');
    let konec = this.zobrazenyPocet + this.velikostDavky;

    if (konec > this.seznamSlov.length) {
      konec = this.seznamSlov.length;
    }

    for (let i = this.zobrazenyPocet; i < konec; i++) {
      let slovo = this.seznamSlov[i];
      let entry = this.dictionary[slovo];
      tbody.appendChild(DictUI.createRow(slovo, entry));
    }

    this.zobrazenyPocet = konec;
    DictUI.updateLoadMoreVisibility(this.zobrazenyPocet, this.seznamSlov.length);
  },

  /**
   * Vytvoří a připraví HTML strukturu modálního okna pro hromadné mazání slovníku.
   * @returns {void}
   */
  vytvorModalMazani() {
    if (this.clearModal) return;

    let overlay = document.createElement('div');
    overlay.id = 'mt-clear-modal';
    overlay.className = 'mt-modal-overlay';

    overlay.innerHTML =
      '<div class="mt-modal" role="dialog">' +
        '<div class="mt-modal-title">' + I18n.t('ext.dict.clearDialog.title') + '</div>' +
        '<div class="mt-modal-actions">' +
          '<button class="mt-modal-btn is-danger" data-action="all">' + I18n.t('ext.dict.clearDialog.all') + '</button>' +
          '<button class="mt-modal-btn is-danger" data-action="except_saved">' + I18n.t('ext.dict.clearDialog.exceptSaved') + '</button>' +
          '<button class="mt-modal-btn is-danger" data-action="saved_only">' + I18n.t('ext.dict.clearDialog.savedOnly') + '</button>' +
          '<button class="mt-modal-btn" data-action="cancel">' + I18n.t('ext.common.cancel') + '</button>' +
        '</div>' +
      '</div>';

    let self = this;
    overlay.onclick = async function(e) {
      // Kliknutí mimo modal = zavřít
      if (e.target === overlay) {
        self.zavriModal();
        return;
      }

      let btn = e.target.closest('.mt-modal-btn');
      if (!btn) return;

      let akce = btn.dataset.action;
      if (!akce || akce === 'cancel') {
        self.zavriModal();
        return;
      }

      self.zavriModal();

      // Potvrzení smazání
      let potvrzujiciTexty = {
        'all': 'ext.dict.clear.confirmAll',
        'except_saved': 'ext.dict.clear.confirmExceptSaved',
        'saved_only': 'ext.dict.clear.confirmSavedOnly'
      };

      let textKlice = potvrzujiciTexty[akce];
      if (!confirm(I18n.t(textKlice))) return;

      if (akce === 'all') {
        await Storage.clearDictionary();
      } else if (akce === 'except_saved') {
        await Storage.clearDictionaryExceptSaved();
      } else if (akce === 'saved_only') {
        await Storage.clearSavedOnly();
      }

      window.location.reload();
    };

    document.body.appendChild(overlay);
    this.clearModal = overlay;

    this.clearModalKeydown = function(e) {
      if (e.key === 'Escape') {
        self.zavriModal();
      }
    };
  },

  /**
   * Zobrazí modální okno pro mazání a přidá posluchač na klávesu Escape.
   * @returns {void}
   */
  otevriModal() {
    this.vytvorModalMazani();
    this.clearModal.style.display = 'flex';
    document.addEventListener('keydown', this.clearModalKeydown);
  },

  /**
   * Skryje modální okno a odstraní posluchač klávesnice.
   * @returns {void}
   */
  zavriModal() {
    if (this.clearModal) {
      this.clearModal.style.display = 'none';
      document.removeEventListener('keydown', this.clearModalKeydown);
    }
  },

  /**
   * Nastaví všechny interakce na stránce (změna filtrů, tlačítka v tabulce, mazání).
   * @returns {void}
   */
  nastavUdalosti() {
    let self = this;

    // Změna filtru
    document.getElementById('filter-type').onchange = function() {
      self.filtrujASetrid();
      self.vykresliPrvniDavku();
      DictUI.updateStats(self.dictionary);
    };

    // Změna řazení
    document.getElementById('sort-type').onchange = function() {
      self.filtrujASetrid();
      self.vykresliPrvniDavku();
    };

    // Tlačítko "Načíst další"
    document.getElementById('load-more-btn').onclick = function() {
      self.vykresliDalsiDavku();
    };

    // Tlačítko "Smazat vše"
    document.getElementById('clear-dict-btn').onclick = function() {
      self.otevriModal();
    };

    // Kliknutí v tabulce
    document.getElementById('dict-body').onclick = async function(e) {

      // 1. Kliknutí na hvězdičku
      let favBtn = e.target.closest('.btn-fav');
      if (favBtn) {
        let word = favBtn.dataset.word;
        if (!word) return;

        let entry = await Storage.toggleSavedState(word);
        if (self.dictionary[word]) {
          self.dictionary[word].saved = entry.saved;
        }
        DictUtils.playToggleSound(entry.saved, self.settings);

        let filterType = document.getElementById('filter-type').value;
        if (filterType === 'saved' && !entry.saved) {
          // Odebrali jsme z oblíbených a jsme ve filtru "Pouze oblíbená" - smažeme řádek
          let radek = favBtn.closest('tr');
          if (radek) radek.remove();

          // Odstraníme slovo ze seznamu
          let novySeznam = [];
          for (let i = 0; i < self.seznamSlov.length; i++) {
            if (self.seznamSlov[i] !== word) {
              novySeznam.push(self.seznamSlov[i]);
            }
          }
          self.seznamSlov = novySeznam;
          self.zobrazenyPocet = Math.max(0, self.zobrazenyPocet - 1);

          // Doplníme další slovo
          let dalsiSlovo = self.seznamSlov[self.zobrazenyPocet];
          if (dalsiSlovo) {
            document.getElementById('dict-body').appendChild(
              DictUI.createRow(dalsiSlovo, self.dictionary[dalsiSlovo])
            );
            self.zobrazenyPocet += 1;
          }
        } else {
          // Aktualizujeme ikonu
          let iconName = entry.saved ? 'saved.svg' : 'save.svg';
          let url = chrome.runtime.getURL('icons/' + iconName);

          if (entry.saved) {
            favBtn.classList.add('is-saved');
          } else {
            favBtn.classList.remove('is-saved');
          }

          if (entry.saved) {
            favBtn.title = I18n.t('ext.dict.fav.remove');
          } else {
            favBtn.title = I18n.t('ext.dict.fav.add');
          }

          favBtn.innerHTML = '<span class="icon-mask icon-accent" style="--icon:url(\'' + url + '\')"></span>';
        }

        DictUI.updateStats(self.dictionary);
        DictUI.updateLoadMoreVisibility(self.zobrazenyPocet, self.seznamSlov.length);
        return;
      }

      // 2. Kliknutí na smazat
      let delBtn = e.target.closest('.btn-delete');
      if (delBtn) {
        let word = delBtn.dataset.word;
        if (!word) return;
        if (!confirm('Smazat "' + word + '"?')) return;

        let dict = await Storage.getDictionary();
        delete dict[word];
        await Storage.setDictionary(dict);
        delete self.dictionary[word];

        let radek = delBtn.closest('tr');
        if (radek) radek.remove();

        let novySeznam = [];
        for (let i = 0; i < self.seznamSlov.length; i++) {
          if (self.seznamSlov[i] !== word) {
            novySeznam.push(self.seznamSlov[i]);
          }
        }
        self.seznamSlov = novySeznam;
        self.zobrazenyPocet = Math.max(0, self.zobrazenyPocet - 1);
        DictUI.updateStats(self.dictionary);
        DictUI.updateLoadMoreVisibility(self.zobrazenyPocet, self.seznamSlov.length);
        return;
      }

      // 3. Kliknutí na slovo (výslovnost)
      let wordCell = e.target.closest('.word-cell');
      if (wordCell) {
        let radek = wordCell.closest('tr');
        if (radek) {
          let word = radek.dataset.word;
          if (word) {
            let entry = self.dictionary[word];
            let jazyk = 'en-US';
            if (entry) jazyk = entry.sl;
            DictUtils.speakWord(word, jazyk);
          }
        }
      }
    };
  }
};

// Spuštění po načtení
DictionaryMain.init();
