import { renderToString } from "npm:preact-render-to-string@^6.6.3";
import PublicDemoNotice from "@/components/public_demo_notice.tsx";
import HomePage from "@/routes/index.tsx";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("Home page identifies the local fixture demo and its missing live-service features", () => {
  const html = renderToString(<HomePage showDevelopmentControls={false} />);
  const notice = renderToString(<PublicDemoNotice />);

  assert(notice.includes("LOCAL FIXTURE DEMO"), "missing local-fixture label");
  assert(notice.includes("沒有線上配對"), "missing no-matchmaking disclosure");
  assert(html.includes("開啟固定展示情境"), "missing truthful fixture entry");
  assert(html.includes("連接 127.0.0.1 並載入固定情境"), "missing loopback action");
  assert(html.includes("LOCAL FIXTURE"), "missing local state summary");
  assert(!html.includes("建立倖存者並保留下一班席位"), "unsupported live-service CTA leaked");
});
