// Messages between the content script (on the game's page) and the side panel.

/** The saved run, raw from localStorage (null when there is none). The panel parses it. */
export type RunMessage = { kind: "run"; json: string | null };
/** The Pokémon the player is hovering or clicked in the pick list, or null for none. */
export type FocusMessage = { kind: "focus"; dexId: number | null };
/** Content script → panel. */
export type PageMessage = RunMessage | FocusMessage;

/** Panel → content script, when the panel opens: send the run and focus again. */
export type RequestStateMessage = { kind: "request-state" };
