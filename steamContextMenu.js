importScripts('steamUrl.js');

var default_options = {
      b_steam: true,
      b_always_steam_desktop: false,
      b_steam_desktop: true,
      b_steamdb: true,
      b_steamdb_instant: false,
      b_isthereanydeal: true,
      b_options: true
    };

var options = default_options;
var rebuilding_menus = false;
var rebuild_pending = false;
chrome.contextMenus.onClicked.addListener(menu_clicked);
chrome.runtime.onInstalled.addListener(refresh_menus);
chrome.runtime.onStartup.addListener(refresh_menus);
chrome.storage.onChanged.addListener(options_changed);

function options_changed(changes, areaName) {
  if (areaName !== 'sync' || !Object.keys(changes).some(function (key) {
    return Object.prototype.hasOwnProperty.call(default_options, key);
  })) {
    return;
  }
  refresh_menus();
}

function refresh_menus() {
  if (rebuilding_menus) {
    rebuild_pending = true;
    return;
  }
  rebuilding_menus = true;
  chrome.storage.sync.get(default_options, function (results) {
    update_menus(results, function () {
      rebuilding_menus = false;
      if (rebuild_pending) {
        rebuild_pending = false;
        refresh_menus();
      }
    });
  });
}

function update_menus(results, complete) {
  options = results;
  remove_all_menus(function() {
    if (options.b_steam) {
      create_steam_menu();
    }
    if (options.b_steam_desktop) {
      create_steam_desktop_menus();
    }
    create_steam_desktop_toggle();
    if (options.b_steamdb || options.b_isthereanydeal || options.b_options) {
      chrome.contextMenus.create({
        "id": "steam_search_separator",
        "type": "separator",
        "contexts": ["selection"]
      });
    }
    if (options.b_steamdb) {
      create_steamdb_menu();
    }
    if (options.b_isthereanydeal) {
      create_isthereanydeal_menu();
    }
    if (options.b_options) {
      create_options_menu();
    }
    if (complete) {
      complete();
    }
  });
}

function create_steam_menu() {
  var desktop = options.b_always_steam_desktop === true;
  chrome.contextMenus.create({
      "id": "search_steam",
      "title": "Search Steam for '%s' (" + (desktop ? 'Desktop app' : 'Browser') + ")",
      "contexts": ["selection"]
  });
}

function create_steam_desktop_toggle() {
  chrome.contextMenus.create({
    "id": "always_open_in_steam",
    "title": "Always open links in Steam (toggle: " + (options.b_always_steam_desktop === true ? 'on' : 'off') + ")",
    "type": "checkbox",
    "checked": options.b_always_steam_desktop === true,
    "contexts": ["page", "selection", "link"]
  });
}

function search_steam(info, tab, settings) {
  var url = 'https://store.steampowered.com/search/?term=' + encodeURIComponent(info.selectionText);
  if (settings.b_always_steam_desktop === true) {
    open_in_steam(url, tab);
  } else {
    chrome.tabs.create({url: url});
  }
}

// Steam desktop support added by minamichimaa on 2026-09-30.
function create_steam_desktop_menus() {
  var steam_patterns = [
    '*://store.steampowered.com/*',
    '*://steamcommunity.com/*',
    '*://www.steamcommunity.com/*'
  ];
  chrome.contextMenus.create({
    "id": "open_steam_link",
    "title": "Open in Steam",
    "contexts": ["link"],
    "targetUrlPatterns": steam_patterns
  });
  chrome.contextMenus.create({
    "id": "open_steam_page",
    "title": "Open current page in Steam",
    "contexts": ["page", "selection", "link", "image", "video", "audio", "editable"],
    "documentUrlPatterns": steam_patterns
  });
}

function open_in_steam(url, tab) {
  var steam_url = get_steam_desktop_url(url);
  if (!steam_url || !tab) {
    return;
  }
  // Let the browser hand off to Steam without creating an empty browser tab.
  chrome.tabs.update(tab.id, {url: steam_url});
}

function create_steamdb_menu() {
  chrome.contextMenus.create({
    "id": "search_steamdb",
    "title": "Search SteamDB for '%s'",
    "contexts": ["selection"]
  });
}

function create_isthereanydeal_menu() {
  chrome.contextMenus.create({
      "id": "search_isthereanydeal",
      "title": "Search IsThereAnyDeal for '%s'",
      "contexts": ["selection"]
  });
}

function create_options_menu() {
  chrome.contextMenus.create({
    "id": "open_options",
    "title": "Change Visible Menus...",
    "contexts": ["selection"]
  });
}

// Listeners are registered at worker startup; settings are loaded for each click.
function menu_clicked(info, tab) {
  chrome.storage.sync.get(default_options, function (settings) {
    switch (info.menuItemId) {
      case 'search_steam':
        if (settings.b_steam) search_steam(info, tab, settings);
        break;
      case 'open_steam_link':
        if (settings.b_steam_desktop) open_in_steam(info.linkUrl, tab);
        break;
      case 'open_steam_page':
        if (settings.b_steam_desktop) open_in_steam(info.pageUrl, tab);
        break;
      case 'always_open_in_steam':
        chrome.storage.sync.set({b_always_steam_desktop: info.checked === true});
        break;
      case 'search_steamdb':
        if (settings.b_steamdb) {
          var steamdb_url = settings.b_steamdb_instant ? 'https://steamdb.info/instantsearch/?idx=steamdb&q=' : 'https://steamdb.info/search/?q=';
          chrome.tabs.create({url: steamdb_url + encodeURIComponent(info.selectionText)});
        }
        break;
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

function remove_all_menus(callback) {
  chrome.contextMenus.removeAll(callback);
}
