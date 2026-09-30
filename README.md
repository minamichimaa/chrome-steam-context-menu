Steam Context Menu — minamichimaa's fork
--------------------------------------

Search for games on [Steam](https://store.steampowered.com/), [SteamDB](https://steamdb.info/), or [IsThereAnyDeal](https://isthereanydeal.com/) using selected text in your browser's context menu.

### About this fork
Maintained by [minamichimaa](https://github.com/minamichimaa). This project is forked from [Skylark95's Steam Context Menu](https://github.com/Skylark95/chrome-steam-context-menu), which is no longer maintained. This fork continues maintenance independently, with fixes for broken search links and updates to the project documentation.

Credit for the original extension goes to Skylark95 and the original contributors. Changes in this fork are recorded in [CHANGELOG.md](CHANGELOG.md).

### Downloads and compatibility
Get this fork from [GitHub Releases](https://github.com/minamichimaa/chrome-steam-context-menu/releases), when a release is available, or download the repository's source code.

This version still uses Manifest V2. Current Google Chrome does not support Manifest V2 extensions; a Manifest V3 migration is needed for current Chrome support. See [Chrome's support timeline](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline).

For temporary testing in Firefox, extract the source, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `manifest.json`. The temporary installation is removed when Firefox restarts.

The original author's browser store listings distribute the original extension, not this fork. No browser store listing is currently linked for this fork.

### Support and contributions
Please [report bugs or request features in this fork](https://github.com/minamichimaa/chrome-steam-context-menu/issues). Include your browser and version, the selected game title, and what happened. Pull requests are welcome.

With Node.js installed, run `node --test tests/steam-desktop.test.js` to check the context menus, URL handoff, and desktop preference. For a browser check, reload the extension, try a Steam link on another website and an empty area of a Steam page, and confirm that **Open in Steam** opens the intended page in the desktop app.

### Use case
When viewing games from retailers other than Steam, select the game title text, right click and select "Search Steam".  Helpful for when you want to check if you already own a game or want to view the game listing on Steam for reviews, price, screenshots, etc.

### Features
* Open Steam store and community links in the Steam desktop app by right-clicking a link and choosing **Open in Steam**.
* Open the current Steam store or community page in the desktop app by right-clicking an empty area and choosing **Open in Steam**.
* Search selected text on [Steam](http://store.steampowered.com/), [SteamDB](https://steamdb.info/), or [IsThereAnyDeal](https://isthereanydeal.com/).
* Change visible menus with the option to collapse the parent menu when only one option is selected.

**Open in Steam** is enabled by default and can be disabled in the extension's options. Steam must be installed; your browser may ask you to allow it to open the app. Store and community URLs keep their path, query, and fragment when passed to Steam.

### Recommended Extensions
This extension also goes well with the following extensions:
* [Augmented Steam](https://augmentedsteam.com/)
* [Steam Database](https://steamdb.info/extension/)

The recommended extensions are maintained by their respective authors. This fork is independently maintained and is not affiliated with Valve, Steam, SteamDB, IsThereAnyDeal, or the original project's maintainer.

### Screenshots
These screenshots are from the original project and may differ from this fork's current appearance.
#### All options enabled
![](screenshots/screenshot_all.jpg)

#### Steam only option
![](screenshots/screenshot_steam.jpg)

#### Options page
![](screenshots/screenshot_options.jpg)

### License
[GNU GPLv3](LICENSE). The original project's license and attribution are retained. Modified versions of the extension remain under GPLv3.
