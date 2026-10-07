# Changelog

This file records changes made by minamichimaa to the fork of
[Skylark95's Steam Context Menu](https://github.com/Skylark95/chrome-steam-context-menu).

## 2.0.0

### 2026-10-07
- Migrate the Chrome manifest to Manifest V3 with a packaged background service worker.
- Register menu listeners at worker startup and load saved settings for each click.
- Rebuild menus on install, browser startup, and relevant settings changes, with stable menu IDs and serialized rebuilding.
- Remove the deprecated Chrome options styling field and set the minimum Chrome version to 88.
- Share default settings and Steam URL rules, and consolidate context-menu definitions.
- Save only the changed checkbox, synchronize all open options-page preferences, and restore defaults when settings are removed.
- Avoid unnecessary menu rebuilding when only the SteamDB search mode changes.
- Add a Firefox Manifest V3 build using an event page, a stable add-on ID, and Firefox data-use declarations.
- Generate Chrome and Firefox builds and versioned release ZIPs from shared sources.

## 1.4.1

### 2026-10-07
- Make **Open current page in Steam** available across page content, including selected text, links, images, media, and editable fields on Steam store/community pages.

## 1.4.0

### 2026-09-30
- Add a shared **Always open links in Steam** checkbox beside the clickable **Open in Steam** action and in settings, applying to clicked Steam links and Steam searches, off by default.
- Add an optional **Open in Steam** menu for Steam store/community links and page backgrounds, enabled by default.
- Keep the extension name as **Steam Context Menu**, with minamichimaa credited as author and maintainer.
- Add a separator between the desktop toggle and the remaining search menus, with a visible on/off toggle label.
- Add original-project attribution and fork support links to the options page.
- Update the README with fork ownership, downloads, compatibility, and contribution information.

## 1.3.0

### 2026-09-30
- Fix IsThereAnyDeal searches by replacing the obsolete hash URL with `/search/?q=`.
- Replace the Enhanced Steam recommendation with Augmented Steam.

Earlier development history is available in the original repository and Git history.
