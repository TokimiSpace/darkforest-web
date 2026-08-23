import BrandMark from "@/components/brand_mark.tsx";
import { readEnvironment } from "@/lib/seo.ts";

/** This route is deliberately unlinked and only exists in development builds. */
export function uiLabIsEnabled(value = readEnvironment("SHOW_DEV_CONTROLS")): boolean {
  return value === "1";
}

const states = ["Default", "Focus", "Pending", "Cooldown", "Blocked", "Error"] as const;
const skins = ["Mega City", "Darkforest", "Echo"] as const;
const surfaces = [
  {
    id: "idle",
    label: "Idle",
    priority: "IDLE",
    status: "FIELD STABLE",
    title: "Hold the quiet",
    detail: "No urgent surface owns the field. Search, move, or open tools when ready.",
    primary: "SEARCH PERIMETER",
    secondary: "OPEN FIELD TOOLS",
  },
  {
    id: "threat",
    label: "Threat",
    priority: "ENCOUNTER / TARGET",
    status: "CONTACT · 14 M",
    title: "Unknown signal",
    detail: "The contact rail replaces idle tools and keeps Observe beside Hold fire.",
    primary: "OBSERVE CONTACT",
    secondary: "HOLD FIRE",
  },
  {
    id: "confirm",
    label: "Confirm",
    priority: "CONFIRMATION",
    status: "PREVIEW LOCKED",
    title: "Commit one action",
    detail: "Cost, risk, and target remain visible while Confirm and Cancel share one surface.",
    primary: "CONFIRM FIRE",
    secondary: "CANCEL",
  },
  {
    id: "shop",
    label: "Shop",
    priority: "CONTEXTUAL ACTION",
    status: "Field Supply · CACHE 07",
    title: "Trade under signal",
    detail: "Inventory context stays readable without competing with a pending confirmation.",
    primary: "CONFIRM TRADE",
    secondary: "BACK TO SHELF",
  },
  {
    id: "downed",
    label: "Downed",
    priority: "FORCED CHOICE",
    status: "DOWNED · 00:31",
    title: "Survive the interval",
    detail: "Field tools yield to rescue state, remaining time, and the only valid next step.",
    primary: "CALL FOR RESCUE",
    secondary: "WAIT",
  },
  {
    id: "reset",
    label: "Reset",
    priority: "FORCED CHOICE",
    status: "RESET WINDOW",
    title: "Carry one legacy",
    detail: "The reset decision owns focus until a legacy is chosen or authority advances.",
    primary: "CHOOSE LEGACY",
    secondary: "REVIEW MEMORY",
  },
  {
    id: "finale",
    label: "Finale",
    priority: "FORCED CHOICE",
    status: "FINAL RECKONING",
    title: "Answer the forest",
    detail: "Finale intent stays singular, explicit, and visually stronger than field context.",
    primary: "COMMIT ANSWER",
    secondary: "REVIEW TERMS",
  },
  {
    id: "ended",
    label: "Ended",
    priority: "TERMINAL",
    status: "MATCH ENDED",
    title: "The record remains",
    detail: "Outcome, reason, and next destination replace every live gameplay gateway.",
    primary: "VIEW RUN",
    secondary: "RETURN TO LOBBY",
  },
] as const;

function StateButton({ state }: { state: (typeof states)[number] }) {
  const className = `df-button df-button-${state.toLowerCase()}`;
  const disabled = state === "Pending" || state === "Cooldown" || state === "Blocked";
  return (
    <button class={className} type="button" disabled={disabled} aria-disabled={disabled}>
      {state === "Pending"
        ? "SYNCING"
        : state === "Cooldown"
        ? "00:12"
        : state === "Blocked"
        ? "LOCKED"
        : "CONTINUE"}
    </button>
  );
}

