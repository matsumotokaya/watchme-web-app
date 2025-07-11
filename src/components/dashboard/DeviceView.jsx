import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getUserDevices } from '../../services/userService';
import { supabase } from '../../lib/supabase';
import DeviceAvatar from './DeviceAvatar';
import AvatarUploader from '../profile/AvatarUploader';
import { useDeviceAvatar } from '../../hooks/useDeviceAvatar';

const DeviceView = ({ onDeviceSelect }) => {
  const { user, userProfile } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  
  // 編集中のデバイスのアバターを管理
  const { avatarUrl: editingAvatarUrl, uploadAvatar } = useDeviceAvatar(editingDeviceId);

  // デバイス一覧を読み込み
  useEffect(() => {
    const loadUserDevices = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const userDevices = await getUserDevices(user.id);
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
  
  // アバターアップロード完了ハンドラー
  const handleUploadComplete = async (croppedImageUrl) => {
    if (!editingDeviceId) return;
    
    setIsUploading(true);
    try {
      // Supabase Storageにアップロード
      await uploadAvatar(croppedImageUrl);
      setShowAvatarUploader(false);
      
      // デバイス一覧を再読み込みして表示を更新
      const userDevices = await getUserDevices(user.id);
      setDevices(userDevices);
    } catch (error) {
      console.error('デバイスアバターアップロードエラー:', error);
      alert(error.message || 'デバイスアバターのアップロードに失敗しました');
    } finally {
      setIsUploading(false);
      setEditingDeviceId(null);
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
    <Fragment>
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        {/* 観測対象セクション */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">観測対象</h2>
          
          {selectedDeviceId ? (
            <div className="flex flex-col items-center">
              {/* アバター */}
              <DeviceAvatar 
                deviceId={selectedDeviceId} 
                size="large" 
                onClick={() => {
                  setEditingDeviceId(selectedDeviceId);
                  setShowAvatarUploader(true);
                }}
              />
              
              {/* ニックネーム */}
              <h3 className="text-lg font-medium text-gray-800 mt-4">
                ニックネーム未設定
              </h3>
              
              {/* デバイス情報 */}
              <div className="text-sm text-gray-500 mt-1 text-center">
                <p className="font-mono">{selectedDeviceId}</p>
                <p>{devices.find(d => d.device_id === selectedDeviceId)?.device_type || 'Unknown Device'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">デバイスが選択されていません</p>
            </div>
          )}
        </div>

        {/* 観測者セクション */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">観測者</h2>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {userProfile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {userProfile?.name || user?.email?.split('@')[0] || 'ユーザー名未設定'}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.email || 'メールアドレス未設定'}
                </p>
              </div>
            </div>
          </div>
        </div>



      </div>
    </div>
    
    {/* アバターアップローダーモーダル - コンポーネントの最後に配置 */}
    {showAvatarUploader && editingDeviceId && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              デバイスアバターを変更
            </h3>
            <button
              onClick={() => {
                setShowAvatarUploader(false);
                setEditingDeviceId(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <AvatarUploader 
            currentAvatar={editingAvatarUrl}
            onAvatarChange={() => {}}
            onUploadComplete={handleUploadComplete}
            key={showAvatarUploader ? 'uploader' : 'closed'}
          />
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-600">アップロード中...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </Fragment>
  );
};

export default DeviceView;