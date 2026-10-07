const fs = require('node:fs');
const path = require('node:path');

const extensionFiles = [
  'settings.js', 'steamUrl.js', 'steamLinks.js', 'steamContextMenu.js',
  'options.html', 'options.js', 'icon-bitty.png', 'icon-small.png', 'icon-large.png', 'LICENSE'
];

function manifestForBrowser(manifest, browser) {
  const result = JSON.parse(JSON.stringify(manifest));
  if (browser === 'firefox') {
    result.background = {scripts: ['settings.js', 'steamUrl.js', 'steamContextMenu.js']};
    delete result.minimum_chrome_version;
    result.browser_specific_settings = {gecko: {
      id: 'steam-context-menu@minamichimaa',
      strict_min_version: '140.0',
      data_collection_permissions: {required: ['searchTerms', 'browsingActivity']}
    }};
  } else if (browser !== 'chrome') {
    throw new Error('Unsupported browser: ' + browser);
  }
  return result;
}

function build(root = path.join(__dirname, '..')) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  for (const browser of ['chrome', 'firefox']) {
    const output = path.join(root, 'bin', browser);
    fs.mkdirSync(output, {recursive: true});
    for (const file of extensionFiles) {
      fs.copyFileSync(path.join(root, file), path.join(output, file));
    }
    fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifestForBrowser(manifest, browser), null, 2) + '\n');
  }
}

if (require.main === module) {
  build();
  console.log('Built Chrome and Firefox extensions in bin/chrome and bin/firefox.');
}

module.exports = {build, extensionFiles, manifestForBrowser};
