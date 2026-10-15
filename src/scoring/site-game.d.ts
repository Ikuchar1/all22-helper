// The site's own game globals, served by the `virtual:site-game` Vite plugin (vite.config.ts).
// Only the members we use are typed. The game calls a formation a "scheme" and a region a "gen".
declare module "virtual:site-game" {
  type GameScheme = { def: string; off: string };

  export const DRAFT: {
    positionScore(id: number, slot: string, scheme: GameScheme): number;
    teamScore(
      lineup: Partial<Record<string, number>>,
      scheme: GameScheme,
      variant: string,
    ): { score: number; offense: number; defense: number };
    roleOf(slot: string, scheme: GameScheme): string;
    OFFENSE_BY: Record<"fb" | "slot", Record<string, number>>;
    DEFENSE_BY: Record<"34" | "43", Record<string, number>>;
    MAX_LEGENDS: number;
    VARIANTS: Record<"all" | "retro", string[]>;
    POOL: Record<string, { id: number; name: string; legendary: boolean }[]>;
  };

  export const POKEDATA: { types: string[] }[];
  export const POKEMON_NAMES: string[];
  export const LEGENDARIES: Set<number>;
}
