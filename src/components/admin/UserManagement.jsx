import { useState } from 'react';
import { Link } from 'react-router-dom';

const UserManagement = ({ users, onAddUser, onUpdateUser }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    birthDate: '',
    age: 0,
    gender: '男',
    organization: '',
    notes: '',
    profileImageUrl: '',
    type: 'normal',
    parentId: ''
  });

  // マスターアカウントのみを取得
  const masterUsers = users.filter(user => user.type === 'master');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 通常アカウントの場合は親アカウントが必須
    if (newUser.type === 'normal' && !newUser.parentId) {
      alert('通常アカウントには親アカウントの選択が必須です');
      return;
    }
    
    // マスターアカウントの場合はparentIdを削除
    const userData = { ...newUser };
    if (userData.type === 'master') {
      delete userData.parentId;
    }
    
    onAddUser(userData);
    setNewUser({
      name: '',
      birthDate: '',
      age: 0,
      gender: '男',
      organization: '',
      notes: '',
      profileImageUrl: '',
      type: 'normal',
      parentId: ''
    });
    setShowAddForm(false);
  };

  // 親アカウント名を取得する関数
  const getParentName = (parentId) => {
    const parent = users.find(user => user.id === parentId);
    return parent ? parent.name : '不明';
  };

  // 子アカウント数を取得する関数
  const getChildrenCount = (user) => {
    if (user.type === 'master' && user.childrenIds) {
      return user.childrenIds.length;
    }
    return 0;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">ユーザープロファイル管理</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'キャンセル' : 'ユーザー追加'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="text-md font-medium text-gray-700 mb-4">新規ユーザープロファイル</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザー名
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生年月日
                </label>
                <input
                  type="date"
                  value={newUser.birthDate}
                  onChange={(e) => setNewUser({ ...newUser, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年齢
                </label>
                <input
                  type="number"
                  value={newUser.age}
                  onChange={(e) => setNewUser({ ...newUser, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性別
                </label>
                <select
                  value={newUser.gender}
                  onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属組織
                </label>
                <input
                  type="text"
                  value={newUser.organization}
                  onChange={(e) => setNewUser({ ...newUser, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={newUser.notes}
                  onChange={(e) => setNewUser({ ...newUser, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  プロファイル画像URL（オプション）
                </label>
                <input
                  type="text"
                  value={newUser.profileImageUrl || ''}
                  onChange={(e) => setNewUser({ ...newUser, profileImageUrl: e.target.value })}
                  placeholder="例: /avatars/custom-avatar.png（空欄の場合は自動生成）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  画像URLを指定しない場合、名前の頭文字を使ったデフォルト画像が自動生成されます
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  アカウントタイプ
                </label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({ ...newUser, type: e.target.value, parentId: e.target.value === 'master' ? '' : newUser.parentId })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="master">マスターアカウント</option>
                  <option value="normal">通常アカウント</option>
                </select>
              </div>
              
              {newUser.type === 'normal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    親アカウント <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUser.parentId}
                    onChange={(e) => setNewUser({ ...newUser, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">親アカウントを選択してください</option>
                    {masterUsers.map((master) => (
                      <option key={master.id} value={master.id}>
                        {master.name} ({master.id})
                      </option>
                    ))}
                  </select>
                  {masterUsers.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      通常アカウントを作成するには、先にマスターアカウントを作成してください
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  disabled={newUser.type === 'normal' && masterUsers.length === 0}
                >
                  ユーザーを追加
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                ユーザー
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                ID
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                アカウントタイプ
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                関係
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">アクション</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium" 
                      style={{ display: user.profileImageUrl ? 'none' : 'flex' }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {user.id}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.type === 'master'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.type === 'master' ? 'マスター' : '通常'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {user.type === 'master' ? (
                    <span className="text-blue-600">
                      子アカウント: {getChildrenCount(user)}人
                    </span>
                  ) : user.parentId ? (
                    <span className="text-green-600">
                      親: {getParentName(user.parentId)}
                    </span>
                  ) : (
                    <span className="text-gray-400">関係なし</span>
                  )}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <Link 
                    to={`/admin/user/${user.id}`} 
                    className="text-blue-600 hover:text-blue-900"
                  >
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement; 