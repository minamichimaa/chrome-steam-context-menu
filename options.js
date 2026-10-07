function save_options(event) {
  const {id, checked} = event.target;
  if (Object.prototype.hasOwnProperty.call(DEFAULT_OPTIONS, id)) {
    chrome.storage.sync.set({[id]: checked});
  }
}

function restore_options() {
  document.getElementById('version').textContent = chrome.runtime.getManifest().version;
  chrome.storage.sync.get(DEFAULT_OPTIONS, function (settings) {
    for (const key of Object.keys(DEFAULT_OPTIONS)) {
      document.getElementById(key).checked = settings[key];
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  restore_options();
  for (const key of Object.keys(DEFAULT_OPTIONS)) {
    document.getElementById(key).addEventListener('change', save_options);
  }
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== 'sync') return;
  for (const key of Object.keys(DEFAULT_OPTIONS)) {
    if (changes[key]) {
      document.getElementById(key).checked = changes[key].newValue ?? DEFAULT_OPTIONS[key];
    }
  }
});
