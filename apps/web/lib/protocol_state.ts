/**
 * Browser-only lobby types shared through JSDoc. Executable public-demo message handling lives in
 * `apps/web/browser/` and is covered by the browser-runtime tests.
 */
export interface LobbyMessage {
  type: "lobby";
  matchId: string;
  seated: number;
  capacity: number;
  /** Real milliseconds; the only pre-game exception to the game clock. */
  startsInMs: number;
}

export type VisiblePlayerScope = "same-node" | "adjacent-los";
