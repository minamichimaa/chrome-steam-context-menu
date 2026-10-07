const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {build, extensionFiles} = require('../scripts/build.js');

test('build produces browser-specific manifests and identical shared assets', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'steam-context-menu-build-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));
  for (const file of extensionFiles) fs.writeFileSync(path.join(root, file), 'fixture: ' + file);
  build(root);
  const readManifest = browser => JSON.parse(fs.readFileSync(path.join(root, 'bin', browser, 'manifest.json'), 'utf8'));
  const chrome = readManifest('chrome');
  const firefox = readManifest('firefox');
  assert.equal(chrome.background.service_worker, 'steamContextMenu.js');
  assert.equal(chrome.background.scripts, undefined);
  assert.equal(chrome.browser_specific_settings, undefined);
  assert.equal(firefox.background.service_worker, undefined);
  assert.deepEqual(firefox.background.scripts, ['settings.js', 'steamUrl.js', 'steamContextMenu.js']);
  assert.equal(firefox.minimum_chrome_version, undefined);
  assert.equal(firefox.manifest_version, 3);
  assert.equal(firefox.version, chrome.version);
  assert.equal(firefox.browser_specific_settings.gecko.id, 'steam-context-menu@minamichimaa');
  assert.equal(firefox.browser_specific_settings.gecko.strict_min_version, '140.0');
  assert.deepEqual(firefox.browser_specific_settings.gecko.data_collection_permissions.required, ['searchTerms', 'browsingActivity']);
  for (const browser of ['chrome', 'firefox']) {
    const output = path.join(root, 'bin', browser);
    assert.deepEqual(fs.readdirSync(output).sort(), [...extensionFiles, 'manifest.json'].sort());
    for (const file of extensionFiles) {
      assert.deepEqual(fs.readFileSync(path.join(output, file)), fs.readFileSync(path.join(root, file)));
    }
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')), manifest);
});
