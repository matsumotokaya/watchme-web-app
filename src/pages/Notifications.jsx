import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUserNotifications, updateNotificationReadStatus, markAllNotificationsAsRead } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';
import PageLayout from '../layouts/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 通知を取得
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log('通知取得開始 - ユーザーID:', user.id);
        const userNotifications = await getUserNotifications(user.id);
        console.log('取得した通知:', userNotifications);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('通知取得エラー:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user?.id]);

  // 既読状態を更新
  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateNotificationReadStatus(notificationId, true);
      
      // ローカル状態を更新
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('既読状態更新エラー:', error);
    }
  };

  // すべて既読にする
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      
      // ローカル状態を更新
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('一括既読エラー:', error);
    }
  };

  // 通知の種類によってアイコンを返す関数
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement':
        return '📢';
      case 'event':
        return '📅';
      case 'system':
        return '⚙️';
      case 'emotion':
        return '🔹';
      case 'behavior':
        return '📊';
      case 'pattern':
        return '📈';
      case 'master':
        return '👤';
      case 'info':
        return '💡';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '🔔';
    }
  };

  // 時刻を相対的な表示に変換する関数
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    // 1週間以上前は日付表示
    return notificationTime.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // バッジの色を決定する関数
  const getBadgeVariant = (type) => {
    switch (type) {
      case 'announcement': return 'primary';
      case 'event': return 'info';
      case 'system': return 'default';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <PageLayout
      title="通知"
      backTo="/dashboard"
      rightContent={
        unreadCount > 0 ? (
          <Button onClick={handleMarkAllAsRead} size="sm">
            すべて既読にする ({unreadCount})
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              highlighted={!notification.is_read}
              hover
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {notification.title && (
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{notification.title}</h3>
                      )}
                      <p className="text-gray-800 leading-relaxed">{notification.message}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                        {notification.type && (
                          <Badge variant={getBadgeVariant(notification.type)}>
                            {notification.type}
                          </Badge>
                        )}
                        {!notification.is_read && (
                          <Badge variant="primary">
                            未読
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        既読にする
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="通知はありません"
          description="新しい通知が届くとここに表示されます。"
        />
      )}
    </PageLayout>
  );
};

export default Notifications; 