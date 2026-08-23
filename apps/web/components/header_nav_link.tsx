export type HeaderNavIcon =
  | "armory"
  | "tutorial"
  | "leaderboard"
  | "characters"
  | "world"
  | "lobby";

interface HeaderNavLinkProps {
  href: string;
  icon: HeaderNavIcon;
  label: string;
  labelKey: string;
  shortLabel?: string;
  shortLabelKey?: string;
  current?: boolean;
}

function NavIcon({ icon }: { icon: HeaderNavIcon }) {
  if (icon === "armory") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M4 5.5h6v6H4zM14 5.5h6v6h-6zM4 15.5h6v3H4zM14 15.5h6v3h-6z" />
      </svg>
    );
  }
  if (icon === "tutorial") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M4 5.5c3.1-.8 5.6-.3 8 1.4v12c-2.4-1.7-4.9-2.2-8-1.4v-12Zm16 0c-3.1-.8-5.6-.3-8 1.4v12c2.4-1.7 4.9-2.2 8-1.4v-12Z" />
      </svg>
    );
  }
  if (icon === "leaderboard") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M4 18.5h4v-6H4v6Zm6 0h4v-13h-4v13Zm6 0h4v-9h-4v9ZM3 21h18" />
      </svg>
    );
  }
  if (icon === "characters") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 11.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM5 20v-1.1c0-3.2 3.1-5.7 7-5.7s7 2.5 7 5.7V20M4 20h16" />
      </svg>
    );
  }
  if (icon === "world") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 0c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5M12 3.5C9.9 5.8 8.8 8.6 8.8 12s1.1 6.2 3.2 8.5M4 9h16M4 15h16" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M10 6 4 12l6 6M4 12h11M15 5h5v14h-5" />
    </svg>
  );
}

export default function HeaderNavLink({
  href,
  icon,
  label,
  labelKey,
  shortLabel,
  shortLabelKey,
  current = false,
}: HeaderNavLinkProps) {
  return (
    <a
      class="header-link header-nav-link"
      href={href}
      aria-current={current ? "page" : undefined}
      aria-label={label}
      data-i18n-aria-label={labelKey}
      title={label}
      data-i18n-title={labelKey}
    >
      <span class="header-link-icon" aria-hidden="true">
        <NavIcon icon={icon} />
      </span>
      <span class="header-link-label" data-i18n={labelKey}>{label}</span>
      {shortLabel && shortLabelKey
        ? (
          <span class="header-link-short-label" aria-hidden="true" data-i18n={shortLabelKey}>
            {shortLabel}
          </span>
        )
        : null}
    </a>
  );
}
