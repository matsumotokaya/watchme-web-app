import { supabase } from '../lib/supabase.js';

/**
 * 通知を作成
 * @param {Object} notificationData - 通知データ
 * @returns {Promise<Object>} 作成結果
 */
export const createNotification = async (notificationData) => {
  try {
    console.log('通知作成:', notificationData);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: notificationData.user_id,
        type: notificationData.type || 'system',
        title: notificationData.title,
        message: notificationData.message,
        triggered_by: notificationData.triggered_by,
        metadata: notificationData.metadata
      }])
      .select()
      .single();
    
    if (error) {
      throw new Error(`通知の作成に失敗しました: ${error.message}`);
    }
    
    return { success: true, notification: data };
  } catch (error) {
    console.error('通知作成エラー:', error);
    throw error;
  }
};

/**
 * 複数ユーザーに通知を一括送信
 * @param {Object} notificationData - 通知データ
 * @returns {Promise<Object>} 送信結果
 */
export const broadcastNotification = async (notificationData) => {
  try {
    console.log('通知一括送信:', notificationData);
    
    const { targetUserIds = [], title, message, type = 'announcement', triggered_by, metadata } = notificationData;
    
    // 各ユーザーに個別に通知を作成
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      triggered_by,
      metadata
    }));
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();
    
    if (error) {
      throw new Error(`一括通知の作成に失敗しました: ${error.message}`);
    }
    
    return {
      success: true,
      message: `${data.length}人のユーザーに通知を送信しました`,
      sentCount: data.length,
      notifications: data
    };
  } catch (error) {
    console.error('通知一括送信エラー:', error);
    throw error;
  }
};

/**
 * ユーザーの通知一覧を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<Array>} 通知一覧
 */
export const getUserNotifications = async (userId) => {
  try {
    console.log('通知取得:', userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`通知の取得に失敗しました: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('通知取得エラー:', error);
    return [];
  }
};

/**
 * 未読通知数を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<number>} 未読通知数
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      throw new Error(`未読通知数の取得に失敗しました: ${error.message}`);
    }
    
    return count || 0;
  } catch (error) {
    console.error('未読通知数取得エラー:', error);
    return 0;
  }
};

/**
 * 通知を削除
 * @param {string} notificationId - 通知ID
 * @returns {Promise<Object>} 削除結果
 */
export const deleteNotification = async (notificationId) => {
  try {
    console.log('通知削除:', notificationId);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      throw new Error(`通知の削除に失敗しました: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('通知削除エラー:', error);
    throw error;
  }
};

/**
 * 通知の既読状態を更新
 * @param {string} notificationId - 通知ID
 * @param {boolean} readStatus - 既読状態
 * @returns {Promise<Object>} 更新結果
 */
export const updateNotificationReadStatus = async (notificationId, readStatus = true) => {
  try {
    console.log('通知既読状態更新:', notificationId, readStatus);
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: readStatus })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`通知の更新に失敗しました: ${error.message}`);
    }
    
    return { success: true, notification: data };
  } catch (error) {
    console.error('通知既読状態更新エラー:', error);
    throw error;
  }
};

/**
 * ユーザーの全通知を既読にする
 * @param {string} userId - ユーザーID
 * @returns {Promise<Object>} 更新結果
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    console.log('全通知既読化:', userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();
    
    if (error) {
      throw new Error(`全通知の既読化に失敗しました: ${error.message}`);
    }
    
    return { success: true, updatedCount: data.length };
  } catch (error) {
    console.error('全通知既読化エラー:', error);
    throw error;
  }
}; 