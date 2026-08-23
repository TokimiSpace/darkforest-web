import HeaderNavLink, { type HeaderNavIcon } from "@/components/header_nav_link.tsx";

interface PrimaryHeaderNavigationProps {
  pathname: string;
}

const PRIMARY_LINKS: ReadonlyArray<{
  href: string;
  icon: HeaderNavIcon;
  label: string;
  labelKey: string;
  shortLabel: string;
  shortLabelKey: string;
}> = [
  {
    href: "/characters",
    icon: "characters",
    label: "角色檔案",
    labelKey: "nav.characters",
    shortLabel: "角色",
    shortLabelKey: "nav.short.characters",
  },
  {
    href: "/world",
    icon: "world",
    label: "世界地區誌",
    labelKey: "nav.world",
    shortLabel: "世界",
    shortLabelKey: "nav.short.world",
  },
  {
    href: "/tutorial",
    icon: "tutorial",
    label: "生存訓練",
    labelKey: "nav.tutorial",
    shortLabel: "教學",
    shortLabelKey: "nav.short.tutorial",
  },
  {
    href: "/armory",
    icon: "armory",
    label: "軍械圖鑑",
    labelKey: "nav.armory",
    shortLabel: "圖鑑",
    shortLabelKey: "nav.short.armory",
  },
  {
    href: "/leaderboard",
    icon: "leaderboard",
    label: "倖存者排行",
    labelKey: "nav.leaderboard",
    shortLabel: "排行",
    shortLabelKey: "nav.short.leaderboard",
  },
];

export default function PrimaryHeaderNavigation({ pathname }: PrimaryHeaderNavigationProps) {
  return (
    <nav
      class="primary-site-nav"
      aria-label="主要頁面"
      data-i18n-aria-label="nav.primaryLabel"
      data-primary-site-nav
    >
      {PRIMARY_LINKS.map((link) => (
        <HeaderNavLink
          {...link}
          key={link.href}
          current={pathname === link.href}
        />
      ))}
    </nav>
  );
}
