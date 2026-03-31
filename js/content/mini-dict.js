/**
 * MODUL: MINIMALISTICKÝ SLOVNÍK (OVERLAY)
 * Zobrazuje malý přehled slov přímo na stránce.
 */

const MiniDict = {
  overlay: null,
  list: null,

  /**
   * Otevře mini-slovník jako překryvnou vrstvu (overlay) přímo na stránce.
   * Pokud ještě neexistuje, vytvoří ho.
   * @returns {Promise<void>}
   */
  async open() {
    if (!this.overlay) {
      this.create();
    }

    this.render();
    this.overlay.classList.remove('mt-hidden');
  },

  /**
   * Vytvoří HTML strukturu mini-slovníku a nastaví obsluhu událostí pro tlačítka.
   * @returns {void}
   */
  create() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'mt-mini-dict';
    this.overlay.className = 'mt-ui-element mt-hidden';
    this.overlay.innerHTML =
      '<div class="mt-mini-content">' +
        '<div class="mt-mini-header">' +
          '<h3>' + I18n.t('ext.panel.dict') + '</h3>' +
          '<button id="mt-mini-close">✖</button>' +
        '</div>' +
        '<div class="mt-mini-body" id="mt-mini-list"></div>' +
        '<div class="mt-mini-footer">' +
          '<button id="mt-mini-full-btn" class="mt-btn-full">' + I18n.t('popup.dict') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(this.overlay);
    this.list = document.getElementById('mt-mini-list');

    // Kliknutí na hvězdičku (oblíbené)
    let self = this;
    this.list.onclick = async function(e) {
      let btn = e.target.closest('.mt-mini-fav');
      if (!btn) return;

      let word = btn.dataset.word;
      if (!word) return;

      let entry = await Storage.toggleSavedState(word);

      if (entry.saved) {
        btn.classList.add('is-saved');
      } else {
        btn.classList.remove('is-saved');
      }

      let iconUrl = chrome.runtime.getURL('icons/' + (entry.saved ? 'saved.svg' : 'save.svg'));
      btn.innerHTML = '<span class="mt-icon-mask" style="--icon:url(\'' + iconUrl + '\')"></span>';

      // Zobrazení toastu
      let msg;
      if (entry.saved) {
        msg = I18n.t('ext.msg.saved', {word: word});
      } else {
        msg = I18n.t('ext.msg.removed', {word: word});
      }

      if (typeof Toast !== 'undefined' && MainContent.settings) {
        Toast.show(msg, entry.saved, MainContent.settings);
      }

      if (PanelUI.origText && PanelUI.origText.textContent === word) {
        if (entry.saved) {
          PanelUI.saveBtn.classList.add('is-saved');
        } else {
          PanelUI.saveBtn.classList.remove('is-saved');
        }
      }
    };

    document.getElementById('mt-mini-close').onclick = function() {
      self.overlay.classList.add('mt-hidden');
    };

    document.getElementById('mt-mini-full-btn').onclick = function() {
      window.open(chrome.runtime.getURL('html/dictionary.html'), '_blank');
      self.overlay.classList.add('mt-hidden');
    };
  },

  /**
   * Načte posledních 10 slov z úložiště a vykreslí je do seznamu v mini-slovníku.
   * @returns {Promise<void>}
   */
  async render() {
    let dictionary = await Storage.getDictionary();

    // Sesbíráme slova do pole
    let slovaPole = [];
    for (let slovo in dictionary) {
      slovaPole.push({
        word: slovo,
        data: dictionary[slovo]
      });
    }

    // Seřadíme od nejnovějšího
    slovaPole.sort(function(a, b) {
      return b.data.added.localeCompare(a.data.added);
    });

    // Vezmeme jen prvních 10
    if (slovaPole.length > 10) {
      slovaPole = slovaPole.slice(0, 10);
    }

    this.list.innerHTML = '';

    if (slovaPole.length === 0) {
      this.list.innerHTML = '<p style="text-align:center; opacity:0.5;">Zatím žádná slova.</p>';
      return;
    }

    for (let i = 0; i < slovaPole.length; i++) {
      let slovo = slovaPole[i].word;
      let polozka = slovaPole[i].data;

      let item = document.createElement('div');
      item.className = 'mt-mini-item';

      let iconName = polozka.saved ? 'saved.svg' : 'save.svg';
      let favUrl = chrome.runtime.getURL('icons/' + iconName);
      let savedClass = polozka.saved ? 'is-saved' : '';

      item.innerHTML =
        '<div class="mt-mini-word">' +
          '<span class="mt-mini-orig">' + slovo + '</span>' +
          '<span class="mt-mini-trans">' + polozka.trans + '</span>' +
        '</div>' +
        '<button class="mt-mini-fav ' + savedClass + '" data-word="' + slovo + '" title="' + I18n.t('ext.panel.save') + '">' +
          '<span class="mt-icon-mask" style="--icon:url(\'' + favUrl + '\')"></span>' +
        '</button>';

      this.list.appendChild(item);
    }
  }
};
