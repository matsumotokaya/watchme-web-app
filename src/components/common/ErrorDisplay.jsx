/**
 * 共通のエラー表示コンポーネント
 * @param {string} error - エラーメッセージ
 * @param {string} className - 追加のCSSクラス
 */
const ErrorDisplay = ({ error, className = "" }) => {
  if (!error) return null;

  return (
    <div className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-red-500">⚠️</span>
        <span className="text-sm text-red-700">{error}</span>
      </div>
    </div>
  );
};

export default ErrorDisplay;