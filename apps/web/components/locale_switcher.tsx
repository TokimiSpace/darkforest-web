export default function LocaleSwitcher() {
  return (
    <label class="locale-switcher" htmlFor="locale-select">
      <span class="locale-switcher-label" data-i18n="common.language">語言</span>
      <span class="locale-switcher-glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5S14.4 18.2 12 20.5M12 3.5C9.6 5.8 8.4 8.6 8.4 12s1.2 6.2 3.6 8.5" />
        </svg>
        <span id="locale-switcher-current">繁</span>
      </span>
      <select
        id="locale-select"
        aria-label="語言"
        data-i18n-aria-label="common.language"
      >
        <option value="zh-TW">繁體中文</option>
        <option value="zh-CN">简体中文</option>
        <option value="ja">日本語</option>
        <option value="ko">한국어</option>
        <option value="en">English</option>
        <option value="vi">Tiếng Việt</option>
      </select>
    </label>
  );
}
