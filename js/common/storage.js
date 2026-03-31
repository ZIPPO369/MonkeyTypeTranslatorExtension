/**
 * MODUL: ÚLOŽIŠTĚ (STORAGE)
 * Ukládání a načítání dat (nastavení a slovníku) pomocí chrome.storage.local.
 */

const Storage = {

  /**
   * Načte všechna data z úložiště (nastavení a slovník).
   * @returns {Promise<Object>} Objekt obsahující klíče "settings" a "dictionary".
   */
  async getAll() {
    try {
      let data = await chrome.storage.local.get(["settings", "dictionary"]);
      return data;
    } catch (e) {
      return { settings: undefined, dictionary: undefined };
    }
  },

  /**
   * Načte aktuální nastavení uživatele z úložiště.
   * Pokud nastavení neexistuje, vrátí výchozí hodnoty.
   * @returns {Promise<Object>} Objekt s nastavením aplikace.
   */
  async getSettings() {
    try {
      let data = await chrome.storage.local.get("settings");

      // Výchozí hodnoty, pokud nic není uloženo
      let vychozi = {
        targetLang: "en",
        sourceLang: "auto",
        appLang: "en",
        theme: "monkeytype",
        mode: "panel",
        notifyVisual: true,
        notifySound: false,
        shortcuts: {
          openDict: "Ctrl+Shift+D",
          saveWord: "Ctrl+Shift+S",
          tts: "Ctrl+Shift+E"
        }
      };

      // Pokud nemáme žádné uložené nastavení, vrátíme výchozí
      if (!data.settings) {
        return vychozi;
      }

      // Spojíme výchozí hodnoty s uloženými (uložené mají přednost)
      let vysledek = {};
      for (let klic in vychozi) {
        vysledek[klic] = vychozi[klic];
      }
      for (let klic in data.settings) {
        if (klic !== "shortcuts") {
          vysledek[klic] = data.settings[klic];
        }
      }

      // Zkratky řešíme zvlášť, protože jsou vnořený objekt
      vysledek.shortcuts = {};
      for (let s in vychozi.shortcuts) {
        vysledek.shortcuts[s] = vychozi.shortcuts[s];
      }
      if (data.settings.shortcuts) {
        for (let s in data.settings.shortcuts) {
          vysledek.shortcuts[s] = data.settings.shortcuts[s];
        }
      }

      return vysledek;
    } catch (e) {
      return {
        targetLang: "en",
        sourceLang: "auto",
        appLang: "en",
        theme: "monkeytype",
        mode: "panel",
        notifyVisual: true,
        notifySound: false,
        shortcuts: {
          openDict: "Ctrl+Shift+D",
          saveWord: "Ctrl+Shift+S",
          tts: "Ctrl+Shift+E"
        }
      };
    }
  },

  // Uloží nastavení
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({ settings: settings });
    } catch (e) {
      console.error("Chyba při ukládání nastavení:", e);
    }
  },

  /**
   * Načte celý slovník uložených slov.
   * @returns {Promise<Object>} Objekt slovníku, kde klíče jsou slova.
   */
  async getDictionary() {
    try {
      let data = await chrome.storage.local.get("dictionary");
      return data.dictionary || {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Přepíše celý slovník v úložišti novými daty.
   * @param {Object} dictionary Nový objekt slovníku.
   * @returns {Promise<void>}
   */
  async setDictionary(dictionary) {
    try {
      await chrome.storage.local.set({ dictionary: dictionary });
    } catch (e) {
      console.error("Chyba při ukládání slovníku:", e);
    }
  },

  /**
   * Uloží nebo aktualizuje slovo ve slovníku.
   * Zvyšuje počítadlo zobrazení (count) a aktualizuje čas přidání.
   * @param {string} word Původní slovo v cizím jazyce.
   * @param {string} translation Překlad slova.
   * @param {string} sourceLang Kód zdrojového jazyka (např. "en").
   * @returns {Promise<Object>} Objekt s informacemi o uloženém slově.
   */
  async saveWord(word, translation, sourceLang) {
    let dictionary = await this.getDictionary();
    let cisleSlovo = word.toLowerCase().trim();

    if (!dictionary[cisleSlovo]) {
      // Slovo je nové — přidáme ho
      dictionary[cisleSlovo] = {
        trans: translation,
        sl: sourceLang || "auto",
        count: 1,
        saved: false,
        added: new Date().toISOString()
      };
    } else {
      // Slovo už existuje — zvýšíme počítadlo
      dictionary[cisleSlovo].count++;
      dictionary[cisleSlovo].trans = translation;
      if (sourceLang) {
        dictionary[cisleSlovo].sl = sourceLang;
      }
      dictionary[cisleSlovo].added = new Date().toISOString();
    }

    try {
      await chrome.storage.local.set({ dictionary: dictionary });
    } catch (e) {
      console.error("Chyba při ukládání slova:", e);
    }

    return dictionary[cisleSlovo];
  },

  /**
   * Přepne stav "uloženo" (hvězdička/oblíbené) pro konkrétní slovo.
   * @param {string} word Slovo, u kterého se má stav změnit.
   * @returns {Promise<Object|undefined>} Aktualizovaný objekt slova nebo undefined.
   */
  async toggleSavedState(word) {
    let dictionary = await this.getDictionary();
    let cisleSlovo = word.toLowerCase().trim();

    if (dictionary[cisleSlovo]) {
      if (dictionary[cisleSlovo].saved) {
        dictionary[cisleSlovo].saved = false;
      } else {
        dictionary[cisleSlovo].saved = true;
      }

      try {
        await chrome.storage.local.set({ dictionary: dictionary });
      } catch (e) {
        console.error("Chyba:", e);
      }
    }

    return dictionary[cisleSlovo];
  },

  /**
   * Smaže všechna data z objektu slovníku.
   * @returns {Promise<void>}
   */
  async clearDictionary() {
    try {
      await chrome.storage.local.set({ dictionary: {} });
    } catch (e) {
      console.error("Chyba:", e);
    }
  },

  /**
   * Odstraní ze slovníku všechna slova, která nemají nastaven příznak "saved".
   * @returns {Promise<void>}
   */
  async clearDictionaryExceptSaved() {
    let dictionary = await this.getDictionary();
    let ponechana = {};

    for (let slovo in dictionary) {
      if (dictionary[slovo] && dictionary[slovo].saved === true) {
        ponechana[slovo] = dictionary[slovo];
      }
    }

    await this.setDictionary(ponechana);
  },

  /**
   * Odstraní ze slovníku pouze slova označená jako "saved".
   * @returns {Promise<void>}
   */
  async clearSavedOnly() {
    let dictionary = await this.getDictionary();
    let ponechana = {};

    for (let slovo in dictionary) {
      if (dictionary[slovo] && dictionary[slovo].saved !== true) {
        ponechana[slovo] = dictionary[slovo];
      }
    }

    await this.setDictionary(ponechana);
  },

  /**
   * Načte uložený snímek barevného tématu (CSS proměnné).
   * @returns {Promise<Object|null>} Objekt s barvami nebo null.
   */
  async getThemeSnapshot() {
    try {
      let data = await chrome.storage.local.get("themeSnapshot");
      return data.themeSnapshot || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Uloží aktuální barvy tématu pro synchronizaci mezi popupem a obsahem stránky.
   * @param {Object} snapshot Objekt obsahující názvy a hodnoty CSS proměnných.
   * @returns {Promise<void>}
   */
  async saveThemeSnapshot(snapshot) {
    try {
      await chrome.storage.local.set({ themeSnapshot: snapshot });
    } catch (e) {
      console.error("Chyba při ukládání tématu:", e);
    }
  }
};
