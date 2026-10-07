var options = {
      b_steam: true,
      b_always_steam_desktop: false,
      b_steam_desktop: true,
      b_steamdb: true,
      b_steamdb_instant: false,
      b_isthereanydeal: true,
      b_options: true
    };

chrome.storage.sync.get(options, update_menus);
chrome.storage.onChanged.addListener(options_changed);

function options_changed(changes, areaName) {
  if (areaName !== 'sync') {
    return;
  }
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
  });
}

function create_steam_menu() {
  var desktop = options.b_always_steam_desktop === true;
  chrome.contextMenus.create({
      "id": "search_steam",
      "title": "Search Steam for '%s' (" + (desktop ? 'Desktop app' : 'Browser') + ")",
      "contexts": ["selection"],
      "onclick": function (info, tab) {
          search_steam(info, tab);
      }
  });
}

function create_steam_desktop_toggle() {
  chrome.contextMenus.create({
    "id": "always_open_in_steam",
    "title": "Always open links in Steam (toggle: " + (options.b_always_steam_desktop === true ? 'on' : 'off') + ")",
    "type": "checkbox",
    "checked": options.b_always_steam_desktop === true,
    "contexts": ["page", "selection", "link"],
    "onclick": function (info) {
      options.b_always_steam_desktop = info.checked === true;
      chrome.storage.sync.set({b_always_steam_desktop: options.b_always_steam_desktop});
    }
  });
}

function search_steam(info, tab) {
  var url = 'https://store.steampowered.com/search/?term=' + encodeURIComponent(info.selectionText);
  if (options.b_always_steam_desktop === true) {
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
    "targetUrlPatterns": steam_patterns,
    "onclick": function (info, tab) {
      open_in_steam(info.linkUrl, tab);
    }
  });
  chrome.contextMenus.create({
    "id": "open_steam_page",
    "title": "Open current page in Steam",
    "contexts": ["page", "selection", "link", "image", "video", "audio", "editable"],
    "documentUrlPatterns": steam_patterns,
    "onclick": function (info, tab) {
      open_in_steam(info.pageUrl, tab);
    }
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
