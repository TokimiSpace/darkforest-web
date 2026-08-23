interface SiteFooterProps {
  pathname: string;
}

interface SiteFooterNavigationProps extends SiteFooterProps {
  className?: string;
  includeDeveloper?: boolean;
}

const FOOTER_LINKS = [
  {
    href: "/about",
    i18n: "nav.about",
    label: "遊戲介紹",
    shortI18n: "nav.short.about",
    shortLabel: "介紹",
  },
] as const;

function DeveloperCredit({ className = "site-credit-developer" }: { className?: string }) {
  return (
    <a
      class={className}
      href="https://tokimi.space"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="footer-link-full" data-i18n="footer.developedBy">
        由 tokimi.space 研發
      </span>
      <span class="footer-link-short" aria-hidden="true">TOKIMI.SPACE ↗</span>
    </a>
  );
}

export function SiteFooterNavigation({
  pathname,
  className = "site-credit-nav",
  includeDeveloper = false,
}: SiteFooterNavigationProps) {
  return (
    <nav
      class={className}
      aria-label="網站資訊"
      data-i18n-aria-label="footer.ariaLabel"
    >
      <span class="site-credit-nav-label" data-i18n="footer.secondaryLabel">
        其他資訊
      </span>
      {FOOTER_LINKS.map(({ href, i18n, label, shortI18n, shortLabel }) => (
        <a
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          <span class="footer-link-full" data-i18n={i18n}>{label}</span>
          <span class="footer-link-short" aria-hidden="true" data-i18n={shortI18n}>
            {shortLabel}
          </span>
        </a>
      ))}
      {includeDeveloper ? <DeveloperCredit className="lobby-footer-developer" /> : null}
    </nav>
  );
}

export default function SiteFooter({ pathname }: SiteFooterProps) {
  return (
    <footer class="site-credit">
      <SiteFooterNavigation pathname={pathname} />
      <div class="site-credit-meta">
        <a
          class="site-credit-brand"
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          aria-label="返回大廳"
          data-i18n-aria-label="common.backLobby"
        >
          <span aria-hidden="true">◇</span>
          <span>
            DARKFOREST
            <small>RESET PROTOCOL</small>
          </span>
        </a>
        <DeveloperCredit />
      </div>
    </footer>
  );
}
