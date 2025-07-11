import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUserDevices } from '../services/userService';
import { getDeviceMetadata } from '../services/deviceService';
import { getTodayString } from '../utils/dateUtils';

/**
 * Dashboard のデータ管理とビジネスロジックを担当するカスタムフック
 * UI から状態管理、データ取得、イベントハンドリングを分離
 */
export const useDashboardData = () => {
  const { user, userProfile } = useAuth();
  
  // 基本状態
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [devices, setDevices] = useState([]);
  const [devicesMetadata, setDevicesMetadata] = useState({});
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // デバイス一覧の読み込み
  useEffect(() => {
    const loadDevices = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('デバイス一覧取得開始 - ユーザーID:', user.id);
        
        // ユーザーのデバイス一覧を取得
        const userDevices = await getUserDevices(user.id);
        console.log('取得したデバイス一覧:', userDevices);
        setDevices(userDevices);

        // 各デバイスのメタデータを並列取得
        const metadataPromises = userDevices.map(async (device) => {
          try {
            const metadata = await getDeviceMetadata(device.device_id);
            return [device.device_id, metadata];
          } catch (error) {
            console.warn(`デバイス ${device.device_id} のメタデータ取得に失敗:`, error);
            return [device.device_id, null];
          }
        });

        const metadataResults = await Promise.all(metadataPromises);
        const metadataMap = Object.fromEntries(
          metadataResults.filter(([_, metadata]) => metadata !== null)
        );
        
        console.log('取得したメタデータ:', metadataMap);
        setDevicesMetadata(metadataMap);

        // デフォルトデバイスの選択（アクティブなデバイスを優先）
        if (!selectedDeviceId && userDevices.length > 0) {
          const activeDevice = userDevices.find(d => d.status === 'active') || userDevices[0];
          if (activeDevice) {
            console.log('デフォルトデバイスを選択:', activeDevice.device_id);
            setSelectedDeviceId(activeDevice.device_id);
          }
        }
        
      } catch (error) {
        console.error('デバイス取得エラー:', error);
        setError('デバイス情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [user?.id, selectedDeviceId]);

  // 日付変更ハンドラー
  const handleDateChange = useCallback((newDate) => {
    console.log('日付変更:', newDate);
    setSelectedDate(newDate);
  }, []);

  // デバイス選択ハンドラー
  const handleDeviceSelect = useCallback((deviceId) => {
    console.log('デバイス選択:', deviceId);
    setSelectedDeviceId(deviceId);
  }, []);

  // 選択中のデバイス情報を取得
  const selectedDevice = devices.find(d => d.device_id === selectedDeviceId);
  const selectedDeviceMetadata = devicesMetadata[selectedDeviceId];

  // 利用可能なデバイスがあるかチェック
  const hasDevices = devices.length > 0;
  const hasSelectedDevice = selectedDeviceId && selectedDevice;

  return {
    // 認証情報
    user,
    userProfile,
    
    // 基本状態
    selectedDate,
    devices,
    devicesMetadata,
    selectedDeviceId,
    isLoading,
    error,
    
    // 計算値
    selectedDevice,
    selectedDeviceMetadata,
    hasDevices,
    hasSelectedDevice,
    
    // イベントハンドラー
    handleDateChange,
    handleDeviceSelect,
    
    // エラー管理
    clearError: () => setError(null),
  };
};