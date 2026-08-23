export default function BrandMark() {
  return (
    <svg
      class="wordmark-mark"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="9" fill="none" stroke="currentColor" stroke-width="5" />
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="square"
        stroke-width="5"
        d="M4 32h19M41 32h19M32 4v19M32 41v19"
      />
    </svg>
  );
}
