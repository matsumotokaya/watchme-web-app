import { supabase } from '../lib/supabase';

/**
 * Supabaseからユーザー情報を取得するサービス
 */

/**
 * ログイン中のユーザーのプロフィール情報を取得
 * @param {string} userId - auth.users.id
 * @returns {Object|null} ユーザー情報
 */
export const getCurrentUserProfile = async (userId) => {
  try {
    console.log('ユーザープロフィール取得開始:', userId);
    
    // タイムアウト付きでSupabaseクエリを実行
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
    );
    
    const queryPromise = supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('ユーザープロフィール取得エラー:', error);
      // デフォルトプロフィールを返す（エラーではないので名前は保持しない）
      return null;
    }

    console.log('ユーザープロフィール取得成功:', data);
    return data;
  } catch (err) {
    console.error('getCurrentUserProfile例外:', err);
    // タイムアウトまたはエラー時はnullを返す
    return null;
  }
};

/**
 * ユーザーに紐づくデバイス一覧を取得
 * @param {string} userId - auth.users.id  
 * @returns {Array} デバイス一覧
 */
export const getUserDevices = async (userId) => {
  try {
    console.log('🔍 ユーザーデバイス一覧取得開始:', userId);
    console.log('🔍 検索条件: owner_user_id =', userId);
    
    // タイムアウト付きでクエリを実行
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Device fetch timeout')), 3000)
    );
    
    const queryPromise = supabase
      .from('devices')
      .select('*')
      .eq('owner_user_id', userId);

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ デバイス一覧取得エラー:', error);
      console.error('❌ エラー詳細:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return [];
    }

    console.log('✅ デバイス一覧取得成功:', data);
    console.log('✅ 取得件数:', data?.length || 0);
    console.log('✅ 取得したデバイス:', data?.map(d => ({ 
      device_id: d.device_id, 
      owner_user_id: d.owner_user_id,
      status: d.status 
    })));
    
    return data || [];
  } catch (err) {
    console.error('🚨 getUserDevices例外:', err);
    return [];
  }
};

/**
 * ユーザーのViewerLink（デバイスアクセス権限）一覧を取得
 * @param {string} userId - auth.users.id
 * @returns {Array} ViewerLink一覧
 */
export const getUserViewerLinks = async (userId) => {
  try {
    console.log('ViewerLink取得開始:', userId);
    
    const { data, error } = await supabase
      .from('viewer_links')
      .select(`
        *,
        devices (
          device_id,
          device_type,
          status
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('ViewerLink取得エラー:', error);
      return [];
    }

    console.log('ViewerLink取得成功:', data);
    return data || [];
  } catch (err) {
    console.error('getUserViewerLinks例外:', err);
    return [];
  }
};

/**
 * ユーザー情報を更新
 * @param {string} userId - auth.users.id
 * @param {Object} updateData - 更新データ
 * @returns {Object|null} 更新後のユーザー情報
 */
export const updateUserProfile = async (userId, updateData) => {
  try {
    console.log('ユーザープロフィール更新開始:', userId, updateData);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('ユーザープロフィール更新エラー:', error);
      return null;
    }

    console.log('ユーザープロフィール更新成功:', data);
    return data;
  } catch (err) {
    console.error('updateUserProfile例外:', err);
    return null;
  }
};