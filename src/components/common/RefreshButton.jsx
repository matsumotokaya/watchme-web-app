/**
 * 共通の更新ボタンコンポーネント
 * @param {Function} onClick - クリック時のハンドラー
 * @param {boolean} isRefreshing - 更新中フラグ
 * @param {string} title - ツールチップテキスト
 * @param {string} className - 追加のCSSクラス
 */
const RefreshButton = ({ 
  onClick, 
  isRefreshing, 
  title = "Vault APIから最新データを再取得",
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isRefreshing}
      className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isRefreshing
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
      } ${className}`}
      title={title}
    >
      {isRefreshing ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>更新中...</span>
        </>
      ) : (
        <>
          <span>🔄</span>
          <span>更新</span>
        </>
      )}
    </button>
  );
};

export default RefreshButton;