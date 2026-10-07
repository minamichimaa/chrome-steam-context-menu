const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadExtension(savedOptions) {
  const menus = [];
  const updates = [];
  const createdTabs = [];
  const stored = {...savedOptions};
  let onChanged;
  const chrome = {
    storage: {
      sync: {
        get(defaults, callback) { callback({...defaults, ...stored}); },
        set(values) {
          const changes = {};
          for (const key of Object.keys(values)) {
            if (stored[key] !== values[key]) {
              changes[key] = {oldValue: stored[key], newValue: values[key]};
            }
            stored[key] = values[key];
          }
          if (Object.keys(changes).length) onChanged(changes, 'sync');
        }
      },
      onChanged: {addListener(callback) { onChanged = callback; }}
    },
    contextMenus: {
      create(menu) { menus.push(menu); },
      removeAll(callback) { menus.length = 0; callback(); }
    },
    tabs: {
      update(id, properties) { updates.push({id, ...properties}); },
      create(properties) { createdTabs.push(properties); }
    }
  };
  const context = vm.createContext({chrome, URL});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'steamUrl.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'steamContextMenu.js'), 'utf8'), context);
  return {menus, updates, createdTabs, stored,
    changed: (changes, area = 'sync') => onChanged(changes, area)};
}

test('Steam link and page menus use separate destination filters', () => {
  const extension = loadExtension();
  const link = extension.menus.find(menu => menu.id === 'open_steam_link');
  const page = extension.menus.find(menu => menu.id === 'open_steam_page');
  assert.equal(link.contexts.join(','), 'link');
  assert.deepEqual(Array.from(page.contexts), ['page', 'selection', 'link', 'image', 'video', 'audio', 'editable']);
  assert.equal(link.parentId, undefined);
  assert.equal(page.parentId, undefined);
  assert.equal(link.title, 'Open in Steam');
  assert.equal(page.title, 'Open current page in Steam');
  assert.equal(extension.menus.some(menu => menu.id === 'open_steam'), false);
  assert.deepEqual(Array.from(link.targetUrlPatterns), [
    '*://store.steampowered.com/*', '*://steamcommunity.com/*', '*://www.steamcommunity.com/*'
  ]);
  assert.deepEqual(Array.from(page.documentUrlPatterns), Array.from(link.targetUrlPatterns));
  assert.equal(link.documentUrlPatterns, undefined); // Steam links work on other websites.
});

test('link click opens the link, while blank-space click opens the page', () => {
  const extension = loadExtension();
  const link = extension.menus.find(menu => menu.id === 'open_steam_link');
  const page = extension.menus.find(menu => menu.id === 'open_steam_page');
  const linkUrl = 'https://store.steampowered.com/app/3527290/PEAK/?l=english&snr=1_5_9__205#reviews';
  link.onclick({linkUrl, pageUrl: 'https://example.com/'}, {id: 7});
  const pageUrl = 'https://steamcommunity.com/sharedfiles/filedetails/?id=123&searchtext=A%26B#comments';
  page.onclick({pageUrl}, {id: 8});
  assert.deepEqual(extension.updates, [
    {id: 7, url: 'steam://openurl/' + linkUrl},
    {id: 8, url: 'steam://openurl/' + pageUrl}
  ]);
  assert.equal(extension.createdTabs.length, 0);
});

test('current-page action opens the Steam page instead of the clicked link or image', () => {
  const extension = loadExtension();
  const page = extension.menus.find(menu => menu.id === 'open_steam_page');
  const pageUrl = 'https://store.steampowered.com/app/3527290/PEAK/?l=english#reviews';
  page.onclick({pageUrl, linkUrl: 'https://example.com/',
    srcUrl: 'https://cdn.example.com/image.png', selectionText: 'PEAK'}, {id: 7});
  assert.deepEqual(extension.updates, [{id: 7, url: 'steam://openurl/' + pageUrl}]);
  page.onclick({pageUrl: 'https://example.com/', linkUrl: pageUrl}, {id: 8});
  assert.equal(extension.updates.length, 1);
});

