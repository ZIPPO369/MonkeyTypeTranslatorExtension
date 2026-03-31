# 🐒 MonkeyType Translator Extension

**Vzdělávací nástroj pro procvičování cizích jazyků při psaní na Monkeytype.**

Tento projekt je rozšíření pro prohlížeč Chrome, které umožňuje uživatelům Monkeytype.com sledovat překlady slov v reálném čase, budovat si vlastní slovník a poslouchat správnou výslovnost. Ideální pro ty, kteří chtějí spojit trénink rychlopisu s učením slovní zásoby.

---

## ✨ Hlavní funkce

- 🌍 **Překlad v reálném čase:** Automaticky detekuje a překládá slovo, které právě píšete (přes Google Translate API).
- 📚 **Osobní slovník:** Ukládá každé nové slovo do lokální databáze s počítadlem výskytů.
- ⭐ **Oblíbená slova:** Možnost označit si důležitá slova hvězdičkou pro pozdější procvičování.
- 🔊 **Hlasová výslovnost (TTS):** Přečte slovo nahlas pomocí hlasové syntézy prohlížeče.
- 🎨 **Monkeytype Sync:** Automaticky přizpůsobuje barvy UI podle aktuálně zvoleného tématu na Monkeytype (podpora tmavého i světlého režimu).
- ⌨️ **Klávesové zkratky:** Rychlý přístup k funkcím (Slovník, Uložení slova, Výslovnost) bez nutnosti sahat na myš.

---

## 🚀 Instalace (Vývojářský režim)

1. Stáhněte si tento repozitář jako ZIP a rozbalte ho.
2. Otevřete prohlížeč Chrome a přejděte na adresu `chrome://extensions/`.
3. V pravém horním rohu zapněte **Režim vývojáře**.
4. Klikněte na tlačítko **Načíst rozbalené** (Load unpacked).
5. Vyberte složku s rozbaleným projektem (tu, která obsahuje soubor `manifest.json`).

---

## 🛠️ Použité technologie

- **Manifest V3:** Nejnovější standard pro Chrome rozšíření.
- **JavaScript (ES6):** Čistý kód bez externích knihoven (Vanilla JS).
- **HTML5 & CSS3:** Moderní UI s podporou proměnných pro dynamická témata.
- **Chrome Storage API:** Pro bezpečné a trvalé ukládání dat uživatele.
- **Web Speech API:** Pro generování hlasové výslovnosti.

---

## 📖 Klávesové zkratky (výchozí)

- `Ctrl + Shift + D`: Otevře minimalistický slovník přímo na stránce.
- `Ctrl + Shift + S`: Uloží/odebere aktuální slovo z oblíbených.
- `Ctrl + Shift + E`: Přečte aktuální slovo nahlas.

*(Všechny zkratky lze změnit v nastavení popup okna).*

---

## 👨‍💻 O projektu

Tento projekt vznikl jako **maturitní práce** (4. ročník SŠ). Cílem bylo vytvořit užitečný nástroj, který kombinuje programování v JavaScriptu s praktickým využitím pro studenty jazyků.

*Poznámka: Rozšíření je určeno pro vzdělávací účely na stránce monkeytype.com.*
