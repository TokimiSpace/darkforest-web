import type {
  ActionType,
  ErrorCode,
  PlayerView,
  ReplayLog,
  StateDiffMsg,
} from "@darkforest/protocol";

export interface Fixture {
  name: string;
  description: string;
  view: PlayerView;
  followupDiffs?: StateDiffMsg[];

  replay?: ReplayLog;

  commandRejections?: Readonly<
    Partial<Record<ActionType, { errorCode: ErrorCode; retryAtMs?: number }>>
  >;
}