test('invalid and unrelated destinations never trigger Steam', () => {
  const extension = loadExtension();
  const link = extension.menus.find(menu => menu.id === 'open_steam_link');
  for (const linkUrl of [undefined, 'invalid', 'https://example.com/',
    'https://store.steampowered.com.example.com/', 'https://store.steampowered.com@evil.example/',
    'https://user:password@store.steampowered.com/', 'https://store.steampowered.com:8443/',
    'javascript:alert(1)', 'steam://run/400', 'ftp://steamcommunity.com/']) {
    link.onclick({linkUrl, pageUrl: 'https://store.steampowered.com/'}, {id: 7});
  }
  link.onclick({linkUrl: 'https://store.steampowered.com/'});
  assert.equal(extension.updates.length, 0);
});

test('desktop setting toggles menus independently of Steam search', () => {
  const extension = loadExtension({b_steam: false, b_steam_desktop: false});
  assert.equal(extension.menus.some(menu => menu.id === 'open_steam_link'), false);
  extension.changed({b_steam_desktop: {newValue: true}});
  assert.equal(extension.menus.some(menu => menu.id === 'open_steam_link'), true);
  assert.equal(extension.menus.some(menu => menu.title && menu.title.startsWith('Search Steam for')), false);
  extension.changed({b_steam_desktop: {newValue: false}});
  assert.equal(extension.menus.some(menu => menu.id === 'open_steam_page'), false);
});

test('existing IsThereAnyDeal search still preserves selected text', () => {
  const extension = loadExtension();
  const menu = extension.menus.find(menu => menu.title && menu.title.startsWith('Search IsThereAnyDeal'));
  menu.onclick({selectionText: '龍が如く & PEAK #1'});
  const url = new URL(extension.createdTabs[0].url);
  assert.equal(url.pathname, '/search/');
  assert.equal(url.searchParams.get('q'), '龍が如く & PEAK #1');
});

test('options restore the default and save the desktop checkbox', () => {
  const elements = {};
  for (const id of ['b_steam', 'b_steam_desktop', 'b_always_steam_desktop', 'b_steamdb', 'b_steamdb_instant',
    'b_isthereanydeal', 'b_options', 'version']) elements[id] = {addEventListener() {}};
  let saved;
  let optionsChanged;
  const context = vm.createContext({
    chrome: {
      runtime: {getManifest() {return {version: '1.3.0'};}},
      storage: {onChanged: {addListener(listener) { optionsChanged = listener; }}, sync: {
        get(defaults, callback) { callback(defaults); },
        set(options) { saved = options; }
      }}
    },
    document: {
      getElementById(id) { return elements[id]; },
      querySelectorAll() { return []; },
      addEventListener() {}
    }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'options.js'), 'utf8'), context);
  context.restore_options();
  assert.equal(elements.b_steam_desktop.checked, true);
  assert.equal(elements.b_always_steam_desktop.checked, false);
  elements.b_steam_desktop.checked = false;
  elements.b_always_steam_desktop.checked = true;
  context.save_options();
  assert.equal(saved.b_steam_desktop, false);
  assert.equal(saved.b_always_steam_desktop, true);
  optionsChanged({b_always_steam_desktop: {newValue: false}}, 'sync');
  assert.equal(elements.b_always_steam_desktop.checked, false);
});

test('one context-menu checkbox saves the shared setting and changes Steam search', () => {
  const extension = loadExtension();
  const toggle = extension.menus.find(menu => menu.id === 'always_open_in_steam');
  assert.equal(toggle.type, 'checkbox');
  assert.equal(toggle.parentId, undefined);
  assert.deepEqual(Array.from(toggle.contexts), ['page', 'selection', 'link']);
  assert.equal(toggle.checked, false);
  assert.ok(toggle.contexts.includes('selection'));
  toggle.onclick({checked: true});
  assert.equal(extension.stored.b_always_steam_desktop, true);
  assert.equal(extension.menus.find(menu => menu.id === 'always_open_in_steam').checked, true);
  extension.menus.find(menu => menu.id === 'search_steam').onclick({selectionText: 'PEAK'}, {id: 7});
  assert.equal(extension.updates.length, 1);
  const restarted = loadExtension(extension.stored);
  assert.equal(restarted.menus.find(menu => menu.id === 'always_open_in_steam').checked, true);
  restarted.menus.find(menu => menu.id === 'always_open_in_steam').onclick({checked: false});
  restarted.menus.find(menu => menu.id === 'search_steam').onclick({selectionText: 'Portal'}, {id: 7});
  assert.equal(restarted.createdTabs.length, 1);
});

