/**
 * MODUL: POPUP THEME
 * Účel: Aplikuje CSS proměnné tématu pro popup (včetně Monkeytype Auto snapshotu).
 */

/**
 * Aplikuje barevné téma na uživatelské rozhraní popupu.
 * Nastavuje CSS proměnné pro pozadí, text, akcenty a filtry ikon.
 * @param {string} theme Název tématu (např. 'monkeytype', 'dark', 'light').
 * @returns {Promise<void>}
 */
async function applyPopupTheme(theme) {
  const root = document.documentElement;

  if (theme === 'monkeytype') {
    const snapshot = await Storage.getThemeSnapshot();
    if (snapshot) {
      root.style.setProperty('--mt-bg', snapshot.bg || '#1a1a2e');
      root.style.setProperty('--mt-bg-darker', snapshot.bgDarker || '#16213e');
      root.style.setProperty('--mt-fg', snapshot.fg || '#ffffff');
      root.style.setProperty('--mt-accent', snapshot.accent || '#64b5f6');
      root.style.setProperty('--mt-on-accent', snapshot.onAccent || '#0b0b0b');
      root.style.setProperty('--mt-border', snapshot.border || 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--mt-icon-filter', snapshot.iconFilter || 'brightness(0) saturate(100%) invert(1)');
    }
    return;
  }

  root.style.setProperty('--mt-bg', '#1a1a2e');
  root.style.setProperty('--mt-bg-darker', '#16213e');
  root.style.setProperty('--mt-fg', '#ffffff');
  root.style.setProperty('--mt-accent', '#64b5f6');
  root.style.setProperty('--mt-on-accent', '#0b0b0b');
  root.style.setProperty('--mt-border', 'rgba(255, 255, 255, 0.15)');
  root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(1)');

  switch (theme) {
    case 'dark':
      root.style.setProperty('--mt-bg', '#121212');
      root.style.setProperty('--mt-bg-darker', '#000000');
      root.style.setProperty('--mt-accent', '#bb86fc');
      root.style.setProperty('--mt-on-accent', '#0b0b0b');
      break;
    case 'light':
      root.style.setProperty('--mt-bg', '#ffffff');
      root.style.setProperty('--mt-bg-darker', '#f5f5f5');
      root.style.setProperty('--mt-fg', '#000000');
      root.style.setProperty('--mt-accent', '#2196f3');
      root.style.setProperty('--mt-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--mt-on-accent', '#ffffff');
      root.style.setProperty('--mt-icon-filter', 'brightness(0) saturate(100%) invert(0)');
      break;
    case 'black':
      root.style.setProperty('--mt-bg', '#000000');
      root.style.setProperty('--mt-bg-darker', '#000000');
      root.style.setProperty('--mt-accent', '#ffffff');
      root.style.setProperty('--mt-on-accent', '#000000');
      break;
    case 'dark-blue':
      root.style.setProperty('--mt-bg', '#0d1117');
      root.style.setProperty('--mt-bg-darker', '#010409');
      root.style.setProperty('--mt-accent', '#58a6ff');
      root.style.setProperty('--mt-on-accent', '#0b0b0b');
      break;
  }
}

