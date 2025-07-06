import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getUserDevices } from '../../services/userService';
import { supabase } from '../../lib/supabase';

const DeviceView = ({ onDeviceSelect }) => {
  const { user, userProfile } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // デバイス一覧を読み込み
  useEffect(() => {
    const loadUserDevices = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const userDevices = await getUserDevices(user.id);
        console.log('デバイス一覧取得成功:', userDevices);
        setDevices(userDevices);
        
        // 最初のアクティブなデバイスを自動選択
        const activeDevice = userDevices.find(d => d.status === 'active');
        if (activeDevice) {
          setSelectedDeviceId(activeDevice.device_id);
          if (onDeviceSelect) {
            onDeviceSelect(activeDevice.device_id);
          }
        }
      } catch (error) {
        console.error('デバイス取得エラー:', error);
        setDevices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDevices();
  }, [user, onDeviceSelect]);

  // デバイスを選択
  const handleDeviceSelect = (deviceId) => {
    setSelectedDeviceId(deviceId);
    if (onDeviceSelect) {
      onDeviceSelect(deviceId);
    }
  };

  // 新しいデバイスを追加
  const handleAddDevice = async () => {
    if (!newDeviceId.trim()) {
      setAddError('デバイスIDを入力してください');
      return;
    }

    // UUID形式の簡易チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newDeviceId.trim())) {
      setAddError('有効なUUID形式のデバイスIDを入力してください');
      return;
    }

    setIsAdding(true);
    setAddError('');

    try {
      // デバイスが既に存在するか確認
      const { data: existingDevice, error: checkError } = await supabase
        .from('devices')
        .select('device_id, owner_user_id')
        .eq('device_id', newDeviceId.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingDevice) {
        if (existingDevice.owner_user_id === user.id) {
          setAddError('このデバイスは既にあなたに紐付けられています');
        } else {
          setAddError('このデバイスは他のユーザーに紐付けられています');
        }
        return;
      }

      // 新しいデバイスを作成
      const { data: newDevice, error: insertError } = await supabase
        .from('devices')
        .insert({
          device_id: newDeviceId.trim(),
          owner_user_id: user.id,
          device_type: 'mobile', // デフォルト値
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // デバイス一覧を再読み込み
      const userDevices = await getUserDevices(user.id);
      setDevices(userDevices);
      
      // 新しいデバイスを選択
      setSelectedDeviceId(newDevice.device_id);
      if (onDeviceSelect) {
        onDeviceSelect(newDevice.device_id);
      }

      // フォームをリセット
      setNewDeviceId('');
      setShowAddDevice(false);
    } catch (error) {
      console.error('デバイス追加エラー:', error);
      setAddError('デバイスの追加中にエラーが発生しました');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">デバイス管理</h2>
          <p className="text-sm text-gray-600">
            データを表示するデバイスを選択してください
          </p>
        </div>

        {/* ユーザー情報 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{userProfile?.name || user?.email}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {userProfile?.status || 'guest'}
              </span>
            </div>
          </div>
        </div>

        {/* デバイス一覧 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">登録済みデバイス</h3>
            <button
              onClick={() => setShowAddDevice(!showAddDevice)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + デバイスを追加
            </button>
          </div>

          {/* デバイス追加フォーム */}
          {showAddDevice && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    デバイスID (UUID)
                  </label>
                  <input
                    type="text"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    placeholder="例: 123e4567-e89b-12d3-a456-426614174000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isAdding}
                  />
                  {addError && (
                    <p className="mt-1 text-xs text-red-600">{addError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDevice}
                    disabled={isAdding}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isAdding
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isAdding ? '追加中...' : '追加'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDevice(false);
                      setNewDeviceId('');
                      setAddError('');
                    }}
                    disabled={isAdding}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* デバイスリスト */}
          {devices.length > 0 ? (
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.device_id}
                  onClick={() => handleDeviceSelect(device.device_id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedDeviceId === device.device_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {device.device_type || 'Unknown Device'}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {device.device_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        device.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : device.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : device.status === 'syncing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {device.status}
                      </span>
                      {device.last_sync && (
                        <p className="text-xs text-gray-500 mt-1">
                          最終同期: {new Date(device.last_sync).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedDeviceId === device.device_id && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-700">
                        このデバイスのデータが表示されています
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">デバイスが登録されていません</p>
              <button
                onClick={() => setShowAddDevice(true)}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                最初のデバイスを追加
              </button>
            </div>
          )}
        </div>

        {/* 選択中のデバイスID表示（開発用） */}
        {selectedDeviceId && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <p>選択中のデバイスID: {selectedDeviceId}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceView;