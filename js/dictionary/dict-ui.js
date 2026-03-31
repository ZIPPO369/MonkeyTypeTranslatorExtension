/**
 * MODUL: DICTIONARY UI
 * Vykreslování tabulky, řádků, statistik a témat ve slovníku.
 */

const DictUI = {

  /**
   * Vytvoří a vrátí HTML element řádku tabulky (tr) pro konkrétní slovo.
   * Obsahuje tlačítka pro oblíbené, samotné slovo, překlad, počet zobrazení a tlačítko smazat.
   * @param {string} wordKey Originální slovo.
   * @param {Object} entry Objekt s daty o slově (překlad, počet, stav uložení).
   * @returns {HTMLTableRowElement} Vytvořený řádek tabulky.
   */
  createRow(wordKey, entry) {
    let row = document.createElement('tr');
    row.dataset.word = wordKey;

    let favIconName = 'save.svg';
    if (entry.saved) {
      favIconName = 'saved.svg';
    }

    let favIconUrl = chrome.runtime.getURL('icons/' + favIconName);
    let delIconUrl = chrome.runtime.getURL('icons/delete.svg');

    let favTitle;
    if (entry.saved) {
      favTitle = I18n.t('ext.dict.fav.remove');
    } else {
      favTitle = I18n.t('ext.dict.fav.add');
    }

    let savedClass = '';
    if (entry.saved) {
      savedClass = 'is-saved';
    }

    row.innerHTML =
      '<td>' +
        '<button class="btn-fav ' + savedClass + '" data-word="' + wordKey + '" title="' + favTitle + '">' +
          '<span class="icon-mask icon-accent" style="--icon:url(\'' + favIconUrl + '\')"></span>' +
        '</button>' +
      '</td>' +
      '<td class="word-cell"><strong>' + wordKey + '</strong></td>' +
      '<td class="trans-cell">' + entry.trans + '</td>' +
      '<td><span class="count-badge">' + entry.count + 'x</span></td>' +
      '<td>' +
        '<button class="btn-delete" data-word="' + wordKey + '" title="Smazat">' +
          '<span class="icon-mask icon-danger" style="--icon:url(\'' + delIconUrl + '\')"></span>' +
        '</button>' +
      '</td>';

    return row;
  },

  /**
   * Spočítá celkový počet slov a počet uložených slov a aktualizuje text statistik na stránce.
   * @param {Object} dictionary Objekt s daty slovníku.
   * @returns {void}
   */
  updateStats(dictionary) {
    let celkem = 0;
    let ulozena = 0;

    for (let slovo in dictionary) {
      celkem++;
      if (dictionary[slovo].saved) {
        ulozena++;
      }
    }

    let statsEl = document.getElementById('stats-text');
    if (statsEl) {
      statsEl.textContent = I18n.t('ext.dict.stats', {total: celkem, saved: ulozena});
    }
  },

  /**
   * Rozhoduje o viditelnosti tlačítka "Načíst další" podle toho, zda jsou již všechna slova zobrazena.
   * @param {number} displayedCount Počet aktuálně zobrazených slov.
   * @param {number} totalCount Celkový počet slov k zobrazení.
   * @returns {void}
   */
  updateLoadMoreVisibility(displayedCount, totalCount) {
    let loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      if (displayedCount >= totalCount) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'inline-block';
      }
    }
  },

  /**
   * Aplikuje zvolené barevné téma na stránku slovníku.
   * Pokud je zvoleno "monkeytype", pokusí se načíst barvy ze snímku uloženého ze stránky.
   * @param {string} theme Název tématu.
   * @returns {Promise<void>}
   */
  async applyTheme(theme) {
    let root = document.documentElement;

    // Výchozí barvy
    root.style.setProperty('--mt-bg', '#1a1a2e');
    root.style.setProperty('--mt-bg-darker', '#16213e');
    root.style.setProperty('--mt-fg', '#ffffff');
    root.style.setProperty('--mt-accent', '#64b5f6');
    root.style.setProperty('--mt-on-accent', '#0b0b0b');
    root.style.setProperty('--mt-border', 'rgba(255, 255, 255, 0.15)');
    root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(1)');

    if (theme === 'monkeytype') {
      let snapshot = await Storage.getThemeSnapshot();
      if (snapshot) {
        if (snapshot.bg) root.style.setProperty('--mt-bg', snapshot.bg);
        if (snapshot.bgDarker) root.style.setProperty('--mt-bg-darker', snapshot.bgDarker);
        if (snapshot.fg) root.style.setProperty('--mt-fg', snapshot.fg);
        if (snapshot.accent) root.style.setProperty('--mt-accent', snapshot.accent);
        if (snapshot.onAccent) root.style.setProperty('--mt-on-accent', snapshot.onAccent);
        if (snapshot.border) root.style.setProperty('--mt-border', snapshot.border);
        if (snapshot.iconFilter) root.style.setProperty('--mt-icon-filter', snapshot.iconFilter);
      }
      return;
    }

    // Předdefinovaná témata
    if (theme === 'dark') {
      root.style.setProperty('--mt-bg', '#121212');
      root.style.setProperty('--mt-bg-darker', '#000000');
      root.style.setProperty('--mt-accent', '#bb86fc');

    } else if (theme === 'light') {
      root.style.setProperty('--mt-bg', '#ffffff');
      root.style.setProperty('--mt-bg-darker', '#f5f5f5');
      root.style.setProperty('--mt-fg', '#000000');
      root.style.setProperty('--mt-accent', '#2196f3');
      root.style.setProperty('--mt-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(0)');

    } else if (theme === 'black') {
      root.style.setProperty('--mt-bg', '#000000');
      root.style.setProperty('--mt-bg-darker', '#000000');
      root.style.setProperty('--mt-accent', '#ffffff');

    } else if (theme === 'dark-blue') {
      root.style.setProperty('--mt-bg', '#0d1117');
      root.style.setProperty('--mt-bg-darker', '#010409');
      root.style.setProperty('--mt-accent', '#58a6ff');
    }
  }
};
