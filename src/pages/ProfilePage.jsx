import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import { useAuth } from '../hooks/useAuth';
import AvatarUploader from '../components/profile/AvatarUploader';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [devices, setDevices] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);

  useEffect(() => {
    // デバイス情報の取得
    const storedDevices = localStorage.getItem('devices');
    if (storedDevices) {
      setDevices(JSON.parse(storedDevices));
    }
  }, []);

  const handleLogout = async () => {
    // ログアウト処理
    const { error } = await signOut();
    if (!error) {
      console.log('ログアウトしました');
    } else {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleAvatarClick = () => {
    setShowAvatarUploader(true);
  };

  const handleAvatarChange = (newAvatarUrl) => {
    setAvatarUrl(newAvatarUrl);
    setShowAvatarUploader(false);
    // 現時点ではメモリ上のみ（リロードで消える）
  };

  return (
    <PageLayout title="マイページ" onBack={() => navigate(-1)}>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* プロフィールカード */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col items-center">
              {/* アバター */}
              <div className="relative group mb-4">
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity overflow-hidden ${
                    avatarUrl ? '' : 'bg-gray-300'
                  }`}
                  onClick={handleAvatarClick}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="アバター" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                {/* カメラアイコンオーバーレイ */}
                {!avatarUrl && (
                  <div 
                    className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center cursor-pointer transition-all"
                    onClick={handleAvatarClick}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* ユーザー名 */}
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {userProfile?.name || user?.email?.split('@')[0] || 'ユーザー名未設定'}
              </h2>
              
              {/* メールアドレス */}
              <p className="text-gray-600 text-sm">
                {user?.email || 'メールアドレス未設定'}
              </p>
            </div>
          </div>

          {/* 紐付けデバイス */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">紐付けデバイス</h3>
            {devices.length > 0 ? (
              <div className="space-y-3">
                {devices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800">{device.name || `デバイス ${index + 1}`}</p>
                        <p className="text-sm text-gray-600">{device.id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {device.status === 'active' ? '接続中' : '未接続'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">デバイスが登録されていません</p>
            )}
          </div>

          {/* ログアウトボタン */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* アバターアップローダーモーダル */}
      {showAvatarUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">アバター画像を変更</h3>
              <button
                onClick={() => setShowAvatarUploader(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AvatarUploader 
              currentAvatar={avatarUrl}
              onAvatarChange={handleAvatarChange}
              key={showAvatarUploader ? 'uploader' : 'closed'}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ProfilePage;