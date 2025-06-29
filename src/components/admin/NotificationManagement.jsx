import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/dataService';

const NotificationManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    type: 'info',
    priority: 'normal',
    message: ''
  });

  // ユーザー一覧を読み込み
  useEffect(() => {
    loadUsers();
  }, []);

  // 選択されたユーザーのお知らせを読み込み
  useEffect(() => {
    if (selectedUser) {
      loadNotifications(selectedUser);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      if (usersData.length > 0) {
        setSelectedUser(usersData[0].id);
      }
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
      setError('ユーザーデータの読み込みに失敗しました');
    }
  };

  const loadNotifications = async (userId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${userId}/notifications`);
      if (!response.ok) {
        throw new Error('お知らせデータの読み込みに失敗しました');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('お知らせ読み込みエラー:', error);
      setError(error.message);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    
    if (!newNotification.message.trim()) {
      alert('メッセージを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      
      const notificationData = {
        ...newNotification,
        message: newNotification.message.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        createdAt: new Date().toISOString()
      };

      const response = await fetch(`/api/users/${selectedUser}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error('お知らせの作成に失敗しました');
      }

      // フォームをリセット
      setNewNotification({
        type: 'info',
        priority: 'normal',
        message: ''
      });
      setShowCreateForm(false);

      // お知らせリストを再読み込み
      await loadNotifications(selectedUser);
      
      alert('お知らせが正常に作成されました');
    } catch (error) {
      console.error('お知らせ作成エラー:', error);
      alert('お知らせの作成中にエラーが発生しました: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('このお知らせを削除しますか？')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/users/${selectedUser}/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('お知らせの削除に失敗しました');
      }

      // お知らせリストを再読み込み
      await loadNotifications(selectedUser);
      
      alert('お知らせが正常に削除されました');
    } catch (error) {
      console.error('お知らせ削除エラー:', error);
      alert('お知らせの削除中にエラーが発生しました: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    const types = {
      info: '情報',
      warning: '警告',
      success: '成功',
      error: 'エラー'
    };
    return types[type] || type;
  };

  const getPriorityLabel = (priority) => {
    const priorities = {
      low: '低',
      normal: '通常',
      high: '高',
      urgent: '緊急'
    };
    return priorities[priority] || priority;
  };

  const getTypeColor = (type) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">お知らせ管理</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showCreateForm ? 'キャンセル' : '新しいお知らせを作成'}
        </button>
      </div>

      {/* ユーザー選択 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          対象ユーザーを選択
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.id})
            </option>
          ))}
        </select>
      </div>

      {/* お知らせ作成フォーム */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">新しいお知らせを作成</h3>
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  種別
                </label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">情報</option>
                  <option value="warning">警告</option>
                  <option value="success">成功</option>
                  <option value="error">エラー</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優先度
                </label>
                <select
                  value={newNotification.priority}
                  onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">低</option>
                  <option value="normal">通常</option>
                  <option value="high">高</option>
                  <option value="urgent">緊急</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メッセージ
              </label>
              <textarea
                value={newNotification.message}
                onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="お知らせの内容を入力してください..."
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* お知らせ一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedUser && users.find(u => u.id === selectedUser)?.name}のお知らせ一覧
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">
            読み込み中...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            お知らせがありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                        {getTypeLabel(notification.type)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                        {getPriorityLabel(notification.priority)}
                      </span>
                      {notification.isRead && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          既読
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      作成日時: {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    disabled={isLoading}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManagement; 