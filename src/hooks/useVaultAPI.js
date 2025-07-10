import { useState, useEffect } from 'react';

/**
 * NaN値をnullに変換する再帰的関数
 * @param {any} obj - 処理対象のオブジェクト
 * @returns {any} - NaN値がnullに変換されたオブジェクト
 */
const normalizeNaNValues = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // 数値の場合：NaNをnullに変換
  if (typeof obj === 'number') {
    return isNaN(obj) ? null : obj;
  }
  
  // 文字列の場合：文字列として"NaN"が含まれている場合もnullに変換
  if (typeof obj === 'string' && obj.toLowerCase() === 'nan') {
    return null;
  }
  
  // 配列の場合：各要素を再帰的に処理
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeNaNValues(item));
  }
  
  // オブジェクトの場合：各プロパティを再帰的に処理
  if (typeof obj === 'object') {
    const normalized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        normalized[key] = normalizeNaNValues(obj[key]);
      }
    }
    return normalized;
  }
  
  return obj;
};

/**
 * Vault APIからデータを取得するカスタムフック
 * @param {string} endpoint - APIエンドポイント ('emotion-timeline' | 'sed-summary')
 * @param {string} deviceId - デバイスID
 * @param {string} selectedDate - 選択された日付
 * @returns {Object} - { data, isLoading, isRefreshing, error, refresh }
 */
const useVaultAPI = (endpoint, deviceId, selectedDate) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * APIからデータを取得する共通ロジック
   */
  const fetchData = async (isRefresh = false) => {
    if (!deviceId || !selectedDate) {
      console.warn('デバイスIDまたは選択日付が指定されていません:', { deviceId, selectedDate });
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // データソースに応じてエンドポイントを切り替え
      const dataSource = import.meta.env.VITE_DATA_SOURCE || 'vault';
      let url;
      
      if (dataSource === 'supabase' && endpoint === 'emotion-timeline') {
        // Supabaseモードの場合は専用エンドポイントを使用
        url = `/api/proxy/emotion-timeline-supabase/${deviceId}/${selectedDate}`;
        console.log(`🔄 Supabase経由で${endpoint}データを取得中...`);
      } else if (dataSource === 'supabase' && endpoint === 'sed-summary') {
        // Supabaseモード（SEDサマリー）
        url = `/api/proxy/sed-summary-supabase/${deviceId}/${selectedDate}`;
        console.log(`🔄 Supabase経由で${endpoint}データを取得中...`);
      } else if (dataSource === 'supabase' && endpoint === 'opensmile-summary') {
        // Supabaseモード（OpenSMILEサマリー）
        url = `/api/proxy/opensmile-summary-supabase/${deviceId}/${selectedDate}`;
        console.log(`🔄 Supabase経由で${endpoint}データを取得中...`);
      } else {
        // Vaultモード（デフォルト）
        url = `/api/proxy/${endpoint}/${deviceId}/${selectedDate}`;
        console.log(`🔄 プロキシ経由で${endpoint}データを取得中...`);
      }
      
      console.log('🌐 リクエストURL (プロキシ):', url);
      console.log('📦 データソース:', dataSource);

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
        // 404は「データなし（測定なし）」として正常な状態
        if (response.status === 404) {
          console.log(`📄 ${endpoint}データなし (測定なし期間):`, { deviceId, selectedDate });
          setData(null);
          setError(null);
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const fetchedData = await response.json();
      if (fetchedData.error) {
        throw new Error(fetchedData.error);
      }

      // NaN値をnullに正規化する処理
      const normalizedData = normalizeNaNValues(fetchedData);
      console.log(`✅ プロキシ経由で${endpoint}データ取得成功:`, normalizedData);
      setData(normalizedData);

    } catch (err) {
      console.log(`⚠️ プロキシ経由での${endpoint}データ取得時に問題が発生:`, err);
      setError(err.message || 'データの取得でタイムアウトまたは通信の問題が発生しました');
      
      // エラー時は必ずデータをクリア（前回データの表示を防ぐ）
      setData(null);
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
    // 依存関係が変更された時は前回データをクリア
    setData(null);
    setError(null);
    
    fetchData();
  }, [deviceId, selectedDate, endpoint]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh
  };
};

export default useVaultAPI;