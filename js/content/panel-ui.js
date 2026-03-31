/**
 * MODUL: UI PANEL (PLOVOUCÍ PANEL)
 * Vytváří a ovládá plovoucí panel s překladem.
 */

const PanelUI = {
  panel: null,
  origText: null,
  transText: null,
  saveBtn: null,
  dictBtn: null,
  ttsBtn: null,
  iconSaveUrl: '',
  iconSavedUrl: '',

  /**
   * Vytvoří HTML strukturu plovoucího panelu, pokud ještě neexistuje.
   * Inicializuje tlačítka, tahání (drag) a změnu velikosti (resize).
   * @returns {void}
   */
  create() {
    let existujici = document.getElementById('mt-floating-panel');
    if (existujici) {
      this.panel = existujici;
      this.origText = document.getElementById('mt-orig-text');
      this.transText = document.getElementById('mt-trans-text');
      this.saveBtn = document.getElementById('mt-save-btn');
      this.ttsBtn = document.getElementById('mt-tts-btn');
      this.dictBtn = document.getElementById('mt-dict-btn');
      return;
    }

    this.panel = document.createElement('div');
    this.panel.id = 'mt-floating-panel';
    this.panel.className = 'mt-ui-element mt-hidden';

    this.iconSaveUrl = chrome.runtime.getURL('icons/save.svg');
    this.iconSavedUrl = chrome.runtime.getURL('icons/saved.svg');
    let iconSave = this.udelejIkonu(this.iconSaveUrl);
    let iconDict = this.udelejIkonu(chrome.runtime.getURL('icons/dictionary.svg'));
    let iconTts = this.udelejIkonu(chrome.runtime.getURL('icons/volume.svg'));

    this.panel.innerHTML =
      '<div class="mt-panel-content">' +
        '<div class="mt-orig" id="mt-orig-text">...</div>' +
        '<div class="mt-trans" id="mt-trans-text">...</div>' +
        '<div class="mt-actions">' +
          '<button id="mt-save-btn" class="mt-btn-icon" title="' + I18n.t('ext.panel.save') + '">' + iconSave + '</button>' +
          '<button id="mt-tts-btn" class="mt-btn-icon" title="' + I18n.t('ext.panel.tts') + '">' + iconTts + '</button>' +
          '<button id="mt-dict-btn" class="mt-btn-icon" title="' + I18n.t('ext.panel.dict') + '">' + iconDict + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="mt-resize-handle"></div>';

    document.body.appendChild(this.panel);

    this.origText = document.getElementById('mt-orig-text');
    this.transText = document.getElementById('mt-trans-text');
    this.saveBtn = document.getElementById('mt-save-btn');
    this.ttsBtn = document.getElementById('mt-tts-btn');
    this.dictBtn = document.getElementById('mt-dict-btn');

    this.nastavTahani();
    this.nastavZmenuVelikosti();
    this.nastavUdalosti();
  },

  /**
   * Aktualizuje obsah panelu (originální slovo, překlad) a stav tlačítka pro uložení.
   * @param {string} orig Originální slovo.
   * @param {string} trans Překlad slova.
   * @param {boolean} isSaved True, pokud je slovo v oblíbených.
   * @returns {void}
   */
  update(orig, trans, isSaved) {
    if (!this.panel) return;

    if (typeof MainContent !== 'undefined' && MainContent.isOutOfFocus && MainContent.isOutOfFocus()) {
      this.hide();
      return;
    }

    this.origText.textContent = orig;
    this.transText.textContent = trans;

    // Změna ikony podle stavu uložení
    if (isSaved) {
      this.saveBtn.classList.add('is-saved');
      this.saveBtn.innerHTML = this.udelejIkonu(this.iconSavedUrl);
    } else {
      this.saveBtn.classList.remove('is-saved');
      this.saveBtn.innerHTML = this.udelejIkonu(this.iconSaveUrl);
    }

    this.panel.classList.remove('mt-hidden');
  },

  /**
   * Skryje plovoucí panel přidáním třídy mt-hidden.
   * @returns {void}
   */
  hide() {
    if (this.panel) {
      this.panel.classList.add('mt-hidden');
    }
  },

  /**
   * Nastaví logiku pro přesouvání (tažení) panelu myší po obrazovce.
   * @returns {void}
   */
  nastavTahani() {
    let panel = this.panel;
    let tahame = false;
    let startX = 0;
    let startY = 0;

    panel.onmousedown = function(e) {
      if (e.target.closest('button') || e.target.classList.contains('mt-resize-handle')) {
        return;
      }

      tahame = true;
      panel.style.transition = 'none';

      let pozice = panel.getBoundingClientRect();
      let stredX = pozice.left + pozice.width / 2;
      let stredY = pozice.top;

      startX = e.clientX - stredX;
      startY = e.clientY - stredY;

      e.preventDefault();
    };

    document.addEventListener('mousemove', function(e) {
      if (!tahame) return;

      panel.style.left = (e.clientX - startX) + 'px';
      panel.style.top = (e.clientY - startY) + 'px';
      panel.style.margin = '0';
    });

    document.addEventListener('mouseup', function() {
      if (tahame) {
        tahame = false;
        panel.style.transition = 'opacity 0.3s ease';
      }
    });
  },

  /**
   * Nastaví logiku pro změnu šířky panelu pomocí táhla v rohu.
   * @returns {void}
   */
  nastavZmenuVelikosti() {
    let panel = this.panel;
    let handle = panel.querySelector('.mt-resize-handle');
    let menitVelikost = false;
    let startSirka = 0;
    let startMysX = 0;

    handle.onmousedown = function(e) {
      menitVelikost = true;
      startSirka = panel.offsetWidth;
      startMysX = e.clientX;
      panel.style.transition = 'none';
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('mousemove', function(e) {
      if (!menitVelikost) return;

      let rozdil = e.clientX - startMysX;
      let novaSirka = startSirka + rozdil * 2;

      // Omezíme minimální a maximální šířku
      if (novaSirka < 150) novaSirka = 150;
      if (novaSirka > 600) novaSirka = 600;

      panel.style.width = novaSirka + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (menitVelikost) {
        menitVelikost = false;
        panel.style.transition = 'opacity 0.3s ease';
      }
    });
  },

  /**
   * Nastaví obsluhu událostí (onclick) pro tlačítka v panelu (uložit, TTS, slovník).
   * @returns {void}
   */
  nastavUdalosti() {
    let self = this;

    this.saveBtn.onclick = async function() {
      let word = self.origText.textContent;
      if (word && word !== '...') {
        let entry = await Storage.toggleSavedState(word);

        if (entry.saved) {
          self.saveBtn.classList.add('is-saved');
          self.saveBtn.innerHTML = self.udelejIkonu(self.iconSavedUrl);
        } else {
          self.saveBtn.classList.remove('is-saved');
          self.saveBtn.innerHTML = self.udelejIkonu(self.iconSaveUrl);
        }

        let msg;
        if (entry.saved) {
          msg = I18n.t('ext.msg.saved', {word: word});
        } else {
          msg = I18n.t('ext.msg.removed', {word: word});
        }
        if (typeof Toast !== 'undefined' && MainContent.settings) {
          Toast.show(msg, entry.saved, MainContent.settings);
        }
      }
    };

    this.ttsBtn.onclick = async function() {
      let word = self.origText.textContent;
      if (word && word !== '...') {
        let dictionary = await Storage.getDictionary();
        let entry = dictionary[word.toLowerCase().trim()];
        let jazyk = 'en-US';
        if (entry) {
          jazyk = entry.sl;
        }
        TTS.speak(word, jazyk);
      }
    };

    this.dictBtn.onclick = function() {
      MiniDict.open();
    };
  },

  /**
   * Pomocná funkce pro vytvoření HTML kódu ikony s maskou pro barvení pomocí CSS.
   * @param {string} url Cesta k SVG ikoně.
   * @returns {string} HTML řetězec s elementem pro ikonu.
   */
  udelejIkonu(url) {
    if (!url) return '';
    return '<span class="mt-icon-mask" style="--icon:url(\'' + url + '\')"></span>';
  }
};
