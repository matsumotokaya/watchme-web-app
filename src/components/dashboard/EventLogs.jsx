import { useState, useEffect } from 'react';
import { getTodayString } from '../../utils/dateUtils';
import EventRankingChart from './EventRankingChart';
import TimeSlotEventTable from './TimeSlotEventTable';
import NoDataMessage from '../common/NoDataMessage';

// SEDサマリーデータを表示するEventLogsコンポーネント
const EventLogs = ({ userId, selectedDate }) => {
  const [sedData, setSedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Vault APIから直接データを取得する関数
  const fetchFromVaultAPI = async () => {
    if (!userId || !selectedDate) {
      console.warn('ユーザーIDまたは選択日付が指定されていません:', { userId, selectedDate });
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      console.log('🔄 プロキシ経由でSEDサマリーデータを再取得中...');
      console.log('📋 リクエスト詳細:', { userId, selectedDate });

      const url = `/api/proxy/sed-summary/${userId}/${selectedDate}`;
      console.log('🌐 リクエストURL (プロキシ):', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      console.log('📡 レスポンス詳細:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('✅ プロキシ経由でSEDサマリーデータ再取得成功:', data);
      setSedData(data);

    } catch (err) {
      console.log('⚠️ プロキシ経由でのSEDサマリーデータ取得時に問題が発生:', err);
      setError(err.message || 'データの取得でタイムアウトまたは通信の問題が発生しました');
    } finally {
      setIsRefreshing(false);
    }
  };

  // データを読み込む関数
  const loadSedSummaryData = async () => {
    if (!userId || !selectedDate) {
      console.warn('ユーザーIDまたは選択日付が指定されていません:', { userId, selectedDate });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔊 プロキシ経由でSEDサマリーデータを読み込み開始:', { userId, selectedDate });

      const url = `/api/proxy/sed-summary/${userId}/${selectedDate}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('✅ SEDサマリーデータ読み込み成功:', data);
      setSedData(data);
    } catch (err) {
      console.log('⚠️ SEDサマリーデータ読み込み時に問題が発生:', err);
      setError(err.message || 'データの読み込みでタイムアウトまたは通信の問題が発生しました');
      setSedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 初期読み込みとデータ更新
  useEffect(() => {
    loadSedSummaryData();
  }, [userId, selectedDate]);

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

  // エラー状態
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">データが利用できません</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFromVaultAPI}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Vault APIから再取得
          </button>
        </div>
      </div>
    );
  }

  // データがない場合
  if (!sedData) {
    return <NoDataMessage selectedDate={selectedDate} dataType="音響イベントデータ（SED）" />;
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
            {/* グラフ更新ボタン */}
            <button
              onClick={fetchFromVaultAPI}
              disabled={isRefreshing}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isRefreshing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
              title="Vault APIから最新データを再取得"
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
          </div>
        </div>
        
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