export default function UiLabPage() {
  return (
    <main id="main-content" class="app-shell ui-lab" data-ui-lab>
      <header class="brand-bar">
        <a class="wordmark" href="/" aria-label="Return to lobby">
          <BrandMark />
          <span>
            DARKFOREST<small>UI FOUNDATION · DEV ONLY</small>
          </span>
        </a>
        <span class="df-chip df-chip-pending">DEV SURFACE</span>
      </header>

      <section class="ui-lab-intro" aria-labelledby="ui-lab-title">
        <p class="eyebrow">NON-AUTHORITATIVE · COMPONENT FIXTURE</p>
        <h1 id="ui-lab-title">Interface field kit</h1>
        <p>
          Static component states for visual and keyboard QA. No game state, routes, or protocol
          data are used here.
        </p>
      </section>

      <section class="ui-lab-grid" aria-label="UI component states">
        <article class="df-panel">
          <p class="eyebrow">BUTTON</p>
          <h2>Action truth</h2>
          <div class="ui-lab-state-grid">
            {states.map((state) => <StateButton key={state} state={state} />)}
          </div>
        </article>

        <article class="df-panel">
          <p class="eyebrow">METER</p>
          <h2>Readable condition</h2>
          <div class="ui-lab-stack">
            <div class="df-meter">
              <span>VITAL</span>
              <b>72 / 100</b>
              <i style={{ "--df-meter-value": "72%" }} />
            </div>
            <div class="df-meter df-meter-cooldown">
              <span>RECOVERY</span>
              <b>00:12</b>
              <i style={{ "--df-meter-value": "38%" }} />
            </div>
            <div class="df-meter df-meter-error">
              <span>SIGNAL</span>
              <b>LOST</b>
              <i style={{ "--df-meter-value": "16%" }} />
            </div>
          </div>
        </article>

        <article class="df-panel">
          <p class="eyebrow">CHIP</p>
          <h2>Color, shape, text</h2>
          <div class="ui-lab-chip-row">
            <span class="df-chip">READY</span>
            <span class="df-chip df-chip-pending">PENDING</span>
            <span class="df-chip df-chip-cooldown">COOLDOWN</span>
            <span class="df-chip df-chip-blocked">BLOCKED</span>
            <span class="df-chip df-chip-error">ERROR</span>
          </div>
        </article>

        <article class="df-panel">
          <p class="eyebrow">RECEIPT</p>
          <h2>Action record</h2>
          <div class="df-receipt">
            <span>INTENT</span>
            <b>MOVE · NODE 04</b>
            <small>Preview accepted · awaiting server receipt</small>
          </div>
          <div class="df-receipt df-receipt-error">
            <span>REJECTED</span>
            <b>PATH BLOCKED</b>
            <small>Choose a reachable node before confirming.</small>
          </div>
        </article>
      </section>

      <section class="ui-lab-surfaces" aria-labelledby="ui-lab-surfaces-title">
        <header class="ui-lab-section-heading">
          <p class="eyebrow">GAMEPLAY SURFACE WALL</p>
          <h2 id="ui-lab-surfaces-title">One state owns the next action</h2>
          <p>
            Lifecycle fixtures exercise the priority ladder from idle context to terminal outcome.
          </p>
        </header>
        <div class="ui-lab-surface-grid">
          {surfaces.map((surface, index) => (
            <article
              class={`df-panel ui-lab-surface ui-lab-surface-${surface.id}`}
              data-ui-lab-surface={surface.id}
              key={surface.id}
            >
              <header class="ui-lab-surface-header">
                <span class="ui-lab-surface-priority">{surface.priority}</span>
                <span class="ui-lab-surface-status">{surface.status}</span>
              </header>
              <div class="ui-lab-surface-body">
                <span class="ui-lab-surface-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p class="eyebrow">{surface.label}</p>
                <h3>{surface.title}</h3>
                <p>{surface.detail}</p>
              </div>
              <footer class="ui-lab-surface-actions">
                <button class="df-button" type="button">{surface.primary}</button>
                <button class="df-button ui-lab-surface-secondary" type="button">
                  {surface.secondary}
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section class="ui-lab-skins" aria-labelledby="ui-lab-skins-title">
        <p class="eyebrow">PHASE SKINS</p>
        <h2 id="ui-lab-skins-title">Same components, distinct world memory</h2>
        <div class="ui-lab-skin-grid">
          {skins.map((skin) => (
            <article class={`df-panel df-skin-${skin.toLowerCase().replace(" ", "-")}`}>
              <span class="df-chip">{skin}</span>
              <h3>{skin}</h3>
              <p>
                Surface, accent, and status contrast stay consistent without changing interaction
                meaning.
              </p>
              <button class="df-button" type="button">INSPECT</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
