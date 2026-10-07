// Firefox loads these dependencies through background.scripts instead.
if (typeof importScripts === 'function') {
  importScripts('settings.js', 'steamUrl.js');
}

let rebuilding_menus = false;
let rebuild_pending = false;
chrome.contextMenus.onClicked.addListener(menu_clicked);
chrome.runtime.onInstalled.addListener(refresh_menus);
chrome.runtime.onStartup.addListener(refresh_menus);
chrome.storage.onChanged.addListener(options_changed);

function options_changed(changes, areaName) {
  // Search mode affects dispatch only, so it does not require rebuilding menus.
  if (areaName === 'sync' && Object.keys(changes).some(key =>
      key !== 'b_steamdb_instant' && Object.prototype.hasOwnProperty.call(DEFAULT_OPTIONS, key))) {
    refresh_menus();
  }
}

function refresh_menus() {
  if (rebuilding_menus) {
    rebuild_pending = true;
    return;
  }
  rebuilding_menus = true;
  chrome.storage.sync.get(DEFAULT_OPTIONS, function (settings) {
    chrome.contextMenus.removeAll(function () {
      for (const {enabled, ...menu} of menu_definitions(settings)) {
        if (enabled) chrome.contextMenus.create(menu);
      }
      rebuilding_menus = false;
      if (rebuild_pending) {
        rebuild_pending = false;
        refresh_menus();
      }
    });
  });
}

function menu_definitions(settings) {
  const desktop = settings.b_always_steam_desktop === true;
  return [
    {enabled: settings.b_steam, id: 'search_steam',
      title: "Search Steam for '%s' (" + (desktop ? 'Desktop app' : 'Browser') + ')', contexts: ['selection']},
    {enabled: settings.b_steam_desktop, id: 'open_steam_link', title: 'Open in Steam',
      contexts: ['link'], targetUrlPatterns: STEAM_URL_PATTERNS},
    {enabled: settings.b_steam_desktop, id: 'open_steam_page', title: 'Open current page in Steam',
      contexts: ['page', 'selection', 'link', 'image', 'video', 'audio', 'editable'], documentUrlPatterns: STEAM_URL_PATTERNS},
    {enabled: true, id: 'always_open_in_steam',
      title: 'Always open links in Steam (toggle: ' + (desktop ? 'on' : 'off') + ')',
      type: 'checkbox', checked: desktop, contexts: ['page', 'selection', 'link']},
    {enabled: settings.b_steamdb || settings.b_isthereanydeal || settings.b_options,
      id: 'steam_search_separator', type: 'separator', contexts: ['selection']},
    {enabled: settings.b_steamdb, id: 'search_steamdb', title: "Search SteamDB for '%s'", contexts: ['selection']},
    {enabled: settings.b_isthereanydeal, id: 'search_isthereanydeal', title: "Search IsThereAnyDeal for '%s'", contexts: ['selection']},
    {enabled: settings.b_options, id: 'open_options', title: 'Change Visible Menus...', contexts: ['selection']}
  ];
}

function open_in_steam(url, tab) {
  const steam_url = get_steam_desktop_url(url);
  if (steam_url && tab) {
    // Hand off to Steam without creating an empty browser tab.
    chrome.tabs.update(tab.id, {url: steam_url});
  }
}

// Read saved settings per click because service workers can restart at any time.
function menu_clicked(info, tab) {
  if (info.menuItemId === 'always_open_in_steam') {
    chrome.storage.sync.set({b_always_steam_desktop: info.checked === true});
    return;
  }
  chrome.storage.sync.get(DEFAULT_OPTIONS, function (settings) {
    switch (info.menuItemId) {
      case 'search_steam': {
        if (!settings.b_steam) break;
        const url = 'https://store.steampowered.com/search/?term=' + encodeURIComponent(info.selectionText);
        if (settings.b_always_steam_desktop === true) open_in_steam(url, tab);
        else chrome.tabs.create({url});
        break;
      }
      case 'open_steam_link':
        if (settings.b_steam_desktop) open_in_steam(info.linkUrl, tab);
        break;
      case 'open_steam_page':
        if (settings.b_steam_desktop) open_in_steam(info.pageUrl, tab);
        break;
      case 'search_steamdb': {
        if (!settings.b_steamdb) break;
        const url = settings.b_steamdb_instant ? 'https://steamdb.info/instantsearch/?idx=steamdb&q=' : 'https://steamdb.info/search/?q=';
        chrome.tabs.create({url: url + encodeURIComponent(info.selectionText)});
        break;
      }
      case 'search_isthereanydeal':
        if (settings.b_isthereanydeal) {
          chrome.tabs.create({url: 'https://isthereanydeal.com/search/?q=' + encodeURIComponent(info.selectionText)});
        }
        break;
      case 'open_options':
        if (settings.b_options) chrome.runtime.openOptionsPage();
        break;
    }
  });
}
