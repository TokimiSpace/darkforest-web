import { PROTOCOL_VERSION } from "@darkforest/protocol";
import type { PageProps } from "fresh";
import OfficialIdentityNotice from "@/components/official_identity_notice.tsx";
import SiteFooter from "@/components/site_footer.tsx";
import PublicDemoNotice from "@/components/public_demo_notice.tsx";
import {
  createSeoMetadata,
  normalizePublicSiteUrl,
  readEnvironment,
  shouldIndexPublicSite,
} from "@/lib/seo.ts";

export default function Document({ Component, url }: PageProps) {
  const pathname = url?.pathname ?? "/";
  const isLobby = pathname === "/";
  const publicSiteUrl = normalizePublicSiteUrl(readEnvironment("PUBLIC_SITE_URL"));
  const feedbackUrl = readEnvironment("FEEDBACK_URL")?.trim() || undefined;
  const seo = createSeoMetadata(
    pathname,
    publicSiteUrl,
    shouldIndexPublicSite(publicSiteUrl, readEnvironment("SEO_INDEXABLE"), url),
  );
  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" data-i18n-content={seo.descriptionKey} content={seo.description} />
        <meta name="robots" content={seo.robots} />
        <meta name="theme-color" content="#101318" />
        <meta name="color-scheme" content="dark" />
        <meta name="application-name" content="Darkforest: Reset Protocol" />
        <meta name="author" content="TokimiSpace" />
        {seo.canonical === null ? null : <link rel="canonical" href={seo.canonical} />}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Darkforest: Reset Protocol" />
        <meta property="og:locale" content="zh_TW" />
        <meta property="og:title" data-i18n-content={seo.titleKey} content={seo.title} />
        <meta
          property="og:description"
          data-i18n-content={seo.descriptionKey}
          content={seo.description}
        />
        {seo.canonical === null ? null : <meta property="og:url" content={seo.canonical} />}
        {seo.socialImage === null ? null : (
          <>
            <meta property="og:image" content={seo.socialImage} />
            <meta property="og:image:type" content="image/png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
              property="og:image:alt"
              data-i18n-content="meta.socialImageAlt"
              content="Darkforest Web 開源前端、fixtures 與 QA 的分享預覽圖"
            />
            <meta name="twitter:image" content={seo.socialImage} />
            <meta
              name="twitter:image:alt"
              data-i18n-content="meta.socialImageAlt"
              content="Darkforest Web 開源前端、fixtures 與 QA 的分享預覽圖"
            />
          </>
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" data-i18n-content={seo.titleKey} content={seo.title} />
        <meta
          name="twitter:description"
          data-i18n-content={seo.descriptionKey}
          content={seo.description}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="mask-icon" href="/art/brand/darkforest-mask-icon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <title data-i18n={seo.titleKey}>{seo.title}</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body
        data-protocol-version={PROTOCOL_VERSION}
        data-feedback-url={feedbackUrl}
        data-public-demo="local-fixtures"
      >
        <a class="skip-link" href="#main-content" data-i18n="common.skip">
          跳到主要內容
        </a>
        <OfficialIdentityNotice />
        <PublicDemoNotice />
        <Component />
        {isLobby ? null : <SiteFooter pathname={pathname} />}
        <script type="module" src="/bootstrap.js" />
      </body>
    </html>
  );
}
