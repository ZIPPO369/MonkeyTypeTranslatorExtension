/**
 * MODUL: POPUP UI (LOGIKA NASTAVENÍ)
 * Ovládá přepínání stránek v popupu a ukládání nastavení.
 */

document.addEventListener('DOMContentLoaded', async function() {
  await I18n.init();

  let VYCHOZI_ZKRATKY = {
    openDict: 'Ctrl+Shift+D',
    saveWord: 'Ctrl+Shift+S',
    tts: 'Ctrl+Shift+E'
  };

  let settings = await Storage.getSettings();

  // Stránky popupu
  let pageMain = document.getElementById('page-main');
  let pageMore = document.getElementById('page-more');

  // Ovládací prvky
  let targetLangEl = document.getElementById('target-lang');
  let appLangEl = document.getElementById('app-lang');
  let themeEl = document.getElementById('theme');
  let modeEl = document.getElementById('mode');
  let notifyVisualEl = document.getElementById('notify-visual');
  let notifySoundEl = document.getElementById('notify-sound');
  let shortcutDictEl = document.getElementById('shortcut-dict');
  let shortcutSaveEl = document.getElementById('shortcut-save');
  let shortcutTtsEl = document.getElementById('shortcut-tts');
  let resetShortcutsEl = document.getElementById('reset-shortcuts');
  let btnMoreEl = document.getElementById('btn-more');
  let btnBackEl = document.getElementById('btn-back');
  let openMtBtnEl = document.getElementById('open-mt-btn');
  let openDictBtnEl = document.getElementById('open-dict-btn');

  // Naplníme seznam jazyků
  naplnJazyky(targetLangEl);

  // Nastavíme výchozí hodnoty z uloženého nastavení
  targetLangEl.value = settings.targetLang;
  appLangEl.value = settings.appLang;
  themeEl.value = settings.theme;
  modeEl.value = settings.mode;
  notifyVisualEl.checked = settings.notifyVisual;
  notifySoundEl.checked = settings.notifySound;
  shortcutDictEl.value = settings.shortcuts.openDict || VYCHOZI_ZKRATKY.openDict;
  shortcutSaveEl.value = settings.shortcuts.saveWord || VYCHOZI_ZKRATKY.saveWord;
  shortcutTtsEl.value = settings.shortcuts.tts || VYCHOZI_ZKRATKY.tts;

  I18n.currentLang = settings.appLang || 'cs';
  I18n.translatePage();
  await applyPopupTheme(settings.theme);
  document.body.classList.add('is-ready');

  // Přepínání stránek
  btnMoreEl.onclick = function() {
    pageMain.classList.remove('active');
    pageMore.classList.add('active');
  };

  btnBackEl.onclick = function() {
    pageMore.classList.remove('active');
    pageMain.classList.add('active');
  };

  openMtBtnEl.onclick = function() {
    window.open('https://monkeytype.com');
  };

  openDictBtnEl.onclick = function() {
    window.open('dictionary.html');
  };

  // Nastavíme nahrávání zkratek
  nastavZahyceniZkratky(shortcutDictEl);
  nastavZahyceniZkratky(shortcutSaveEl);
  nastavZahyceniZkratky(shortcutTtsEl);

  // Reset zkratek
  resetShortcutsEl.onclick = async function() {
    shortcutDictEl.value = VYCHOZI_ZKRATKY.openDict;
    shortcutSaveEl.value = VYCHOZI_ZKRATKY.saveWord;
    shortcutTtsEl.value = VYCHOZI_ZKRATKY.tts;
    await ulozNastaveni();
  };

  // Automatické ukládání při jakékoliv změně
  let casovacUkladani = null;

  /**
   * Naplánuje uložení nastavení s malým zpožděním (debounce).
   * @returns {void}
   */
  function naplanovejUlozeni() {
    if (casovacUkladani) clearTimeout(casovacUkladani);
    casovacUkladani = setTimeout(function() {
      ulozNastaveni();
    }, 120);
  }

  // Navěsíme události na všechny ovládací prvky
  let vsechnyPrvky = [
    targetLangEl, appLangEl, themeEl, modeEl,
    notifyVisualEl, notifySoundEl,
    shortcutDictEl, shortcutSaveEl, shortcutTtsEl
  ];

  for (let i = 0; i < vsechnyPrvky.length; i++) {
    vsechnyPrvky[i].addEventListener('change', naplanovejUlozeni);
    vsechnyPrvky[i].addEventListener('input', naplanovejUlozeni);
  }

  /**
   * Přečte hodnoty ze všech ovládacích prvků v popupu a uloží je do chrome.storage.local.
   * Aktualizuje také jazyk UI a téma popupu.
   * @returns {Promise<void>}
   */
  async function ulozNastaveni() {
    let noveNastaveni = {
      targetLang: targetLangEl.value,
      appLang: appLangEl.value,
      theme: themeEl.value || settings.theme,
      mode: modeEl.value,
      notifyVisual: notifyVisualEl.checked,
      notifySound: notifySoundEl.checked,
      shortcuts: {
        openDict: shortcutDictEl.value || VYCHOZI_ZKRATKY.openDict,
        saveWord: shortcutSaveEl.value || VYCHOZI_ZKRATKY.saveWord,
        tts: shortcutTtsEl.value || VYCHOZI_ZKRATKY.tts
      }
    };

    await Storage.saveSettings(noveNastaveni);

    I18n.currentLang = noveNastaveni.appLang;
    I18n.translatePage();
    await applyPopupTheme(noveNastaveni.theme);

    // Aktualizujeme lokální kopii nastavení
    settings.targetLang = noveNastaveni.targetLang;
    settings.appLang = noveNastaveni.appLang;
    settings.theme = noveNastaveni.theme;
    settings.mode = noveNastaveni.mode;
    settings.notifyVisual = noveNastaveni.notifyVisual;
    settings.notifySound = noveNastaveni.notifySound;
  }

  /**
   * Naplní rozbalovací seznam (select) dostupnými cílovými jazyky z TARGET_LANGUAGES.
   * @param {HTMLSelectElement} selectEl Element select, který se má naplnit.
   * @returns {void}
   */
  function naplnJazyky(selectEl) {
    selectEl.innerHTML = '';
    for (let i = 0; i < TARGET_LANGUAGES.length; i++) {
      let option = document.createElement('option');
      option.value = TARGET_LANGUAGES[i].code;
      option.textContent = TARGET_LANGUAGES[i].name;
      selectEl.appendChild(option);
    }
  }

  /**
   * Nastaví zachytávání klávesových zkratek pro zadaný vstupní prvek (input).
   * Po stisknutí kombinace kláves (např. Ctrl+Shift+S) ji zapíše do inputu.
   * @param {HTMLInputElement} input Element input, ve kterém se má zkratka zobrazit.
   * @returns {void}
   */
  function nastavZahyceniZkratky(input) {
    input.addEventListener('keydown', function(e) {
      e.preventDefault();

      let klavesy = [];
      if (e.ctrlKey) klavesy.push('Ctrl');
      if (e.shiftKey) klavesy.push('Shift');
      if (e.altKey) klavesy.push('Alt');

      // Přidáme písmeno nebo číslo
      if (e.code.indexOf('Key') === 0) {
        klavesy.push(e.code.replace('Key', ''));
      } else if (e.code.indexOf('Digit') === 0) {
        klavesy.push(e.code.replace('Digit', ''));
      } else {
        return;
      }

      input.value = klavesy.join('+');
      input.dispatchEvent(new Event('change'));
    });
  }
});
