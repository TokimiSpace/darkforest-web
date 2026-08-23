function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("tactical responsive CSS keeps priority controls touch-safe and unobscured", async () => {
  const css = await Deno.readTextFile(new URL("../static/styles.css", import.meta.url));

  assert(
    /\.tactical-arena-distant\s*>\s*summary\s*\{[^}]*min-height:\s*var\(--df-component-min-hit\)/s
      .test(css),
    "adjacent-contact disclosure must retain the shared 44px hit target",
  );
  assert(
    /\.tactical-arena-stage:is\([^{]*\.has-arena-target,[^{]*\.has-forced-decision,[^{]*\.has-context-decision[^{]*\)[^{]*\.tactical-arena-actions\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s
      .test(css),
    "portrait target, forced-action, and contextual-decision rails must span the complete action grid",
  );
  assert(
    /:is\(\.tactical-target-dock, \.tactical-forced-dock\)\s*>\s*button\s*\{[^}]*min-width:\s*var\(--df-component-min-hit\)[^}]*min-height:\s*var\(--df-component-min-hit\)/s
      .test(css),
    "priority rail controls must remain at least 44px on both axes",
  );
  assert(
    /@media \(min-width: 1051px\) and \(min-height: 501px\)[\s\S]*?\.tactical-mobile-bottom-stack\s*\{[^}]*padding-bottom:\s*calc\(12px \+ var\(--df-component-min-hit\) \+ 26px \+ env\(safe-area-inset-bottom\)\)/
      .test(css),
    "desktop side rail must reserve the fixed footer control and focus-safe inset",
  );
  assert(
    /@media \(orientation: landscape\) and \(max-height: 500px\) and \(max-width: 1024px\)[\s\S]*?html\.has-tactical-session \.tactical-arena-actions\s*\{[^}]*height:\s*auto/s
      .test(css),
    "short-landscape action surfaces must own layout height instead of relying on overflow",
  );
  assert(
    /@media \(max-width: 700px\)[\s\S]*?html\.has-tactical-session \.tactical-arena-actions[^{]*\{[^}]*height:\s*auto/s
      .test(css) &&
      /@media \(max-width: 700px\)[\s\S]*?\.has-context-decision[\s\S]*?\.tactical-mobile-bottom-stack\s*\{[^}]*height:\s*min\(48dvh, 360px\)[^}]*min-height:/s
        .test(css),
    "portrait field decisions must reserve visible height instead of collapsing movement below the fold",
  );
  assert(
    /#match-view:not\(\.narrative-action-collapsed\)[^{]*\.narrative-action-column:not\(\[hidden\]\)\s*\{[^}]*height:\s*100%[^}]*max-height:\s*100%[^}]*overflow-y:\s*auto/s
      .test(css),
    "expanded forced and terminal decisions must scroll inside the gameplay viewport",
  );
  assert(
    /@media \(orientation: landscape\) and \(max-height: 500px\) and \(max-width: 1024px\)[\s\S]*?\.tactical-context-breadcrumb #tactical-context-back,[\s\S]*?\.tactical-context-close\s*\{[^}]*min-height:\s*var\(--df-component-min-hit\)/s
      .test(css),
    "short-landscape breadcrumb exits must keep the shared 44px touch target",
  );
  assert(
    /@media \(max-width: 1050px\)[\s\S]*?html:is\(\[data-text-scale="125"\], \[data-text-scale="150"\]\) \.site-credit\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/
      .test(css),
    "scaled tablet and short-landscape footers must collapse before their minimum columns overflow",
  );
  assert(
    /html\.has-tactical-session \.status-strip\s*\{[^}]*width:\s*140px[^}]*grid-template-columns:\s*repeat\(3, 44px\)/s
      .test(css) &&
      /grid-template-columns:\s*44px minmax\(0, 1fr\) repeat\(3, 44px\)/.test(css) &&
      /#music-toggle\s*\{[^}]*grid-column:\s*5/s.test(css),
    "music must receive a third 44px footer control without stealing the system-status column",
  );
  assert(
    /@media \(max-width: 700px\)[\s\S]*?\.tactical-arena-stage\.has-arena-target \.tactical-mobile-bottom-stack\s*\{[^}]*height:\s*auto[^}]*min-height:\s*0[^}]*max-height:\s*min\(38dvh, 260px\)/s
      .test(css) &&
      /\.tactical-arena-stage\.has-arena-target \.tactical-arena-feed\s*\{[^}]*min-height:\s*56px[^}]*max-height:\s*88px/s
        .test(css),
    "portrait target decisions must size from their content instead of reserving an empty 320px rail",
  );
  assert(
    /@media \(orientation: landscape\) and \(max-height: 500px\) and \(max-width: 1024px\)[\s\S]*?\.tactical-target-odds\s*\{[^}]*display:\s*block/s
      .test(css),
    "short-landscape target decisions must show their hit and damage odds without hover",
  );
});

