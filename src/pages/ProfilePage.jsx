import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [devices, setDevices] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');

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
    // 将来的なアバター変更機能用のプレースホルダー
    console.log('アバター変更機能は今後実装予定です');
  };

  return (
    <PageLayout title="マイページ" onBack={() => navigate(-1)}>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* プロフィールカード */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col items-center">
              {/* アバター */}
              <div 
                className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
    </PageLayout>
  );
};

export default ProfilePage;