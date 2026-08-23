import { isClientMsg } from "@darkforest/protocol";
import type {
  AckMsg,
  ActionType,
  ClientMsg,
  PreviewResponseMsg,
  ServerMsg,
  StateDiffMsg,
} from "@darkforest/protocol";
import type { Fixture } from "./types.ts";
import { fixtures, fixturesByName } from "./mod.ts";

const HOSTNAME = "127.0.0.1";
const PORT = 8788;
const PUSH_INTERVAL_MS = 2000;
const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:8000",
  "http://localhost:8000",
]);

function fixtureListHtml(): string {
  const items = fixtures
    .map((f) => `  <li><code>${f.name}</code> — ${f.description}</li>`)
    .join("\n");
  return `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><title>Darkforest Mock WS Server</title></head>
<body>
<h1>Darkforest: Reset Protocol — Local Fixture Server</h1>
<p>離線前端開發用。所有狀態均為固定展示資料，不包含正式規則引擎。</p>
<h2>用法</h2>
<pre>
GET  /fixtures              列出全部 fixture 的 name + description(JSON)
WS   /ws?fixture=&lt;name&gt;     連上即送 welcome;之後每 2 秒依序推播該 fixture 的 followupDiffs
                             收到 ping -> pong
                             收到 command -> 依 fixture 宣告的 commandRejections 決定性回覆:
                               宣告的 action -> 固定 ack{accepted:false}(不發 diff、不推進版本)
                               未宣告的 action -> ack{accepted:true} + 空事件 diff(不做真結算)
                             收到 preview -> 固定 preview_result;其餘 -> ack{accepted:false}
</pre>
<h2>可用 fixture(${fixtures.length})</h2>
<ul>
${items}
</ul>
</body>
</html>`;
}

export function ackForCommand(
  fixture: Fixture | undefined,
  commandId: string,
  action: ActionType,
): AckMsg {
  const rule = fixture?.commandRejections?.[action];
  if (rule === undefined) return { type: "ack", commandId, accepted: true };
  return {
    type: "ack",
    commandId,
    accepted: false,
    errorCode: rule.errorCode,
    ...(rule.retryAtMs !== undefined ? { retryAtMs: rule.retryAtMs } : {}),
  };
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    "vary": "origin",
    "x-content-type-options": "nosniff",
  });
  const origin = request.headers.get("origin");
  if (origin !== null && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
  }
  return headers;
}

function jsonResponse(request: Request, body: unknown): Response {
  const headers = corsHeaders(request);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body, null, 2), {
    headers,
  });
}

function handleSocket(socket: WebSocket, fixtureName: string): void {
  const fixture = fixturesByName.get(fixtureName);
  let currentVersion = fixture?.view.stateVersion ?? 0;
  let pushTimer: number | undefined;

  const send = (msg: ServerMsg) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
  };

  socket.onopen = () => {
    if (!fixture) {
      socket.close(1008, `unknown fixture: ${fixtureName}`);
      return;
    }
    send({ type: "welcome", view: fixture.view });

    const diffs = fixture.followupDiffs ?? [];
    if (diffs.length === 0) return;
    let i = 0;
    pushTimer = setInterval(() => {
      if (i >= diffs.length) {
        clearInterval(pushTimer);
        return;
      }
      const scripted = diffs[i];
      const nextVersion = Math.max(scripted.stateVersion, currentVersion + 1);
      const diff = nextVersion === scripted.stateVersion
        ? scripted
        : { ...scripted, stateVersion: nextVersion };
      currentVersion = nextVersion;
      send(diff);
      i++;
    }, PUSH_INTERVAL_MS);
  };

  socket.onmessage = (ev) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof ev.data === "string" ? ev.data : "");
    } catch {
      send({ type: "ack", commandId: "unknown", accepted: false, errorCode: "WRONG_STATUS" });
      return;
    }

    if (!isClientMsg(parsed)) {
      const commandId = typeof (parsed as { commandId?: unknown })?.commandId === "string"
        ? (parsed as { commandId: string }).commandId
        : "unknown";
      send({ type: "ack", commandId, accepted: false, errorCode: "WRONG_STATUS" });
      return;
    }

    const msg = parsed as ClientMsg;
    switch (msg.type) {
      case "ping": {
        send({ type: "pong", t: msg.t });
        break;
      }
      case "command": {
        const ack = ackForCommand(fixture, msg.commandId, msg.payload.action);
        send(ack);
        if (!ack.accepted) break;
        currentVersion += 1;
        const diff: StateDiffMsg = {
          type: "diff",
          stateVersion: currentVersion,
          gameNowMs: fixture?.view.gameNowMs ?? 0,
          events: [],
        };
        send(diff);
        break;
      }
      case "preview": {
        const isContactRef = msg.target.startsWith("C-");
        const result: PreviewResponseMsg = {
          type: "preview_result",
          requestId: msg.requestId,
          allowed: true,
          hitChanceBpsMin: isContactRef ? 6300 : 6800,
          hitChanceBpsMax: isContactRef ? 7800 : 8300,
          damageMin: 22,
          damageMax: 26,
          cooldownMs: 4000,
          signalCost: 20,
          modifiers: isContactRef
            ? [
              { source: "weaponBase", bps: 7600 },
              { source: "exposure", bps: 1000 },
              { source: "unidentified", bps: -500 },
              { source: "cover", bps: -1000 },
            ]
            : [
              { source: "weaponBase", bps: 7600 },
              { source: "exposure", bps: 1000 },
              { source: "cover", bps: -1000 },
            ],
          warnings: isContactRef ? ["UNIDENTIFIED_TARGET"] : [],
        };
        send(result);
        break;
      }
      default: {
        send({ type: "ack", commandId: "unknown", accepted: false, errorCode: "WRONG_STATUS" });
      }
    }
  };

  const stopPushing = () => {
    if (pushTimer !== undefined) clearInterval(pushTimer);
  };
  socket.onclose = stopPushing;
  socket.onerror = stopPushing;
}

function handler(req: Request): Response {
  const url = new URL(req.url);

  const origin = req.headers.get("origin");
  if (origin !== null && !ALLOWED_ORIGINS.has(origin)) {
    return new Response("forbidden origin", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    const headers = corsHeaders(req);
    headers.set("access-control-allow-methods", "GET, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
    return new Response(null, { status: 204, headers });
  }

  if (url.pathname === "/ws") {
    if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("expected websocket upgrade", { status: 400 });
    }
    try {
      const { socket, response } = Deno.upgradeWebSocket(req);
      handleSocket(socket, url.searchParams.get("fixture") ?? "");
      return response;
    } catch {
      return new Response("websocket upgrade failed", { status: 400 });
    }
  }

  if (url.pathname === "/fixtures" && req.method === "GET") {
    return jsonResponse(req, fixtures.map((f) => ({ name: f.name, description: f.description })));
  }

  if (url.pathname === "/healthz" && req.method === "GET") {
    return jsonResponse(req, { ready: true, mode: "local-fixture" });
  }

  if (url.pathname === "/" && req.method === "GET") {
    return new Response(fixtureListHtml(), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response("not found", { status: 404 });
}

if (import.meta.main) {
  console.log(`darkforest mock server: http://${HOSTNAME}:${PORT}`);
  console.log(`  ws: ws://${HOSTNAME}:${PORT}/ws?fixture=<name>`);
  Deno.serve({ hostname: HOSTNAME, port: PORT }, handler);
}
