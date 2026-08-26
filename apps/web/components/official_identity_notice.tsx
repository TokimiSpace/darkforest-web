export default function OfficialIdentityNotice() {
  return (
    <aside
      class="official-identity-notice"
      role="note"
      aria-labelledby="official-identity-notice-title"
    >
      <strong
        id="official-identity-notice-title"
        data-i18n="security.antiFraud.title"
      >
        防詐提醒
      </strong>
      <span>
        <span data-i18n="security.antiFraud.gmail">
          任何以 @gmail.com 結尾、並自稱 Tokimi 的帳號都不是官方聯絡管道。
        </span>{" "}
        <span data-i18n="security.antiFraud.noPayment">
          請勿付款或提供驗證碼。
        </span>{" "}
        <span data-i18n="security.antiFraud.verify">請只透過</span>{" "}
        <a href="https://tokimi.space/">tokimi.space</a>{" "}
        <span data-i18n="security.antiFraud.or">或</span>{" "}
        <a href="mailto:ben@tokimi.space">ben@tokimi.space</a>
        <span data-i18n="security.antiFraud.verifySuffix">查證。</span>
      </span>
    </aside>
  );
}
