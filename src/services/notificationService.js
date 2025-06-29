// お知らせサービス
// 環境に応じてAPIまたは静的ファイルを使用

// 開発環境かプロダクション環境かを判定
const isDevelopment = import.meta.env.DEV;

// APIエンドポイントのベースURLを動的に取得（開発環境のみ）
const getApiBaseUrl = () => {
  if (isDevelopment) {
    const hostname = window.location.hostname;
    const apiUrl = `http://${hostname}:3001/api`;
    console.log('Notification API Base URL:', apiUrl);
    return apiUrl;
  }
  return null; // プロダクション環境では使用しない
};

const API_BASE_URL = getApiBaseUrl();

/**
 * 静的JSONファイルを読み込む（プロダクション環境用）
 */
const loadStaticNotifications = async (userId) => {
  try {
    const response = await fetch(`/data_accounts/${userId}/notifications.json`);
    if (!response.ok) {
      throw new Error(`お知らせファイルの読み込みに失敗しました: ${userId}`);
    }
    return await response.json();
  } catch (error) {
    console.error('静的お知らせファイル読み込みエラー:', error);
    return [];
  }
};

/**
 * ユーザーにお知らせを作成
 * @param {string} userId - ユーザーID
 * @param {Object} notificationData - お知らせデータ
 * @returns {Promise<Object>} 作成結果
 */
export const createUserNotification = async (userId, notificationData) => {
  if (!isDevelopment) {
    throw new Error('プロダクション環境ではお知らせの作成はできません');
  }

  try {
    console.log('お知らせ作成:', userId, notificationData);
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'normal',
        message: notificationData.message,
        timestamp: new Date().toISOString(),
        isRead: false,
        createdAt: new Date().toISOString()
      }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'お知らせの作成に失敗しました');
    }
    
    return result;
  } catch (error) {
    console.error('お知らせ作成エラー:', error);
    throw error;
  }
};

/**
 * 複数ユーザーにお知らせを一括送信
 * @param {Object} notificationData - お知らせデータ
 * @returns {Promise<Object>} 送信結果
 */
export const broadcastNotification = async (notificationData) => {
  if (!isDevelopment) {
    throw new Error('プロダクション環境ではお知らせの一括送信はできません');
  }

  try {
    console.log('お知らせ一括送信:', notificationData);
    
    const { targetUserIds = [], message, type = 'info', priority = 'normal' } = notificationData;
    
    // 各ユーザーに個別にお知らせを作成
    const results = await Promise.allSettled(
      targetUserIds.map(userId => 
        createUserNotification(userId, { message, type, priority })
      )
    );
    
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failureCount = results.filter(result => result.status === 'rejected').length;
    
    return {
      success: true,
      message: `${successCount}人のユーザーにお知らせを送信しました`,
      sentCount: successCount,
      failureCount: failureCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('お知らせ一括送信エラー:', error);
    throw error;
  }
};

/**
 * ユーザーのお知らせ一覧を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<Array>} お知らせ一覧
 */
export const getUserNotifications = async (userId) => {
  try {
    console.log('お知らせ取得:', userId);
    
    if (isDevelopment) {
      // 開発環境：APIを使用
      const response = await fetch(`${API_BASE_URL}/users/${userId}/notifications`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'お知らせの取得に失敗しました');
      }
      
      // 新しい順にソート（timestampの降順）
      const notifications = result.notifications || [];
      return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      // プロダクション環境：静的ファイルを使用
      const notifications = await loadStaticNotifications(userId);
      return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  } catch (error) {
    console.error('お知らせ取得エラー:', error);
    // エラー時は空配列を返す
    return [];
  }
};

/**
 * お知らせを削除
 * @param {string} userId - ユーザーID
 * @param {string} notificationId - お知らせID
 * @returns {Promise<Object>} 削除結果
 */
export const deleteUserNotification = async (userId, notificationId) => {
  if (!isDevelopment) {
    throw new Error('プロダクション環境ではお知らせの削除はできません');
  }

  try {
    console.log('お知らせ削除:', userId, notificationId);
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'お知らせの削除に失敗しました');
    }
    
    return result;
  } catch (error) {
    console.error('お知らせ削除エラー:', error);
    throw error;
  }
};

/**
 * お知らせの既読状態を更新
 * @param {string} userId - ユーザーID
 * @param {string} notificationId - お知らせID
 * @param {boolean} readStatus - 既読状態
 * @returns {Promise<Object>} 更新結果
 */
export const updateNotificationReadStatus = async (userId, notificationId, readStatus = true) => {
  if (!isDevelopment) {
    throw new Error('プロダクション環境ではお知らせの更新はできません');
  }

  try {
    console.log('お知らせ既読状態更新:', userId, notificationId, readStatus);
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isRead: readStatus
      }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'お知らせの更新に失敗しました');
    }
    
    return result;
  } catch (error) {
    console.error('お知らせ既読状態更新エラー:', error);
    throw error;
  }
}; 