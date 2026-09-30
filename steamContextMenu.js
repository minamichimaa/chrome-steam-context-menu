var options = {
      b_steam: true,
      b_steam_desktop: true,
      b_steamdb: true,
      b_steamdb_instant: false,
      b_isthereanydeal: true,
      b_options: true
    };

chrome.storage.sync.get(options, update_menus);
chrome.storage.onChanged.addListener(options_changed);

function options_changed(changes, areaName) {
  for(var opt in changes) {
    options[opt] = changes[opt].newValue;
  }
  update_menus(options);
}

function update_menus(results) {
  options = results;
  remove_all_menus(function() {
    if (options.b_steam) {
      create_steam_menu();
    }
    if (options.b_steam_desktop) {
      create_steam_desktop_menus();
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
  });
}

function create_steam_menu() {
  chrome.contextMenus.create({
      "title": "Search Steam for '%s'",
      "contexts": ["selection"],
      "onclick": function (info) {
          chrome.tabs.create({url: 'http://store.steampowered.com/search/?term=' + encodeURIComponent(info.selectionText)});
      }
  });
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
    "targetUrlPatterns": steam_patterns,
    "onclick": function (info, tab) {
      open_in_steam(info.linkUrl, tab);
    }
  });
  chrome.contextMenus.create({
    "id": "open_steam_page",
    "title": "Open in Steam",
    "contexts": ["page"],
    "documentUrlPatterns": steam_patterns,
    "onclick": function (info, tab) {
      open_in_steam(info.pageUrl, tab);
    }
  });
}

function open_in_steam(url, tab) {
  var steam_url;
  try {
    steam_url = new URL(url);
  } catch (error) {
    return;
  }
  if ((steam_url.protocol !== 'https:' && steam_url.protocol !== 'http:') ||
      ['store.steampowered.com', 'steamcommunity.com', 'www.steamcommunity.com'].indexOf(steam_url.hostname) === -1 ||
      steam_url.username || steam_url.password || steam_url.port || !tab) {
    return;
  }
  // Let the browser hand off to Steam without creating an empty browser tab.
  chrome.tabs.update(tab.id, {url: 'steam://openurl/' + steam_url.href});
}

function create_steamdb_menu() {
  var steamdb_url = options.b_steamdb_instant ? 'https://steamdb.info/instantsearch/?idx=steamdb&q=' : 'https://steamdb.info/search/?q=';
  chrome.contextMenus.create({
    "title": "Search SteamDB for '%s'",
    "contexts": ["selection"],
    "onclick": function (info) {
        chrome.tabs.create({url: steamdb_url + encodeURIComponent(info.selectionText)});
    }
  });
}

function create_isthereanydeal_menu() {
  chrome.contextMenus.create({
      "title": "Search IsThereAnyDeal for '%s'",
      "contexts": ["selection"],
      "onclick": function (info) {
          chrome.tabs.create({url: 'https://isthereanydeal.com/search/?q=' + encodeURIComponent(info.selectionText)});
      }
  });
}

function create_options_menu() {
  chrome.contextMenus.create({
    "title": "Change Visible Menus...",
    "contexts": ["selection"],
    "onclick": function (info) {
        chrome.runtime.openOptionsPage();
    }
  });
}

function remove_all_menus(callback) {
  chrome.contextMenus.removeAll(callback);
}