Deno.test("public navigation remains labeled, touch-safe, and separate from the footer", async () => {
  const css = await Deno.readTextFile(new URL("../static/styles.css", import.meta.url));

  assert(
    /\.primary-site-nav\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(44px,\s*max-content\)\)/s
      .test(css),
    "desktop public navigation should reserve one explicit column per primary destination",
  );
  assert(
    /@media \(max-width: 700px\)[\s\S]*?\.public-site-header \.primary-site-nav\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s
      .test(css),
    "portrait public navigation should become a five-column labeled rail",
  );
  assert(
    /\.primary-site-nav \.header-nav-link\s*\{[^}]*min-height:\s*var\(--df-component-min-hit\)/s
      .test(css),
    "every primary destination should retain the shared 44px minimum hit target",
  );
  assert(
    /\.site-credit\s*\{[^}]*grid-template-columns:\s*minmax\(180px,\s*1fr\)\s+auto/s
      .test(css) &&
      /\.site-credit-nav\s*\{[^}]*grid-column:\s*1/s.test(css) &&
      /\.site-credit-meta\s*\{[^}]*grid-column:\s*2/s.test(css),
    "content footer should visibly separate project navigation from brand metadata",
  );
  assert(
    !/brand-bar[^{}]*header-link:nth-child/.test(css) &&
      !/header-link\[href="\/tutorial"\][^{]*\{[^}]*display:\s*none/.test(css),
    "legacy route-specific CSS must not hide primary destinations",
  );
});

Deno.test("shop location marker survives every collapsed tactical tag breakpoint", async () => {
  const css = await Deno.readTextFile(new URL("../static/styles.css", import.meta.url));

  const shopExceptions = css.match(
    /\.tactical-arena-tags:is\(\s*:has\(\.tactical-arena-hazard\),\s*:has\(\.tactical-arena-shop\)\s*\)/g,
  );
  assert(
    shopExceptions !== null && shopExceptions.length === 3,
    `every collapsed tag breakpoint must show the shop marker (found ${
      shopExceptions?.length ?? 0
    }/3)`,
  );

  const controlOverrides = css.match(
    /\.tactical-arena-stage\.has-arena-controls\s*\.tactical-arena-tags:has\(\.tactical-arena-shop\)/g,
  );
  assert(
    controlOverrides !== null && controlOverrides.length === 3,
    `the shop marker must outrank the has-arena-controls rule (found ${
      controlOverrides?.length ?? 0
    }/3)`,
  );

  assert(
    /\.tactical-arena-tags \.tactical-arena-shop\s*\{[^}]*pointer-events:\s*none/s.test(css),
    "the location marker must remain non-interactive",
  );

  const visibleShopSpans = css.match(
    />\s*span:not\(\.tactical-arena-hazard,\s*\.tactical-arena-shop\)/g,
  );
  assert(
    visibleShopSpans !== null && visibleShopSpans.length === 3,
    `collapsed tag rows must retain the shop marker (found ${visibleShopSpans?.length ?? 0}/3)`,
  );
});
