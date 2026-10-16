const GAME_ORIGIN = "https://all22pokemon.com";

/** Whether a tab's URL is the game's site, the only place the side panel is enabled. */
export function isGameUrl(url: string | undefined): boolean {
  if (!url || !URL.canParse(url)) return false;
  return new URL(url).origin === GAME_ORIGIN;
}
