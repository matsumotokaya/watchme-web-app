import useVaultAPI from '../../hooks/useVaultAPI';
import EventRankingChart from './EventRankingChart';
import TimeSlotEventTable from './TimeSlotEventTable';
import NoDataMessage from '../common/NoDataMessage';
import RefreshButton from '../common/RefreshButton';
import ErrorDisplay from '../common/ErrorDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

// SEDサマリーデータを表示するBehaviorGraphコンポーネント（リファクタリング版）
const BehaviorGraph = ({ userId, selectedDate }) => {
  const { data: sedData, isLoading, isRefreshing, error, refresh } = useVaultAPI(
    'sed-summary',
    userId,
    selectedDate
  );

  // エラーメッセージからHTTPステータスコードを抽出
  const extractErrorCode = (errorMessage) => {
    if (!errorMessage) return null;
    
    // "HTTP 404: Not Found" → "404"
    const httpMatch = errorMessage.match(/HTTP (\d{3})/);
    if (httpMatch) {
      return httpMatch[1];
    }
    
    return null;
  };

  const errorCode = extractErrorCode(error);

  // ローディング状態
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合（エラーがある場合も含む）
  if (!sedData) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">行動グラフ</h2>
          </div>
        </div>

        <NoDataMessage 
          selectedDate={selectedDate} 
          dataType="行動グラフデータ" 
          errorCode={errorCode}
        />
        
        <div className="mt-4 text-center">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? '更新中...' : 'データを更新'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* メインヘッダー */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              行動グラフ
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              総イベント数 {sedData.total_events?.toLocaleString() || '0'} | イベント種類 {sedData.summary_ranking?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* 上部セクション: イベントランキング（Top10） */}
      <EventRankingChart summaryRanking={sedData.summary_ranking} />

      {/* 下部セクション: 時間別イベントログ */}
      <TimeSlotEventTable timeBlocks={sedData.time_blocks} />

      {/* フッター情報 */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? '更新中...' : 'データを更新'}
        </button>
      </div>
    </div>
  );
};

export default BehaviorGraph;