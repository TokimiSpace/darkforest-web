// @ts-check
/**
 * HTML 逸出是本 repo 指定的 XSS 邊界(見 rules:「never inject unescaped user-controlled
 * content into HTML」)。此模組刻意沒有任何 import,任何前端模組都能安全引用而不會產生
 * 循環相依——先前五份各自複製的實作正是因為沒有這樣一個葉節點模組。
 *
 * 只做一件事:把值轉成字串並逸出五個 HTML 語法字元。呼叫端各自的 null 處理慣例
 * (例如某些表格把 null 顯示為空字串)留在呼叫端,不要分岔這裡的逸出規則。
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
