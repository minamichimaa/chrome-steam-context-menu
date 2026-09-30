// Automatic Steam link opening added by minamichimaa on 2026-09-30.
(function () {
  var enabled = false;
  chrome.storage.sync.get({b_always_steam_desktop: false}, function (items) {
    enabled = items.b_always_steam_desktop === true;
  });
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === 'sync' && changes.b_always_steam_desktop) {
      enabled = changes.b_always_steam_desktop.newValue === true;
    }
  });

  function open_steam_link(event) {
    if (!enabled || !event.isTrusted || event.defaultPrevented ||
        (event.type === 'click' ? event.button !== 0 : event.button !== 1)) {
      return;
    }
    var elements = event.composedPath();
    var link = null;
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].matches && elements[i].matches('a[href], area[href]')) {
        link = elements[i];
        break;
      }
    }
    if (!link || link.hasAttribute('download')) {
      return;
    }
    var url = get_steam_desktop_url(link.href);
    if (!url) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    // Navigate directly during the user's click so the browser can open Steam.
    window.location.href = url;
  }

  document.addEventListener('click', open_steam_link, true);
  document.addEventListener('auxclick', open_steam_link, true);
}());
