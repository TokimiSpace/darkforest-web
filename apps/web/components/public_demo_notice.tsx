export default function PublicDemoNotice() {
  return (
    <aside
      class="public-demo-notice"
      role="note"
      aria-labelledby="public-demo-notice-title"
    >
      <strong id="public-demo-notice-title" data-i18n="demo.notice.title">
        LOCAL FIXTURE DEMO
      </strong>
      <span data-i18n="demo.notice.body">
        僅執行固定本機情境；其他頁面是產品概念介面快照。沒有線上配對、帳號、正式戰績或資料持久化，也不相容於正式服務。
      </span>
    </aside>
  );
}
