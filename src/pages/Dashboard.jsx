import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import SwipeableViews from 'react-swipeable-views';
import MobileLayout from '../layouts/MobileLayout';
import EmotionTimeline from '../components/dashboard/EmotionTimeline';
import EventLogs from '../components/dashboard/EventLogs';
// import EmotionDistribution from '../components/dashboard/EmotionDistribution'; // 🗑️ 削除予定: 使用されていない感情分布コンポーネント
import EmotionGraph from '../components/dashboard/EmotionGraph';
import ProfileView from '../components/dashboard/ProfileView';
import DateNavigation from '../components/common/DateNavigation';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  getAllUsers, 
  getEmotionTimelineData, 
  getEventLogsData 
  // getEmotionDistributionData // 🗑️ 削除予定: 使用されていない感情分布API
} from '../services/dataService';
import { getTodayString } from '../utils/dateUtils';
import { validateEmotionTimelineData } from '../utils/emotionDataValidator';
import { 
  useErrorHandler, 
  handleError, 
  handleValidationError, 
  getUserFriendlyMessage,
  ERROR_CATEGORIES,
  ERROR_LEVELS
} from '../utils/errorHandler';

// デフォルトの利用可能なユーザーリスト（ファイルシステムにデータがない場合に使用）
const defaultUsers = [
  { id: 'user123', name: '佐藤由紀子', type: 'master', childrenIds: ['user456', 'user789'] },
  { id: 'user456', name: '佐藤あやか', type: 'normal', parentId: 'user123' },
  { id: 'user789', name: '佐藤みなと', type: 'normal', parentId: 'user123' }
];

// データ検証とサニタイゼーション関数（統一エラーハンドラー対応）
const validateAndSanitizeData = (data, dataType) => {
  console.log(`Validating ${dataType} data:`, data);
  
  if (!data || typeof data !== 'object') {
    const error = handleValidationError(
      dataType,
      data,
      'データがオブジェクトではありません',
      { shouldLog: true }
    );
    return null;
  }
  
  try {
    // データタイプごとの基本的な検証
    switch (dataType) {
      case 'emotion-timeline':
        return validateEmotionTimelineData(data);
        
      case 'event-logs':
        if (!data.behaviorCounts) {
          handleValidationError(
            'behaviorCounts',
            data.behaviorCounts,
            'event-logsデータにbehaviorCountsがありません'
          );
          return null;
        }
        // 行動カウントの検証
        if (Array.isArray(data.behaviorCounts)) {
          data.behaviorCounts = data.behaviorCounts.filter(item => 
            item && typeof item.type === 'string' && typeof item.count === 'number'
          );
        }
        break;
        
      // case 'emotion-distribution': // 🗑️ 削除予定: 使用されていない感情分布データ
      //   if (!data.emotionDistribution) {
      //     handleValidationError(
      //       'emotionDistribution',
      //       data.emotionDistribution,
      //       'emotion-distributionデータにemotionDistributionがありません'
      //     );
      //     return null;
      //   }
      //   // 感情分布の検証
      //   if (Array.isArray(data.emotionDistribution)) {
      //     data.emotionDistribution = data.emotionDistribution.map(item => {
      //       if (!item || typeof item.percentage !== 'number') {
      //         handleValidationError(
      //           'emotionDistribution.percentage',
      //           item?.percentage,
      //           '無効な感情分布アイテム'
      //         );
      //         return { ...item, percentage: 0 };
      //       }
      //       // パーセンテージが異常値の場合は修正
      //       if (item.percentage < 0 || item.percentage > 100) {
      //         handleValidationError(
      //           'emotionDistribution.percentage',
      //           item.percentage,
      //           'パーセンテージ値が範囲外'
      //         );
      //         return { ...item, percentage: Math.max(0, Math.min(100, item.percentage)) };
      //       }
      //       return item;
      //     });
      //   }
      //   break;
    }
    
    console.log(`Validated ${dataType} data:`, data);
    return data;
  } catch (error) {
    const handledError = handleError(
      error,
      ERROR_CATEGORIES.VALIDATION,
      `データ検証: ${dataType}`,
      {
        level: ERROR_LEVELS.ERROR,
        shouldLog: true,
        additionalContext: { dataType, dataKeys: Object.keys(data || {}) }
      }
    );
    return null;
  }
};

