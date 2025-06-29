import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications } from '../services/notificationService';

const MobileLayout = ({ children, userData, activeTab, onTabChange, headerContent, dateNavigation }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // localStorageのクリーンアップ（初回のみ実行）
  useEffect(() => {
    const cleanupLocalStorage = () => {
      const keysToRemove = ['watchme_users'];
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`localStorageから削除しました: ${key}`);
        }
      });
    };

    // 一度だけ実行するためのフラグをチェック
    const cleanupDone = sessionStorage.getItem('watchme_cleanup_done');
    if (!cleanupDone) {
      cleanupLocalStorage();
      sessionStorage.setItem('watchme_cleanup_done', 'true');
    }
  }, []);
  
  // ユーザーのお知らせを取得
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userData?.id) return;
      
      try {
        setIsLoadingNotifications(true);
        const userNotifications = await getUserNotifications(userData.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('お知らせ取得エラー:', error);
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    
    fetchNotifications();
  }, [userData?.id]);
  
  // 通知のダミーデータ（フォールバック用）
  const fallbackNotifications = [
    {
      id: 1,
      type: 'emotion',
      message: '本日13:42、怒りの感情が通常よりも高く記録されました。深呼吸などで落ち着く時間を作ってみましょう。',
      time: '1時間前'
    },
    {
      id: 2,
      type: 'behavior',
      message: 'ため息が本日11回を記録しました（通常は1〜3回）。疲れが蓄積している可能性があります。',
      time: '3時間前'
    },
    {
      id: 3,
      type: 'pattern',
      message: 'WatchMe記録開始以来、最も安定した感情傾向（変動幅±15以下）を記録しました。',
      time: '今日 09:30'
    },
    {
      id: 4,
      type: 'master',
      message: 'お子さまの今日の感情傾向に強いネガティブシフトが見られました（-72）。声かけやリラックスの時間が有効かもしれません。',
      time: '昨日 18:25'
    },
    {
      id: 5,
      type: 'emotion',
      message: '今日の平均感情スコアが -62 を記録し、今週で最も低い1日となりました。',
      time: '昨日 21:10'
    },
    {
      id: 6,
      type: 'behavior',
      message: '笑い声が18回検出され、記録開始以来の最多回数となりました。',
      time: '2日前'
    },
    {
      id: 7,
      type: 'emotion',
      message: '今朝7:15、感情スコアが急上昇。前日との落差が大きいため、何かポジティブな出来事があったかもしれません。',
      time: '2日前'
    },
    {
      id: 8,
      type: 'pattern',
      message: '怒りのピーク時間がこれまでの午後から午前にシフトしています。',
      time: '3日前'
    },
    {
      id: 9,
      type: 'master',
      message: '感情記録に連続的なポジティブ傾向が見られ、安定している様子です。',
      time: '3日前'
    },
    {
      id: 10,
      type: 'behavior',
      message: '午後に独り言の頻度が増加しています。集中または緊張が続いていた可能性があります。',
      time: '4日前'
    },
    {
      id: 11,
      type: 'emotion',
      message: '本日20:30頃、感情が急に沈み込みました。継続的に同じ時間帯に変化が見られます。',
      time: '5日前'
    },
    {
      id: 12,
      type: 'pattern',
      message: '1日を通じて感情スコアが±10以内に収まり、落ち着いた日だったようです。',
      time: '6日前'
    },
    {
      id: 13,
      type: 'master',
      message: '音響的に「緊張状態」と判定されるシーンが連続して検出されています（午後2回）。',
      time: '1週間前'
    },
    {
      id: 14,
      type: 'emotion',
      message: '感情スコアの変動幅が過去3日で最も大きく、不安定傾向が見られました。',
      time: '1週間前'
    },
    {
      id: 15,
      type: 'behavior',
      message: '午前中の沈黙時間が長く、発話数が平均の半分以下でした。',
      time: '先週'
    }
  ];
  
  // 通知の種類によってアイコンを返す関数
  const getNotificationIcon = (type) => {
    switch (type) {
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

  // 表示用のお知らせデータ（実際のデータまたはフォールバック）
  const displayNotifications = notifications.length > 0 ? notifications : (userData?.id ? [] : fallbackNotifications);
  
  // 未読のお知らせ数を計算
  const unreadCount = displayNotifications.filter(n => !n.isRead && !n.read).length;

  // お知らせページに遷移
  const handleNotificationClick = () => {
    if (userData?.id) {
      navigate(`/notifications/${userData.id}`);
    } else {
      navigate('/notifications');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* ヘッダー - 上部に固定 */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-20">
        <div className="max-w-screen-lg mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {headerContent}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* お知らせアイコン */}
              <div className="relative">
                <button 
                  className="relative p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors"
                  onClick={handleNotificationClick}
                  aria-label="お知らせ"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* 通知バッジ - 未読がある場合のみ表示 */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* 日付ナビゲーション - ヘッダーとコンテンツの間に固定 */}
      {dateNavigation && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-10">
          {dateNavigation}
        </div>
      )}
      
      {/* メインコンテンツ - ヘッダーとフッターの間にスクロール可能領域として配置 */}
      <main className={`flex-grow overflow-y-auto ${dateNavigation ? 'pt-14' : 'pt-14'} pb-20`}>
        <div className="max-w-screen-lg mx-auto px-4 py-4">
          {children}
        </div>
      </main>
      
      {/* フッターナビゲーション - 下部に固定 */}
      <footer className="bg-white shadow-lg border-t border-gray-200 fixed bottom-0 left-0 right-0 z-20">
        <nav className="max-w-screen-lg mx-auto">
          <ul className="flex justify-around">
            <li className="flex-1">
              <button
                onClick={() => onTabChange('timeline')}
                className={`w-full py-3 flex flex-col items-center ${
                  activeTab === 'timeline' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="mt-1 text-xs font-medium">心理グラフ</span>
              </button>
            </li>
            <li className="flex-1">
              <button
                onClick={() => onTabChange('logs')}
                className={`w-full py-3 flex flex-col items-center ${
                  activeTab === 'logs' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="mt-1 text-xs font-medium">行動グラフ</span>
              </button>
            </li>
            <li className="flex-1">
              <button
                onClick={() => onTabChange('distribution')}
                className={`w-full py-3 flex flex-col items-center ${
                  activeTab === 'distribution' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <span className="mt-1 text-xs font-medium">感情グラフ</span>
              </button>
            </li>
            <li className="flex-1">
              <button
                onClick={() => onTabChange('profile')}
                className={`w-full py-3 flex flex-col items-center ${
                  activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="mt-1 text-xs font-medium">プロフィール</span>
              </button>
            </li>
          </ul>
        </nav>
      </footer>


    </div>
  );
};

export default MobileLayout; 