import { useState, useEffect } from 'react';

/**
 * Vault APIからデータを取得するカスタムフック
 * @param {string} endpoint - APIエンドポイント ('emotion-timeline' | 'sed-summary')
 * @param {string} userId - ユーザーID
 * @param {string} selectedDate - 選択された日付
 * @returns {Object} - { data, isLoading, isRefreshing, error, refresh }
 */
const useVaultAPI = (endpoint, userId, selectedDate) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * APIからデータを取得する共通ロジック
   */
  const fetchData = async (isRefresh = false) => {
    if (!userId || !selectedDate) {
      console.warn('ユーザーIDまたは選択日付が指定されていません:', { userId, selectedDate });
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = `/api/proxy/${endpoint}/${userId}/${selectedDate}`;
      console.log(`🔄 プロキシ経由で${endpoint}データを取得中...`);
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

      const fetchedData = await response.json();
      if (fetchedData.error) {
        throw new Error(fetchedData.error);
      }

      console.log(`✅ プロキシ経由で${endpoint}データ取得成功:`, fetchedData);
      setData(fetchedData);

    } catch (err) {
      console.log(`⚠️ プロキシ経由での${endpoint}データ取得時に問題が発生:`, err);
      setError(err.message || 'データの取得でタイムアウトまたは通信の問題が発生しました');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * データを手動で更新する
   */
  const refresh = () => {
    fetchData(true);
  };

  // 初期データ取得とuserIdまたはselectedDateが変更された時の再取得
  useEffect(() => {
    fetchData();
  }, [userId, selectedDate, endpoint]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh
  };
};

export default useVaultAPI;