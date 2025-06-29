import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, updateUser, deleteUser } from '../services/dataService';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // 初期値として仮のユーザーデータを設定
  const [user, setUser] = useState({
    id: '',
    name: '',
    birthDate: '',
    age: 0,
    gender: '男',
    organization: '',
    notes: '',
    profileImageUrl: '',
    type: 'normal'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 性別の選択肢
  const genderOptions = ['男', '女', 'その他'];

  // ユーザーIDを使ってユーザー情報を取得
  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await getUser(userId);
      setUser(userData);
    } catch (error) {
      console.error('ユーザーデータ取得エラー:', error);
      setError('ユーザー情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 入力フィールドの変更を処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 生年月日が変更された場合は年齢も自動計算
    if (name === 'birthDate') {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setUser(prev => ({
        ...prev,
        [name]: value,
        age
      }));
    } else {
      setUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      await updateUser(user.id, user);
      alert('ユーザー情報を保存しました');
    } catch (error) {
      console.error('ユーザーデータ保存エラー:', error);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ユーザー削除処理
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      const deletedUser = await deleteUser(user.id);
      alert(`ユーザー「${deletedUser.name}」を削除しました`);
      navigate('/admin');
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      setError('削除に失敗しました: ' + error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* ヘッダー */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">ユーザープロフィール編集</h1>
              <button
                onClick={() => navigate('/admin')}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                アカウント一覧に戻る
              </button>
            </div>
          </div>

          {/* ローディング表示 */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">ユーザー情報を読み込み中...</span>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={loadUser}
                      className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    >
                      再試行
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* フォーム */}
          {!isLoading && !error && (
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="mb-6 flex justify-center">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="h-32 w-32 rounded-full object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-medium">
                    {user.name ? user.name.charAt(0) : '?'}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">名前</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={user.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">生年月日</label>
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={user.birthDate}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">年齢</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={user.age}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="120"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">性別</label>
                  <div className="mt-2 space-x-4 flex">
                    {genderOptions.map(option => (
                      <div key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={option}
                          name="gender"
                          value={option}
                          checked={user.gender === option}
                          onChange={handleChange}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <label htmlFor={option} className="ml-2 block text-sm text-gray-700">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700">所属</label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={user.organization}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">認知・性格特記欄</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    value={user.notes}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="profileImageUrl" className="block text-sm font-medium text-gray-700">アイコン画像URL</label>
                  <input
                    type="text"
                    id="profileImageUrl"
                    name="profileImageUrl"
                    value={user.profileImageUrl}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/avatars/avatar-userId.png"
                  />
                </div>

                <div>
                  <label htmlFor="id" className="block text-sm font-medium text-gray-700">内部ID（変更不可）</label>
                  <input
                    type="text"
                    id="id"
                    value={user.id}
                    className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    readOnly
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">アカウントタイプ</label>
                  <select
                    id="type"
                    name="type"
                    value={user.type}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="master">マスターアカウント</option>
                    <option value="normal">通常アカウント</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                {/* 削除ボタン（左側） */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting || isSaving}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  このアカウントを削除
                </button>

                {/* 保存・キャンセルボタン（右側） */}
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isDeleting}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isSaving || isDeleting
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {isSaving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        保存中...
                      </div>
                    ) : (
                      '保存'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* 削除確認モーダル */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">アカウントの削除</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    ユーザー「<span className="font-medium text-gray-900">{user.name}</span>」を削除しますか？
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    この操作は取り消すことができません。ユーザーのすべてのデータが削除されます。
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          削除中...
                        </div>
                      ) : (
                        '削除する'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail; 