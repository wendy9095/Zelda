/** 純 CSS 旋轉，避免 lucide Loader2（實為 LoaderCircle）在 React 19 下觸發 insertBefore 錯誤 */
export default function InlineSpinner({ className = "" }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      aria-hidden
    />
  );
}
