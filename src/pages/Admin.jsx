import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/admin/UserManagement';
import DataUpload from '../components/admin/DataUpload';
import NotificationManagement from '../components/admin/NotificationManagement';
import { getAllUsers, createUser, updateUser, isDev } from '../services/dataService';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // コンポーネントマウント時にサーバーからユーザーデータを読み込む
  useEffect(() => {
    // localStorageのクリーンアップ（サーバーサイドに統一するため）
    const cleanupLocalStorage = () => {
      const keys = ['watchme_users'];
      keys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`localStorageから削除しました: ${key}`);
        }
      });
    };

    cleanupLocalStorage();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const usersData = await getAllUsers();
      setUsers(usersData);
      console.log('サーバーからユーザーデータを取得しました:', usersData);
    } catch (error) {
      console.error('ユーザーデータ読み込みエラー:', error);
      setError('ユーザーデータの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAddUser = async (newUser) => {
    try {
      setIsLoading(true);
      
      // プロファイル画像の処理を統一
      const processedUser = {
        ...newUser,
        // profileImageフィールドは削除（統一のため）
        profileImage: undefined,
        // ユーザーが指定したURLを優先、なければデフォルト画像を生成
        profileImageUrl: newUser.profileImageUrl && newUser.profileImageUrl.trim() 
          ? newUser.profileImageUrl.trim()
          : `/avatars/avatar-${newUser.name.charAt(0)}.png`
      };
      
      // サーバーAPIでユーザーを作成
      const createdUser = await createUser(processedUser);
      console.log('ユーザーが正常に追加されました:', createdUser);
      
      // ユーザーリストを再読み込み
      await loadUsers();
      
      alert('ユーザーが正常に追加されました');
    } catch (error) {
      console.error('ユーザー追加エラー:', error);
      alert('ユーザーの追加中にエラーが発生しました: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザーデータ更新ハンドラ（UserManagementから呼び出される）
  const handleUpdateUser = async (updatedUser) => {
    try {
      setIsLoading(true);
      
      // サーバーAPIでユーザーを更新
      await updateUser(updatedUser.id, updatedUser);
      console.log('ユーザーが正常に更新されました:', updatedUser);
      
      // ユーザーリストを再読み込み
      await loadUsers();
      
      alert('ユーザー情報が正常に更新されました');
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      alert('ユーザーの更新中にエラーが発生しました: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // プロダクション環境での警告表示
  if (!isDev) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  読み取り専用モード
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    プロダクション環境では管理機能は無効化されています。
                    データの閲覧のみ可能です。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ユーザー一覧（読み取り専用）</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.profileImageUrl || `/avatars/avatar-${user.name?.charAt(0) || 'default'}.png`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold"
                      style={{ display: 'none' }}
                    >
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">ID: {user.id}</p>
                      <p className="text-sm text-gray-500">{user.organization}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">年齢: {user.age}歳</p>
                      <p className="text-sm text-gray-500">性別: {user.gender}</p>
                    </div>
                  </div>
                  {user.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{user.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WatchMe 管理画面</h1>
              <p className="mt-2 text-sm text-gray-600">ユーザープロファイルとデータの管理</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                ユーザー管理
              </button>
              <button
                onClick={() => handleTabChange('data')}
                className={`${
                  activeTab === 'data'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                データアップロード
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                className={`${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                お知らせ管理
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">読み込み中...</div>
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-8">
                {error}
                <button 
                  onClick={loadUsers}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  再試行
                </button>
              </div>
            ) : activeTab === 'users' ? (
              <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} />
            ) : activeTab === 'data' ? (
              <DataUpload users={users} />
            ) : (
              <NotificationManagement />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin; 