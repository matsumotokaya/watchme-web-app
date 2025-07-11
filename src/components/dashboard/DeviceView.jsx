import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getUserDevices } from '../../services/userService';
import { useDeviceAvatar } from '../../hooks/useDeviceAvatar';
import { useAvatar } from '../../hooks/useAvatar';

const DeviceView = ({ onDeviceSelect }) => {
  const { user, userProfile } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 選択中のデバイスのアバターを管理
  const { avatarUrl: selectedDeviceAvatarUrl, uploadAvatar } = useDeviceAvatar(selectedDeviceId);
  
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

  // アバター変更
  const handleAvatarChange = () => {
    if (!selectedDeviceId) return;
    
    // ファイル選択ダイアログを開く
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        // ファイルを読み込んでbase64に変換
        const reader = new FileReader();
        reader.onload = async (event) => {
          await uploadAvatar(event.target.result);
          // 再読み込み
          window.location.reload();
        };
        reader.readAsDataURL(file);
      } catch (error) {
        alert('アップロードに失敗しました');
      }
    };
    input.click();
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
            {/* アバター */}
            <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {selectedDeviceAvatarUrl ? (
                <img 
                  src={selectedDeviceAvatarUrl} 
                  alt="Device" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            
            {/* アバター変更ボタン */}
            <button
              onClick={handleAvatarChange}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              アバターを変更
            </button>
            
            {/* デバイス情報 */}
            <div className="text-sm text-gray-500 mt-4 text-center">
              <p className="font-mono">{selectedDeviceId}</p>
              <p>{devices.find(d => d.device_id === selectedDeviceId)?.device_type || 'Unknown Device'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center">デバイスが選択されていません</p>
        )}
      </div>

      {/* 観測者セクション */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">観測者</h2>
        
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
  );
};

export default DeviceView;