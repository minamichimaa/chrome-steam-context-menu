const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadExtension(savedOptions) {
  const menus = [];
  const updates = [];
  const createdTabs = [];
  let onChanged;
  const chrome = {
    storage: {
      sync: {get(defaults, callback) { callback({...defaults, ...savedOptions}); }},
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
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'steamContextMenu.js'), 'utf8'), context);
  return {menus, updates, createdTabs, changed: changes => onChanged(changes, 'sync')};
}

test('Steam link and page menus use separate destination filters', () => {
  const extension = loadExtension();
  const link = extension.menus.find(menu => menu.id === 'open_steam_link');
  const page = extension.menus.find(menu => menu.id === 'open_steam_page');
  assert.equal(link.contexts.join(','), 'link');
  assert.equal(page.contexts.join(','), 'page');
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
  assert.equal(extension.menus.some(menu => menu.title.startsWith('Search Steam for')), false);
  extension.changed({b_steam_desktop: {newValue: false}});
  assert.equal(extension.menus.some(menu => menu.id === 'open_steam_page'), false);
});

test('existing IsThereAnyDeal search still preserves selected text', () => {
  const extension = loadExtension();
  const menu = extension.menus.find(menu => menu.title.startsWith('Search IsThereAnyDeal'));
  menu.onclick({selectionText: '龍が如く & PEAK #1'});
  const url = new URL(extension.createdTabs[0].url);
  assert.equal(url.pathname, '/search/');
  assert.equal(url.searchParams.get('q'), '龍が如く & PEAK #1');
});

test('options restore the default and save the desktop checkbox', () => {
  const elements = {};
  for (const id of ['b_steam', 'b_steam_desktop', 'b_steamdb', 'b_steamdb_instant',
    'b_isthereanydeal', 'b_options', 'version']) elements[id] = {addEventListener() {}};
  let saved;
  const context = vm.createContext({
    chrome: {
      runtime: {getManifest() {return {version: '1.3.0'};}},
      storage: {sync: {
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
  elements.b_steam_desktop.checked = false;
  context.save_options();
  assert.equal(saved.b_steam_desktop, false);
});
