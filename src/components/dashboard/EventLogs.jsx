import useVaultAPI from '../../hooks/useVaultAPI';
import EventRankingChart from './EventRankingChart';
import TimeSlotEventTable from './TimeSlotEventTable';
import NoDataMessage from '../common/NoDataMessage';
import RefreshButton from '../common/RefreshButton';
import ErrorDisplay from '../common/ErrorDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

// SEDサマリーデータを表示するEventLogsコンポーネント（リファクタリング版）
const EventLogs = ({ userId, selectedDate }) => {
  const { data: sedData, isLoading, isRefreshing, error, refresh } = useVaultAPI(
    'sed-summary',
    userId,
    selectedDate
  );

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
            <RefreshButton 
              onClick={refresh} 
              isRefreshing={isRefreshing}
            />
          </div>
        </div>

        <ErrorDisplay error={error} />
        <NoDataMessage selectedDate={selectedDate} dataType="行動グラフデータ" />
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
              🔊 音響イベント分析（SED）
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Sound Event Detection - 音響環境の詳細分析結果
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm text-gray-600">
              <div className="font-semibold text-blue-700">
                {sedData.date}
              </div>
              <div className="text-xs">
                総イベント: {sedData.total_events?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <RefreshButton 
              onClick={refresh} 
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
        
        {/* エラー表示 */}
        <ErrorDisplay error={error} />
        
        {/* 分析期間とサマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-xs text-gray-600">分析期間</div>
            <div className="font-semibold text-gray-800">
              {sedData.analysis_period || '24 hours'}
            </div>
          </div>
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-xs text-gray-600">イベント種類</div>
            <div className="font-semibold text-gray-800">
              {sedData.summary_ranking?.length || 0} 種類
            </div>
          </div>
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="text-xs text-gray-600">時間スロット</div>
            <div className="font-semibold text-gray-800">
              {sedData.time_blocks ? Object.keys(sedData.time_blocks).length : 0} / 48
            </div>
          </div>
        </div>
      </div>

      {/* 上部セクション: イベントランキング（Top10） */}
      <EventRankingChart summaryRanking={sedData.summary_ranking} />

      {/* 下部セクション: 時間別イベントログ */}
      <TimeSlotEventTable timeBlocks={sedData.time_blocks} />

      {/* フッター情報 */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-xs text-gray-500">
          Generated at: {sedData.generated_at ? new Date(sedData.generated_at).toLocaleString('ja-JP') : '不明'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          WatchMe v8 - Sound Event Detection Analysis
        </div>
      </div>
    </div>
  );
};

export default EventLogs;