test('Steam search defaults to browser and no destination submenu remains', () => {
  const extension = loadExtension({steam_search_target: 'desktop'});
  const search = extension.menus.find(menu => menu.id === 'search_steam');
  assert.ok(search.title.endsWith('(Browser)'));
  assert.equal(extension.menus.some(menu => menu.id === 'search_steam_destination'), false);
  search.onclick({selectionText: '龍が如く & PEAK #1 + 100%'}, {id: 7});
  assert.equal(new URL(extension.createdTabs[0].url).searchParams.get('term'), '龍が如く & PEAK #1 + 100%');
  assert.equal(extension.updates.length, 0);
});

test('always-desktop setting applies to search and restores browser when disabled', () => {
  const extension = loadExtension({b_always_steam_desktop: true, b_steam_desktop: false});
  extension.menus.find(menu => menu.id === 'search_steam').onclick({selectionText: 'PEAK'}, {id: 7});
  assert.equal(extension.updates[0].url, 'steam://openurl/https://store.steampowered.com/search/?term=PEAK');
  extension.changed({b_always_steam_desktop: {newValue: false}});
  extension.menus.find(menu => menu.id === 'search_steam').onclick({selectionText: 'Portal'}, {id: 7});
  assert.equal(extension.createdTabs.length, 1);
  assert.ok(extension.menus.find(menu => menu.id === 'search_steam').title.endsWith('(Browser)'));
  const restarted = loadExtension({b_always_steam_desktop: true});
  assert.ok(restarted.menus.find(menu => menu.id === 'search_steam').title.endsWith('(Desktop app)'));
});

function loadSteamLinks(enabled) {
  const listeners = {};
  const window = {location: {href: 'https://example.com/'}};
  let onChanged;
  const context = vm.createContext({URL, window,
    document: {addEventListener(type, listener) { listeners[type] = listener; }},
    chrome: {storage: {
      sync: {get(defaults, callback) { callback({...defaults, b_always_steam_desktop: enabled}); }},
      onChanged: {addListener(listener) { onChanged = listener; }}
    }}
  });
  for (const file of ['steamUrl.js', 'steamLinks.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  function click(url, overrides = {}) {
    const link = {href: url, matches() {return true;}, hasAttribute() {return false;}};
    const event = {type: 'click', button: 0, isTrusted: true, defaultPrevented: false,
      composedPath() {return [{}, link];},
      preventDefault() {this.defaultPrevented = true;},
      stopImmediatePropagation() {this.stopped = true;}, ...overrides};
    listeners[event.type](event);
    return event;
  }
  return {window, click, changed: (enabled, area = 'sync') =>
    onChanged({b_always_steam_desktop: {newValue: enabled}}, area)};
}

test('automatic Steam links are off by default and react to the saved toggle', () => {
  const page = loadSteamLinks(false);
  assert.equal(page.click('https://store.steampowered.com/app/400/').defaultPrevented, false);
  page.changed(true, 'local');
  assert.equal(page.click('https://store.steampowered.com/app/400/').defaultPrevented, false);
  page.changed(true);
  const event = page.click('https://store.steampowered.com/app/400/?l=english#reviews');
  assert.equal(event.defaultPrevented, true);
  assert.equal(event.stopped, true);
  assert.equal(page.window.location.href, 'steam://openurl/https://store.steampowered.com/app/400/?l=english#reviews');
  page.changed(false);
  assert.equal(page.click('https://store.steampowered.com/app/400/').defaultPrevented, false);
});

test('automatic links handle middle clicks and ignore unrelated or synthetic clicks', () => {
  const page = loadSteamLinks(true);
  assert.equal(page.click('https://steamcommunity.com/app/400/', {type: 'auxclick', button: 1}).defaultPrevented, true);
  for (const url of ['https://example.com/', 'https://store.steampowered.com.example.com/',
    'steam://run/400', 'https://user:password@steamcommunity.com/']) {
    assert.equal(page.click(url).defaultPrevented, false);
  }
  assert.equal(page.click('https://steamcommunity.com/', {isTrusted: false}).defaultPrevented, false);
  assert.equal(page.click('https://steamcommunity.com/', {button: 2}).defaultPrevented, false);
  assert.equal(page.click('https://steamcommunity.com/', {composedPath() {
    return [{href: 'https://steamcommunity.com/', matches() {return true;}, hasAttribute() {return true;}}];
  }}).defaultPrevented, false);
});
