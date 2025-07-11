import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import SwipeableViews from 'react-swipeable-views';
import MobileLayout from '../layouts/MobileLayout';
import VibeGraph from '../components/dashboard/EmotionTimeline';
import BehaviorGraph from '../components/dashboard/EventLogs';
// import EmotionDistribution from '../components/dashboard/EmotionDistribution'; // 🗑️ 削除予定: 使用されていない感情分布コンポーネント
import EmotionGraph from '../components/dashboard/EmotionGraph';
import DeviceView from '../components/dashboard/DeviceView';
import DateNavigation from '../components/common/DateNavigation';
import ErrorBoundary from '../components/ErrorBoundary';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../hooks/useAuth.jsx';
import { getUserDevices } from '../services/userService';
import { getDeviceMetadata } from '../services/deviceService';
// 🚨 dataService から削除されました。現在は useVaultAPI フックを使用してください。
// import { 
//   getEmotionTimelineData, 
//   getEventLogsData 
// } from '../services/dataService';
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
  const { user, userProfile, signOut } = useAuth();
  
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
  
  // ログアウトドロップダウンの表示状態
  const [showUserMenu, setShowUserMenu] = useState(false);
  
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
  
  // 選択されたデバイスID
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  
  // デバイス一覧
  const [devices, setDevices] = useState([]);
  
  // デバイスメタデータ一覧
  const [devicesMetadata, setDevicesMetadata] = useState({});

  console.log('Dashboard 初期化:', {
    user: user?.email,
    userProfile: userProfile?.name,
    activeTab,
    swipeIndex,
    emotionTimelineData: emotionTimelineData ? 'あり' : 'なし',
    eventLogsData: eventLogsData ? 'あり' : 'なし',
    isLoading,
    selectedDeviceId,
    devices: devices.length
  });

  // デバイス一覧を読み込み
  useEffect(() => {
    const loadDevices = async () => {
      if (!user?.id) return;
      
      try {
        const userDevices = await getUserDevices(user.id);
        setDevices(userDevices);
        
        // 各デバイスのメタデータを取得
        const metadataMap = {};
        for (const device of userDevices) {
          const metadata = await getDeviceMetadata(device.device_id);
          if (metadata) {
            metadataMap[device.device_id] = metadata;
          }
        }
        setDevicesMetadata(metadataMap);
        
        // 最初のアクティブなデバイスを自動選択
        if (!selectedDeviceId && userDevices.length > 0) {
          const activeDevice = userDevices.find(d => d.status === 'active') || userDevices[0];
          if (activeDevice) {
            setSelectedDeviceId(activeDevice.device_id);
          }
        }
      } catch (error) {
        console.error('デバイス取得エラー:', error);
        setDevices([]);
        setDevicesMetadata({});
      }
    };

    loadDevices();
  }, [user?.id]);

  // データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !selectedDeviceId) {
        console.log('データ取得スキップ - ユーザーIDまたはデバイスIDが未設定');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log('データ取得開始 - デバイスID:', selectedDeviceId, '対象日付:', selectedDate);
        
        // 🚨 各グラフは現在 useVaultAPI フックで直接データを取得しています
        // 以下のコードは古いバージョンです（完全にコメントアウト）
        // const [timelineData, logsData] = await Promise.allSettled([
        //   getEmotionTimelineData(selectedDeviceId, selectedDate),
        //   getEventLogsData(selectedDeviceId, selectedDate)
        // ]);
        
        // 現在は各グラフコンポーネントが useVaultAPI で直接データを取得するため、
        // ここでは空のデータ構造を設定
        const [timelineData, logsData] = [
          { status: 'fulfilled', value: null },
          { status: 'fulfilled', value: null }
        ];
        
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
    
    fetchData();
  }, [user?.id, selectedDeviceId, selectedDate]); // ユーザーID、デバイスID、または選択日付が変更されたら再取得
  
  useEffect(() => {
    // URLに基づいてアクティブなタブとスワイプインデックスを設定
    const path = window.location.pathname;
    if (path.includes('/dashboard/events')) {
      setActiveTab('events');
      setSwipeIndex(1);
    } else if (path.includes('/dashboard/distribution')) {
      setActiveTab('distribution');
      setSwipeIndex(2);
    } else if (path.includes('/dashboard/device')) {
      setActiveTab('device');
      setSwipeIndex(3);
    } else {
      setActiveTab('timeline');
      setSwipeIndex(0);
    }
  }, []);
  
  // ログアウトハンドラー
  const handleLogout = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // 日付変更ハンドラー
  const handleDateChange = (newDate) => {
    console.log('日付変更:', selectedDate, '->', newDate);
    setSelectedDate(newDate);
  };
  
  // デバイス選択ハンドラー
  const handleDeviceSelect = (deviceId) => {
    setSelectedDeviceId(deviceId);
  };
  
  // データ更新ハンドラー（DeviceViewからの通知を受け取る）
  const handleDataUpdate = async (updatedDate) => {
    console.log('データ更新通知を受信:', updatedDate);
    
    // 更新された日付が現在選択されている日付と同じ場合のみ再読み込み
    if (updatedDate === selectedDate) {
      console.log('現在選択中の日付のデータが更新されたため、再読み込みを実行');
      setIsLoading(true);
      
      try {
        console.log('データ再読み込み開始 - デバイスID:', selectedDeviceId, '対象日付:', updatedDate);
        
        // 🚨 各グラフは現在 useVaultAPI フックで直接データを取得しています
        // 以下のコードは古いバージョンです
        // const [timelineData, logsData] = await Promise.allSettled([
        //   getEmotionTimelineData(selectedDeviceId, updatedDate),
        //   getEventLogsData(selectedDeviceId, updatedDate)
        // ]);
        
        // 現在は各グラフコンポーネントが useVaultAPI で直接データを取得するため、
        // ここでは空のデータ構造を設定
        const [timelineData, logsData] = [
          { status: 'fulfilled', value: null },
          { status: 'fulfilled', value: null }
        ];
        
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
      case 'device':
        setSwipeIndex(3);
        navigate('/dashboard/device');
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
        setActiveTab('device');
        navigate('/dashboard/device');
        break;
      default:
        setActiveTab('timeline');
        navigate('/dashboard');
    }
  };

  // ヘッダーに表示するデバイスメニュー
  const headerDeviceMenu = (
    <div className="relative">
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        {/* 観測対象アバター */}
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
          {selectedDeviceId && devicesMetadata[selectedDeviceId]?.avatar_url ? (
            <img 
              src={devicesMetadata[selectedDeviceId].avatar_url} 
              alt="観測対象" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <div className="ml-2">
          <p className="text-sm font-medium text-gray-800">
            {selectedDeviceId && devicesMetadata[selectedDeviceId]?.name || '観測対象未選択'}
          </p>
          <p className="text-xs text-gray-500">
            {selectedDeviceId ? `デバイス: ${selectedDeviceId.substring(0, 8)}...` : '観測対象を選択'}
          </p>
        </div>
        <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* デバイス選択ドロップダウン */}
      {showUserMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-10 w-64">
          <div className="p-2">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              観測対象選択
            </div>
            <div className="mt-1 space-y-1">
              {devices.map((device) => (
                <button
                  key={device.device_id}
                  onClick={() => {
                    setSelectedDeviceId(device.device_id);
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-2 py-2 text-sm rounded-md flex items-center space-x-2 ${
                    selectedDeviceId === device.device_id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {devicesMetadata[device.device_id]?.avatar_url ? (
                      <img 
                        src={devicesMetadata[device.device_id].avatar_url} 
                        alt="観測対象" 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{devicesMetadata[device.device_id]?.name || `観測対象 ${devices.indexOf(device) + 1}`}</p>
                    <p className="text-xs text-gray-500">デバイス: {device.device_id.substring(0, 12)}...</p>
                  </div>
                  {selectedDeviceId === device.device_id && (
                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 日付ナビゲーションコンポーネント（プロフィールタブ以外で表示）
  const dateNavigationComponent = activeTab !== 'device' ? (
    <DateNavigation
      selectedDate={selectedDate}
      onDateChange={handleDateChange}
      showDataStatus={false}
    />
  ) : null;

  return (
    <ErrorBoundary>
      <MobileLayout
        userData={userProfile || { name: user?.email }}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        headerContent={headerDeviceMenu}
        dateNavigation={dateNavigationComponent}
        hideNotifications={false}
      >
        <SwipeableViews index={swipeIndex} onChangeIndex={handleSwipeChange} className="h-full">
          {/* 感情タイムライン */}
          <div>
            <ErrorBoundary>
              {(() => {
                console.log('レンダリング準備 - VibeGraph');
                console.log('emotionTimelineData:', emotionTimelineData);
                console.log('isLoading:', isLoading);
                console.log('user.id:', user.id);
                
                try {
                  return (
                    <VibeGraph
                      deviceId={selectedDeviceId}
                      selectedDate={selectedDate}
                    />
                  );
                } catch (error) {
                  console.error('VibeGraphコンポーネントでエラー:', error);
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">VibeGraphエラー</h3>
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
                console.log('レンダリング準備 - BehaviorGraph');
                console.log('eventLogsData:', eventLogsData);
                
                try {
                  return (
                    <BehaviorGraph
                      userId={selectedDeviceId}
                      selectedDate={selectedDate}
                    />
                  );
                } catch (error) {
                  console.error('BehaviorGraphコンポーネントでエラー:', error);
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">BehaviorGraphエラー</h3>
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
                console.log('user.id:', user.id, 'selectedDate:', selectedDate);
                
                try {
                  return (
                    <EmotionGraph
                      userId={selectedDeviceId}
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

          {/* デバイス管理 */}
          <div>
            <ErrorBoundary>
              {(() => {
                console.log('レンダリング準備 - DeviceView');
                
                try {
                  return (
                    <DeviceView
                      onDeviceSelect={handleDeviceSelect}
                    />
                  );
                } catch (error) {
                  console.error('DeviceViewコンポーネントでエラー:', error);
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-red-800 font-semibold">DeviceViewエラー</h3>
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