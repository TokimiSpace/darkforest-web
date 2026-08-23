import { renderToString } from "npm:preact-render-to-string@^6.6.3";
import UiLabPage, { uiLabIsEnabled } from "@/routes/ui-lab.tsx";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("UI Lab is opt-in and absent from production by default", () => {
  assert(uiLabIsEnabled("1"), "SHOW_DEV_CONTROLS=1 should enable the UI Lab");
  assert(!uiLabIsEnabled(""), "an empty environment value must keep the UI Lab disabled");
  assert(!uiLabIsEnabled("0"), "SHOW_DEV_CONTROLS=0 must keep the UI Lab disabled");
});

Deno.test("UI Lab renders shared components, world skins, and the gameplay state wall", () => {
  const html = renderToString(<UiLabPage />);
  for (
    const label of [
      "Default",
      "Focus",
      "Pending",
      "Cooldown",
      "Blocked",
      "Error",
      "Mega City",
      "Darkforest",
      "Echo",
    ]
  ) {
    assert(html.includes(label.toLowerCase()) || html.includes(label), `missing ${label} fixture`);
  }
  for (
    const surface of [
      "idle",
      "threat",
      "confirm",
      "shop",
      "downed",
      "reset",
      "finale",
      "ended",
    ]
  ) {
    assert(
      html.includes(`data-ui-lab-surface="${surface}"`),
      `missing ${surface} gameplay surface`,
    );
  }
  for (
    const priority of [
      "IDLE",
      "CONTEXTUAL ACTION",
      "ENCOUNTER / TARGET",
      "CONFIRMATION",
      "FORCED CHOICE",
      "TERMINAL",
    ]
  ) {
    assert(html.includes(priority), `missing ${priority} priority fixture`);
  }
  assert(html.includes("NON-AUTHORITATIVE"), "the fixture must disclose its presentation role");
});
