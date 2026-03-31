/**
 * MODUL: THEME ENGINE (SPRÁVA VZHLEDU)
 * Nastavuje barvy rozšíření podle zvoleného tématu.
 */

const ThemeEngine = {
  autoSyncTimer: null,
  posledniKlic: null,

  /**
   * Nastaví barevné téma aplikace (tmavé, světlé, modré, atd.).
   * @param {string} theme Název tématu, které se má aplikovat.
   * @returns {void}
   */
  apply(theme) {
    let root = document.documentElement;

    this.stopAutoSync();

    if (theme === 'monkeytype') {
      this.startAutoSync();
      return;
    }

    // Výchozí barvy
    root.style.setProperty('--mt-bg', '#1a1a2e');
    root.style.setProperty('--mt-bg-darker', '#16213e');
    root.style.setProperty('--mt-fg', '#ffffff');
    root.style.setProperty('--mt-accent', '#64b5f6');
    root.style.setProperty('--mt-on-accent', '#0b0b0b');
    root.style.setProperty('--mt-border', 'rgba(255, 255, 255, 0.15)');
    root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(1)');

    // Přepíšeme barvy podle zvoleného tématu
    if (theme === 'dark') {
      root.style.setProperty('--mt-bg', '#121212');
      root.style.setProperty('--mt-bg-darker', '#000000');
      root.style.setProperty('--mt-accent', '#bb86fc');
      root.style.setProperty('--mt-on-accent', '#0b0b0b');

    } else if (theme === 'light') {
      root.style.setProperty('--mt-bg', '#ffffff');
      root.style.setProperty('--mt-bg-darker', '#f5f5f5');
      root.style.setProperty('--mt-fg', '#000000');
      root.style.setProperty('--mt-accent', '#2196f3');
      root.style.setProperty('--mt-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--mt-on-accent', '#ffffff');
      root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(0)');

    } else if (theme === 'black') {
      root.style.setProperty('--mt-bg', '#000000');
      root.style.setProperty('--mt-bg-darker', '#000000');
      root.style.setProperty('--mt-accent', '#ffffff');
      root.style.setProperty('--mt-on-accent', '#000000');

    } else if (theme === 'dark-blue') {
      root.style.setProperty('--mt-bg', '#0d1117');
      root.style.setProperty('--mt-bg-darker', '#010409');
      root.style.setProperty('--mt-accent', '#58a6ff');
      root.style.setProperty('--mt-on-accent', '#0b0b0b');
    }
  },

  /**
   * Přečte CSS proměnné přímo ze stránky Monkeytype a nastaví je jako barvy rozšíření.
   * Uloží také "snímek" tématu do úložiště pro ostatní části rozšíření.
   * @returns {Promise<void>}
   */
  async syncWithMonkeytype() {
    let root = document.documentElement;
    let styles = getComputedStyle(document.documentElement);

    let mtBg = styles.getPropertyValue('--bg-color').trim();
    let mtMain = styles.getPropertyValue('--main-color').trim();
    let mtText = styles.getPropertyValue('--sub-color').trim() || styles.getPropertyValue('--text-color').trim();
    let mtBorder = styles.getPropertyValue('--sub-alt-color').trim();

    if (mtBg) root.style.setProperty('--mt-bg', mtBg);
    if (mtMain) root.style.setProperty('--mt-accent', mtMain);
    if (mtText) root.style.setProperty('--mt-fg', mtText);
    if (mtBorder) root.style.setProperty('--mt-border', mtBorder);

    // Zjistíme, jestli je pozadí světlé nebo tmavé
    let jeSvetle = false;
    if (mtBg && mtBg.charAt(0) === '#' && mtBg.length >= 7) {
      let r = parseInt(mtBg.substring(1, 3), 16);
      let g = parseInt(mtBg.substring(3, 5), 16);
      let b = parseInt(mtBg.substring(5, 7), 16);
      let prumer = (r + g + b) / 3;
      jeSvetle = prumer > 128;
    }

    if (jeSvetle) {
      root.style.setProperty('--mt-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--mt-bg-darker', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(0)');
      if (mtMain) root.style.setProperty('--mt-on-accent', '#0b0b0b');
    } else {
      root.style.setProperty('--mt-bg-darker', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(1)');
      if (mtMain) root.style.setProperty('--mt-on-accent', '#ffffff');
    }

    // Uložíme aktuální barvy pro popup a slovník
    let snapshot = {
      bg: getComputedStyle(root).getPropertyValue('--mt-bg').trim(),
      bgDarker: getComputedStyle(root).getPropertyValue('--mt-bg-darker').trim(),
      fg: getComputedStyle(root).getPropertyValue('--mt-fg').trim(),
      accent: getComputedStyle(root).getPropertyValue('--mt-accent').trim(),
      onAccent: getComputedStyle(root).getPropertyValue('--mt-on-accent').trim(),
      border: getComputedStyle(root).getPropertyValue('--mt-border').trim(),
      iconFilter: getComputedStyle(root).getPropertyValue('--mt-icon-filter').trim()
    };

    // Uložíme jen pokud se barvy změnily
    let klic = snapshot.bg + "|" + snapshot.accent + "|" + snapshot.fg;
    if (klic !== this.posledniKlic) {
      this.posledniKlic = klic;
      snapshot.savedAt = new Date().toISOString();
      await Storage.saveThemeSnapshot(snapshot);
    }
  },

  /**
   * Spustí interval, který pravidelně kontroluje barvy na stránce Monkeytype.
   * @returns {void}
   */
  startAutoSync() {
    this.stopAutoSync();
    this.syncWithMonkeytype();

    let self = this;
    this.autoSyncTimer = setInterval(function() {
      self.syncWithMonkeytype();
    }, 750);
  },

  /**
   * Zastaví automatickou synchronizaci barev.
   * @returns {void}
   */
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }
};
