import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getUserDevices } from '../../services/userService';
import { getDeviceMetadata, saveDeviceMetadata } from '../../services/deviceService';
import { useAvatar } from '../../hooks/useAvatar';
import DeviceMetadataModal from './DeviceMetadataModal';

const DeviceView = ({ onDeviceSelect }) => {
  const { user, userProfile } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceMetadata, setDeviceMetadata] = useState(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  
  // ユーザーアバターを管理
  const { avatarUrl: userAvatarUrl } = useAvatar();

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

  // 選択されたデバイスのメタデータを読み込み
  useEffect(() => {
    const loadDeviceMetadata = async () => {
      if (!selectedDeviceId) {
        setDeviceMetadata(null);
        return;
      }
      
      const metadata = await getDeviceMetadata(selectedDeviceId);
      setDeviceMetadata(metadata);
    };
    
    loadDeviceMetadata();
  }, [selectedDeviceId]);


  // メタデータ保存ハンドラー
  const handleMetadataSave = async (metadata) => {
    if (!selectedDeviceId || !user?.id) return;
    
    const saved = await saveDeviceMetadata(selectedDeviceId, metadata, user.id);
    if (saved) {
      setDeviceMetadata(saved);
      // 成功メッセージ表示など
    }
  };

  if (isLoading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 観測対象セクション */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">観測対象</h2>
        
        {selectedDeviceId ? (
          <div className="flex flex-col items-center">
            {/* 観測対象情報 */}
            <div className="w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">観測対象情報</h3>
              {deviceMetadata ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* アバター */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {deviceMetadata.avatar_url ? (
                        <img 
                          src={deviceMetadata.avatar_url} 
                          alt="観測対象" 
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* 情報リスト */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">名前:</span>
                      <span className="font-medium">{deviceMetadata.name || '未設定'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">年齢:</span>
                      <span className="font-medium">{deviceMetadata.age ? `${deviceMetadata.age}歳` : '未設定'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">性別:</span>
                      <span className="font-medium">{deviceMetadata.gender || '未設定'}</span>
                    </div>
                    {deviceMetadata.notes && (
                      <div className="pt-2">
                        <span className="text-gray-600">備考:</span>
                        <p className="text-sm mt-1">{deviceMetadata.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* デフォルトアバター */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-center text-gray-600">対象のデバイスに観測対象の情報は設定されていません</p>
                </div>
              )}
              <button
                onClick={() => setShowMetadataModal(true)}
                className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                観測対象の情報を設定する
              </button>
            </div>
            
            {/* 観測対象デバイス */}
            <div className="mt-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">観測対象デバイス</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {(() => {
                  const currentDevice = devices.find(d => d.device_id === selectedDeviceId);
                  return currentDevice ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">デバイスID:</span>
                        <span className="font-mono text-sm">{currentDevice.device_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">デバイス種別:</span>
                        <span className="font-medium">{currentDevice.device_type || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ステータス:</span>
                        <span className={`font-medium ${currentDevice.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                          {currentDevice.status === 'active' ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </div>
                      {currentDevice.device_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">デバイス名:</span>
                          <span className="font-medium">{currentDevice.device_name}</span>
                        </div>
                      )}
                      {currentDevice.created_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">登録日時:</span>
                          <span className="text-sm">{new Date(currentDevice.created_at).toLocaleString('ja-JP')}</span>
                        </div>
                      )}
                      {currentDevice.last_activity_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">最終活動:</span>
                          <span className="text-sm">{new Date(currentDevice.last_activity_at).toLocaleString('ja-JP')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center">デバイス情報を取得中...</p>
                  );
                })()}
              </div>
            </div>
            
            {/* 観測者 */}
            <div className="mt-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">観測者</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  {/* ユーザーアバター */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                    {userAvatarUrl ? (
                      <img 
                        src={userAvatarUrl} 
                        alt="User Avatar" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {userProfile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
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
        ) : (
          <p className="text-gray-500 text-center">デバイスが選択されていません</p>
        )}
      </div>
      
      {/* メタデータ設定モーダル */}
      <DeviceMetadataModal
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        deviceId={selectedDeviceId}
        initialData={deviceMetadata}
        onSave={handleMetadataSave}
      />
    </div>
  );
};

export default DeviceView;