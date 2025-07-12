import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import { useAuth } from '../hooks/useAuth';
import { useAvatar } from '../hooks/useAvatar';
import AvatarUploader from '../components/profile/AvatarUploader';
import { getUserDevices } from '../services/userService';
import { getDeviceMetadata } from '../services/deviceService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { avatarUrl, uploadAvatar, loading: avatarLoading } = useAvatar();
  const [devices, setDevices] = useState([]);
  const [devicesMetadata, setDevicesMetadata] = useState({});
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // デバイス情報の取得
    const loadDevices = async () => {
      if (!user?.id) return;
      
      try {
        const userDevices = await getUserDevices(user.id);
        setDevices(userDevices);
        
        // 各デバイスのメタデータを取得
        const metadataPromises = userDevices.map(device => 
          getDeviceMetadata(device.device_id)
        );
        const metadataResults = await Promise.all(metadataPromises);
        
        // メタデータをオブジェクトに格納
        const metadataMap = {};
        userDevices.forEach((device, index) => {
          if (metadataResults[index]) {
            metadataMap[device.device_id] = metadataResults[index];
          }
        });
        setDevicesMetadata(metadataMap);
      } catch (error) {
        console.error('デバイス取得エラー:', error);
        setDevices([]);
        setDevicesMetadata({});
      }
    };
    
    loadDevices();
  }, [user]);

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
    // ローカルでプレビュー表示（一時的）
  };

  const handleUploadComplete = async (croppedImageUrl) => {
    setIsUploading(true);
    try {
      // Supabase Storageにアップロード
      await uploadAvatar(croppedImageUrl);
      setShowAvatarUploader(false);
    } catch (error) {
      console.error('アップロードエラー:', error);
      // エラーメッセージはuseAvatarで設定されたものを使用
      alert(error.message || '画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
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
                  {avatarLoading ? (
                    <div className="animate-pulse bg-gray-300 w-24 h-24 rounded-full" />
                  ) : avatarUrl ? (
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
                {/* カメラアイコンオーバーレイ - アバターがある時は表示しない */}
                <div 
                  className={`absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center cursor-pointer transition-all ${
                    avatarUrl ? 'opacity-0 pointer-events-none' : ''
                  }`}
                  onClick={handleAvatarClick}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
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

          {/* アカウント詳細情報 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">アカウント情報</h3>
            <div className="space-y-3">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">ユーザーID</p>
                <p className="text-sm font-medium">{user?.id || '-'}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">メールアドレス</p>
                <p className="text-sm font-medium">{user?.email || '-'}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">電話番号</p>
                <p className="text-sm font-medium">{user?.phone || '-'}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">作成日時</p>
                <p className="text-sm font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleString('ja-JP') : '-'}
                </p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">最終ログイン</p>
                <p className="text-sm font-medium">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('ja-JP') : '-'}
                </p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">メール確認済み</p>
                <p className="text-sm font-medium">
                  {user?.email_confirmed_at ? '確認済み' : '未確認'}
                </p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">ロール</p>
                <p className="text-sm font-medium">{user?.role || 'authenticated'}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">更新日時</p>
                <p className="text-sm font-medium">
                  {user?.updated_at ? new Date(user.updated_at).toLocaleString('ja-JP') : '-'}
                </p>
              </div>
              {user?.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                <div className="pt-3">
                  <p className="text-sm text-gray-600 mb-2">ユーザーメタデータ</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(user.user_metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* 紐付けデバイス */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">紐付けデバイス</h3>
            </div>
            {devices.length > 0 ? (
              <div className="space-y-4">
                {devices.map((device, index) => (
                  <div key={device.device_id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <h4 className="font-medium text-gray-800">デバイス {index + 1}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-gray-600">デバイスID:</p>
                        <p className="font-mono text-xs break-all">{device.device_id}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-gray-600">デバイス名:</p>
                        <p>{device.device_name || '-'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-gray-600">デバイスタイプ:</p>
                        <p>{device.device_type || '-'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-gray-600">ステータス:</p>
                        <p className={`font-medium ${
                          device.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {device.status === 'active' ? '接続中' : device.status || '未接続'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-gray-600">登録日時:</p>
                        <p>{device.created_at ? new Date(device.created_at).toLocaleString('ja-JP') : '-'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-gray-600">更新日時:</p>
                        <p>{device.updated_at ? new Date(device.updated_at).toLocaleString('ja-JP') : '-'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <p className="text-gray-600">最終接続:</p>
                        <p>{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('ja-JP') : '-'}</p>
                      </div>
                      {device.model && (
                        <div className="grid grid-cols-2 gap-x-4">
                          <p className="text-gray-600">モデル:</p>
                          <p>{device.model}</p>
                        </div>
                      )}
                      {device.os_version && (
                        <div className="grid grid-cols-2 gap-x-4">
                          <p className="text-gray-600">OSバージョン:</p>
                          <p>{device.os_version}</p>
                        </div>
                      )}
                      {device.app_version && (
                        <div className="grid grid-cols-2 gap-x-4">
                          <p className="text-gray-600">アプリバージョン:</p>
                          <p>{device.app_version}</p>
                        </div>
                      )}
                      {device.metadata && Object.keys(device.metadata).length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-gray-600 mb-1">メタデータ:</p>
                          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                            {JSON.stringify(device.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {/* このデバイスの観測対象 */}
                      {devicesMetadata[device.device_id] && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="font-medium text-gray-800 mb-2">このデバイスの観測対象</h5>
                          <div className="bg-white rounded-lg p-3">
                            <div className="flex items-start space-x-3">
                              {/* 観測対象アバター */}
                              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {devicesMetadata[device.device_id].avatar_url ? (
                                  <img 
                                    src={devicesMetadata[device.device_id].avatar_url} 
                                    alt="観測対象" 
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                )}
                              </div>
                              
                              {/* 観測対象情報 */}
                              <div className="flex-1 space-y-1">
                                <div className="grid grid-cols-2 gap-x-2 text-sm">
                                  <p className="text-gray-600">名前:</p>
                                  <p className="font-medium">{devicesMetadata[device.device_id].name || '未設定'}</p>
                                </div>
                                {devicesMetadata[device.device_id].age && (
                                  <div className="grid grid-cols-2 gap-x-2 text-sm">
                                    <p className="text-gray-600">年齢:</p>
                                    <p>{devicesMetadata[device.device_id].age}歳</p>
                                  </div>
                                )}
                                {devicesMetadata[device.device_id].gender && (
                                  <div className="grid grid-cols-2 gap-x-2 text-sm">
                                    <p className="text-gray-600">性別:</p>
                                    <p>{devicesMetadata[device.device_id].gender}</p>
                                  </div>
                                )}
                                {devicesMetadata[device.device_id].notes && (
                                  <div className="mt-2">
                                    <p className="text-gray-600 text-sm">備考:</p>
                                    <p className="text-sm">{devicesMetadata[device.device_id].notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
    </PageLayout>
  );
};

export default ProfilePage;