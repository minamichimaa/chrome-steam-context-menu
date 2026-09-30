// Steam desktop URL handling added by minamichimaa on 2026-09-30.
function get_steam_desktop_url(url) {
  var parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    return null;
  }
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      ['store.steampowered.com', 'steamcommunity.com', 'www.steamcommunity.com'].indexOf(parsed.hostname) === -1 ||
      parsed.username || parsed.password || parsed.port) {
    return null;
  }
  return 'steam://openurl/' + parsed.href;
}