// 巨大なvalidateEmotionTimelineData関数とcreateFlllbackEmotionData関数は
// /src/utils/emotionDataValidator.js に移動されました。

const Dashboard = () => {
  console.log('==== Dashboard コンポーネント開始 ====');
  
  const [searchParams] = useSearchParams();
  
  // 統一エラーハンドラーの初期化
  const dashboardErrorHandler = useErrorHandler('Dashboard');
  
  // グローバルエラーハンドラー（統一システム対応）
  useEffect(() => {
    const handleGlobalError = (error) => {
      dashboardErrorHandler(error, {
        source: 'window.error',
        type: 'global'
      });
    };
    
    const handleUnhandledRejection = (event) => {
      dashboardErrorHandler(event.reason, {
        source: 'unhandledrejection',
        type: 'promise'
      });
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [dashboardErrorHandler]);
  
  // 利用可能なユーザーリスト
  const [availableUsers, setAvailableUsers] = useState(defaultUsers);
  // 現在選択されているユーザー
  const [currentUser, setCurrentUser] = useState(defaultUsers[0]);
  // アカウント選択ドロップダウンの表示状態
  const [showUserSelector, setShowUserSelector] = useState(false);
  
  // ナビゲーション関連
  const [activeTab, setActiveTab] = useState('timeline');
  const [swipeIndex, setSwipeIndex] = useState(0);
  const navigate = useNavigate();
  
  // 日付管理
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  
  // 各グラフのデータ
  const [emotionTimelineData, setEmotionTimelineData] = useState(null);
  const [eventLogsData, setEventLogsData] = useState(null);
  // const [emotionDistributionData, setEmotionDistributionData] = useState(null); // 🗑️ 削除予定: 使用されていない感情分布データ
  const [isLoading, setIsLoading] = useState(true);

  console.log('Dashboard 初期化:', {
    currentUser: currentUser?.id,
    activeTab,
    swipeIndex,
    emotionTimelineData: emotionTimelineData ? 'あり' : 'なし',
    eventLogsData: eventLogsData ? 'あり' : 'なし',
    // emotionDistributionData: emotionDistributionData ? 'あり' : 'なし', // 🗑️ 削除予定
    isLoading
  });

  // ファイルシステムからユーザーデータを読み込む
  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log('ユーザー情報を取得中...');
        const users = await getAllUsers();
        console.log('取得したユーザー情報:', users);
        
        // URLパラメータからユーザーIDを取得
        const userIdFromUrl = searchParams.get('userId');
        
        if (users.length > 0) {
          // URLパラメータで指定されたユーザーを探す
          const targetUser = userIdFromUrl ? users.find(u => u.id === userIdFromUrl) : null;
          const selectedUser = targetUser || users[0];
          
          // 親子関係を考慮してavailableUsersを設定
          let availableUsersList = [];
          
          if (selectedUser.type === 'master') {
            // マスターアカウントの場合：自分と子アカウントを表示
            availableUsersList.push(selectedUser);
            
            if (selectedUser.childrenIds && selectedUser.childrenIds.length > 0) {
              const childUsers = users.filter(u => selectedUser.childrenIds.includes(u.id));
              availableUsersList.push(...childUsers);
            }
            
            console.log('マスターアカウント - 表示可能ユーザー:', availableUsersList.map(u => u.name));
          } else if (selectedUser.type === 'normal') {
            // 通常アカウントの場合：自分のみ表示
            availableUsersList.push(selectedUser);
            console.log('通常アカウント - 表示可能ユーザー:', [selectedUser.name]);
          } else {
            // タイプが不明な場合は全ユーザーを表示（後方互換性）
            availableUsersList = users;
            console.log('不明なアカウントタイプ - 全ユーザーを表示');
          }
          
          setAvailableUsers(availableUsersList);
          setCurrentUser(selectedUser);
          console.log('ユーザー情報を設定しました:', selectedUser);
        } else {
          // ファイルシステムにユーザーがない場合はデフォルトユーザーを使用
          console.log('ファイルシステムにユーザーがないため、デフォルトユーザーを使用');
          
          // URLパラメータで指定されたユーザーを探す
          const targetUser = userIdFromUrl ? defaultUsers.find(u => u.id === userIdFromUrl) : null;
          const selectedUser = targetUser || defaultUsers[0];
          
          // デフォルトユーザーでも親子関係を考慮
          let availableUsersList = [];
          
          if (selectedUser.type === 'master') {
            // マスターアカウントの場合：自分と子アカウントを表示
            availableUsersList = defaultUsers.filter(u => 
              u.id === selectedUser.id || 
              (u.type === 'normal' && u.parentId === selectedUser.id)
            );
          } else if (selectedUser.type === 'normal') {
            // 通常アカウントの場合：自分のみ表示
            availableUsersList = [selectedUser];
          } else {
            // タイプが不明な場合は全ユーザーを表示
            availableUsersList = defaultUsers;
          }
          
          setAvailableUsers(availableUsersList);
          setCurrentUser(selectedUser);
        }
      } catch (error) {
        console.error('ユーザーデータ読み込みエラー:', error);
        console.log('エラーのため、デフォルトユーザーを使用');
        // エラー時はデフォルトユーザーを使用
        setAvailableUsers(defaultUsers);
        setCurrentUser(defaultUsers[0]);
      }
    };
    
    loadUsers();
  }, [searchParams]);

  // データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const userId = currentUser.id;
        console.log('データ取得開始 - ユーザーID:', userId, '対象日付:', selectedDate);
        
        // 各グラフのデータを並列で取得（感情分布は除外）
        const [timelineData, logsData] = await Promise.allSettled([
          getEmotionTimelineData(userId, selectedDate),
          getEventLogsData(userId, selectedDate)
          // getEmotionDistributionData(userId, selectedDate) // 🗑️ 削除予定: 使用されていない感情分布API
        ]);
        
        console.log('並列データ取得結果:');
        console.log('- 感情タイムライン:', timelineData.status);
        console.log('- 行動ログ:', logsData.status);
        // console.log('- 感情分布:', distributionData.status); // 🗑️ 削除予定
        
        // 取得結果を処理
        let finalTimelineData = null;
        let finalLogsData = null;
        // let finalDistributionData = null; // 🗑️ 削除予定
        
        // 感情タイムラインデータの処理
        if (timelineData.status === 'fulfilled' && timelineData.value) {
          finalTimelineData = validateAndSanitizeData(timelineData.value, 'emotion-timeline');
          console.log('✅ 感情タイムラインデータ取得成功');
        } else {
          console.log('❌ 感情タイムラインデータ取得失敗:', timelineData.reason?.message || 'データなし');
        }
        
        // 行動ログデータの処理
        if (logsData.status === 'fulfilled' && logsData.value) {
          finalLogsData = validateAndSanitizeData(logsData.value, 'event-logs');
          console.log('✅ 行動ログデータ取得成功');
        } else {
          console.log('❌ 行動ログデータ取得失敗:', logsData.reason?.message || 'データなし');
        }
        
        // 感情分布データの処理 - 🗑️ 削除予定: 使用されていない
        // if (distributionData.status === 'fulfilled' && distributionData.value) {
        //   finalDistributionData = validateAndSanitizeData(distributionData.value, 'emotion-distribution');
        //   console.log('✅ 感情分布データ取得成功');
        // } else {
        //   console.log('❌ 感情分布データ取得失敗:', distributionData.reason?.message || 'データなし');
        // }
        
        console.log('最終データ状況:', {
          timelineData: finalTimelineData ? 'あり' : 'なし',
          logsData: finalLogsData ? 'あり' : 'なし'
          // distributionData: finalDistributionData ? 'あり' : 'なし' // 🗑️ 削除予定
        });
        
        // ステートを更新
        setEmotionTimelineData(finalTimelineData);
        setEventLogsData(finalLogsData);
        // setEmotionDistributionData(finalDistributionData); // 🗑️ 削除予定
        
      } catch (error) {
        console.error('データ取得エラー:', error);
        // エラー時もnullのままにして、各コンポーネントで「データなし」メッセージを表示
        setEmotionTimelineData(null);
        setEventLogsData(null);
        // setEmotionDistributionData(null); // 🗑️ 削除予定
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser && currentUser.id) {
      fetchData();
    }
  }, [currentUser.id, selectedDate]); // ユーザーIDまたは選択日付が変更されたら再取得
  
  useEffect(() => {
    // URLに基づいてアクティブなタブとスワイプインデックスを設定
    const path = window.location.pathname;
    if (path.includes('/dashboard/events')) {
      setActiveTab('events');
      setSwipeIndex(1);
    } else if (path.includes('/dashboard/distribution')) {
      setActiveTab('distribution');
      setSwipeIndex(2);
    } else if (path.includes('/dashboard/profile')) {
      setActiveTab('profile');
      setSwipeIndex(3);
    } else {
      setActiveTab('timeline');
      setSwipeIndex(0);
    }
  }, []);
  
  // アカウント切り替えハンドラー
  const handleUserChange = (user) => {
    setCurrentUser(user);
    setShowUserSelector(false);
  };

  // 日付変更ハンドラー
  const handleDateChange = (newDate) => {
    console.log('日付変更:', selectedDate, '->', newDate);
    setSelectedDate(newDate);
  };
  
  // データ更新ハンドラー（ProfileViewからの通知を受け取る）
  const handleDataUpdate = async (updatedDate) => {
    console.log('データ更新通知を受信:', updatedDate);
    
    // 更新された日付が現在選択されている日付と同じ場合のみ再読み込み
    if (updatedDate === selectedDate) {
      console.log('現在選択中の日付のデータが更新されたため、再読み込みを実行');
      setIsLoading(true);
      
      try {
        const userId = currentUser.id;
        console.log('データ再読み込み開始 - ユーザーID:', userId, '対象日付:', updatedDate);
        
        // 各グラフのデータを並列で再取得（感情分布は除外）
        const [timelineData, logsData] = await Promise.allSettled([
          getEmotionTimelineData(userId, updatedDate),
          getEventLogsData(userId, updatedDate)
          // getEmotionDistributionData(userId, updatedDate) // 🗑️ 削除予定
        ]);
        
        console.log('並列データ再取得結果:');
        console.log('- 感情タイムライン:', timelineData.status);
        console.log('- 行動ログ:', logsData.status);
        // console.log('- 感情分布:', distributionData.status); // 🗑️ 削除予定
        
        // 取得結果を処理
        let finalTimelineData = null;
        let finalLogsData = null;
        // let finalDistributionData = null; // 🗑️ 削除予定
        
        // 感情タイムラインデータの処理
        if (timelineData.status === 'fulfilled' && timelineData.value) {
          finalTimelineData = validateAndSanitizeData(timelineData.value, 'emotion-timeline');
          console.log('✅ 感情タイムラインデータ再取得成功');
        } else {
          console.log('❌ 感情タイムラインデータ再取得失敗:', timelineData.reason?.message || 'データなし');
        }
        
        // 行動ログデータの処理
        if (logsData.status === 'fulfilled' && logsData.value) {
          finalLogsData = validateAndSanitizeData(logsData.value, 'event-logs');
          console.log('✅ 行動ログデータ再取得成功');
        } else {
          console.log('❌ 行動ログデータ再取得失敗:', logsData.reason?.message || 'データなし');
        }
        
        // 感情分布データの処理 - 🗑️ 削除予定
        // if (distributionData.status === 'fulfilled' && distributionData.value) {
        //   finalDistributionData = validateAndSanitizeData(distributionData.value, 'emotion-distribution');
        //   console.log('✅ 感情分布データ再取得成功');
        // } else {
        //   console.log('❌ 感情分布データ再取得失敗:', distributionData.reason?.message || 'データなし');
        // }
        
        console.log('更新後の最終データ状況:', {
          timelineData: finalTimelineData ? 'あり' : 'なし',
          logsData: finalLogsData ? 'あり' : 'なし'
          // distributionData: finalDistributionData ? 'あり' : 'なし' // 🗑️ 削除予定
        });
        
        // ステートを更新
        setEmotionTimelineData(finalTimelineData);
        setEventLogsData(finalLogsData);
        // setEmotionDistributionData(finalDistributionData); // 🗑️ 削除予定
        
      } catch (error) {
        console.error('データ再読み込みエラー:', error);
        // エラー時もnullのままにして、各コンポーネントで「データなし」メッセージを表示
        setEmotionTimelineData(null);
        setEventLogsData(null);
        // setEmotionDistributionData(null); // 🗑️ 削除予定
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('更新された日付が現在選択中の日付と異なるため、再読み込みをスキップ');
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'timeline':
        setSwipeIndex(0);
        navigate('/dashboard');
        break;
      case 'logs':
        setSwipeIndex(1);
        navigate('/dashboard/events');
        break;
      case 'distribution':
        setSwipeIndex(2);
        navigate('/dashboard/distribution');
        break;
      case 'profile':
        setSwipeIndex(3);
        navigate('/dashboard/profile');
        break;
      default:
        setSwipeIndex(0);
        navigate('/dashboard');
    }
  };
  
  const handleSwipeChange = (index) => {
    setSwipeIndex(index);
    switch (index) {
      case 0:
        setActiveTab('timeline');
        navigate('/dashboard');
        break;
      case 1:
        setActiveTab('logs');
        navigate('/dashboard/events');
        break;
      case 2:
        setActiveTab('distribution');
        navigate('/dashboard/distribution');
        break;
      case 3:
        setActiveTab('profile');
        navigate('/dashboard/profile');
        break;
      default:
        setActiveTab('timeline');
        navigate('/dashboard');
    }
  };

  // ヘッダーに表示するアカウント選択UI
  const headerAccountSelector = (
    <div className="relative">
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => setShowUserSelector(!showUserSelector)}
      >
        {currentUser.profileImageUrl ? (
          <img
            src={currentUser.profileImageUrl}
            alt={currentUser.name}
            className="h-8 w-8 rounded-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold"
          style={{ display: currentUser.profileImageUrl ? 'none' : 'flex' }}
        >
          {currentUser.name.charAt(0)}
        </div>
        <div className="ml-2">
          <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
          <p className="text-xs text-gray-500">
            {currentUser.type === 'master' ? 'マスターアカウント' : '家族アカウント'}
          </p>
        </div>
        {availableUsers.length > 1 && (
          <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      
      {/* ユーザー選択ドロップダウン */}
      {showUserSelector && availableUsers.length > 1 && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-10 w-72">
          <div className="p-2">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              アカウント切り替え
            </div>
            {availableUsers.map((user) => {
              // 親子関係の表示テキストを決定
              let relationshipText = '';
              if (user.type === 'master') {
                relationshipText = 'マスターアカウント';
              } else if (user.type === 'normal') {
                if (user.parentId === currentUser.id) {
                  relationshipText = '子アカウント';
                } else if (currentUser.type === 'master' && currentUser.childrenIds?.includes(user.id)) {
                  relationshipText = '子アカウント';
                } else {
                  relationshipText = '家族アカウント';
                }
              }
              
              return (
                <div
                  key={user.id}
                  onClick={() => handleUserChange(user)}
                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                    user.id === currentUser.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold"
                    style={{ display: user.profileImageUrl ? 'none' : 'flex' }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <p className={`text-sm font-medium ${
                        user.id === currentUser.id ? 'text-blue-600' : 'text-gray-800'
                      }`}>{user.name}</p>
                      {user.id === currentUser.id && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                          現在
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{relationshipText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // 日付ナビゲーションコンポーネント（プロフィールタブ以外で表示）
  const dateNavigationComponent = activeTab !== 'profile' ? (
    <DateNavigation
      selectedDate={selectedDate}
      onDateChange={handleDateChange}
      showDataStatus={false}
    />
  ) : null;

  return (
    <ErrorBoundary>
      <MobileLayout
        userData={currentUser}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        headerContent={headerAccountSelector}
        dateNavigation={dateNavigationComponent}
        hideNotifications={false}
      >
        <SwipeableViews index={swipeIndex} onChangeIndex={handleSwipeChange} className="h-full">
          {/* 感情タイムライン */}
          <div>
            <ErrorBoundary>
              {(() => {
                console.log('レンダリング準備 - EmotionTimeline');
                console.log('emotionTimelineData:', emotionTimelineData);
                console.log('isLoading:', isLoading);
                console.log('currentUser.id:', currentUser.id);
                
                try {
                  return (
                    <EmotionTimeline
                      userId={currentUser.id}
                      selectedDate={selectedDate}
                    />
                  );
                } catch (error) {
                  console.error('EmotionTimelineコンポーネントでエラー:', error);
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">EmotionTimelineエラー</h3>
                      <p className="text-red-600 text-sm">{error.message}</p>
                      <pre className="text-xs text-red-500 mt-2">{error.stack}</pre>
                    </div>
                  );
                }
              })()}
            </ErrorBoundary>
          </div>

          {/* イベントログ */}
          <div>
            <ErrorBoundary>
              {(() => {
                console.log('レンダリング準備 - EventLogs');
                console.log('eventLogsData:', eventLogsData);
                
                try {
                  return (
                    <EventLogs
                      data={eventLogsData}
                      isLoading={isLoading}
                      userId={currentUser.id}
                      selectedDate={selectedDate}
                    />
                  );
                } catch (error) {
                  console.error('EventLogsコンポーネントでエラー:', error);
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">EventLogsエラー</h3>
                      <p className="text-red-600 text-sm">{error.message}</p>
                    </div>
                  );
                }
              })()}
            </ErrorBoundary>
          </div>

          {/* 感情分布 */}
          <div>
            <ErrorBoundary>
              {(() => {
                console.log('レンダリング準備 - EmotionGraph (新感情グラフ)');
                console.log('currentUser.id:', currentUser.id, 'selectedDate:', selectedDate);
                
                try {
                  return (
                    <EmotionGraph
                      userId={currentUser.id}
                      selectedDate={selectedDate}
                    />
                  );
                } catch (error) {
                  console.error('EmotionGraphコンポーネントでエラー:', error);
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">EmotionGraphエラー</h3>
                      <p className="text-red-600 text-sm">{error.message}</p>
                    </div>
                  );
                }
              })()}
            </ErrorBoundary>
          </div>

          {/* プロフィール */}
          <div>
            <ErrorBoundary>
              {(() => {
                console.log('レンダリング準備 - ProfileView');
                
                try {
                  return (
                    <ProfileView
                      userId={currentUser.id}
                      isLoading={isLoading}
                      onDataUpdate={handleDataUpdate}
                    />
                  );
                } catch (error) {
                  console.error('ProfileViewコンポーネントでエラー:', error);
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">ProfileViewエラー</h3>
                      <p className="text-red-600 text-sm">{error.message}</p>
                    </div>
                  );
                }
              })()}
            </ErrorBoundary>
          </div>
        </SwipeableViews>
      </MobileLayout>
    </ErrorBoundary>
  );
};

export default Dashboard; 