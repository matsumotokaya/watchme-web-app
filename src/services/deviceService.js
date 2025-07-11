import { supabase } from '../lib/supabase';

/**
 * デバイスメタデータを取得
 * @param {string} deviceId - デバイスID
 * @returns {Object|null} デバイスメタデータ
 */
export const getDeviceMetadata = async (deviceId) => {
  try {
    const { data, error } = await supabase
      .from('device_metadata')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('デバイスメタデータ取得エラー:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('getDeviceMetadata例外:', err);
    return null;
  }
};

/**
 * デバイスメタデータを保存（作成または更新）
 * @param {string} deviceId - デバイスID
 * @param {Object} metadata - メタデータ
 * @param {string} userId - 更新者のユーザーID
 * @returns {Object|null} 保存後のデバイスメタデータ
 */
export const saveDeviceMetadata = async (deviceId, metadata, userId) => {
  try {
    const updateData = {
      device_id: deviceId,
      ...metadata,
      updated_by_account_id: userId,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('device_metadata')
      .upsert(updateData, { onConflict: 'device_id' })
      .select()
      .single();

    if (error) {
      console.error('デバイスメタデータ保存エラー:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('saveDeviceMetadata例外:', err);
    return null;
  }
};