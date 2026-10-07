const STEAM_HOSTS = new Set(['store.steampowered.com', 'steamcommunity.com', 'www.steamcommunity.com']);
const STEAM_URL_PATTERNS = Array.from(STEAM_HOSTS, host => '*://' + host + '/*');

function get_steam_desktop_url(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    return null;
  }
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      !STEAM_HOSTS.has(parsed.hostname) ||
      parsed.username || parsed.password || parsed.port) {
    return null;
  }
  return 'steam://openurl/' + parsed.href;
}
