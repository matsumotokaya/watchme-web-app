/**
 * 共通のローディングスピナーコンポーネント
 * @param {string} message - 表示メッセージ
 * @param {string} className - 追加のCSSクラス
 */
const LoadingSpinner = ({ 
  message = "データを読み込み中...", 
  className = "" 
}) => {
  return (
    <div className={`h-64 flex items-center justify-center ${className}`}>
      <div className="animate-pulse text-blue-500">{message}</div>
    </div>
  );
};

export default LoadingSpinner;