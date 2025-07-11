import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import MobileLayout from '../layouts/MobileLayout';
import DateNavigation from '../components/common/DateNavigation';
import HeaderDeviceMenu from '../components/dashboard/HeaderDeviceMenu';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import { useAuth } from '../hooks/useAuth';

/**
 * ダッシュボードページ
 * カスタムフックとコンポーネント分割により、UIのレンダリングに専念
 */
const Dashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // データ管理をカスタムフックに委譲
  const {
    userProfile,
    selectedDate,
    devices,
    devicesMetadata,
    selectedDeviceId,
    isLoading,
    error,
    handleDateChange,
    handleDeviceSelect,
    clearError,
  } = useDashboardData();

  // タブ管理
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('timeline');

  // タブ変更ハンドラー（ボタンクリック）
  const handleTabChange = useCallback((tab) => {
    let index = 0;
    switch (tab) {
      case 'timeline':
        index = 0;
        navigate('/dashboard');
        break;
      case 'logs':
        index = 1;
        navigate('/dashboard/events');
        break;
      case 'distribution':
        index = 2;
        navigate('/dashboard/distribution');
        break;
      case 'device':
        index = 3;
        navigate('/dashboard/device');
        break;
      default:
        index = 0;
        navigate('/dashboard');
    }
    setSwipeIndex(index);
    setActiveTab(tab);
  }, [navigate]);

  // スワイプ変更ハンドラー
  const handleSwipeChange = useCallback((index) => {
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
  }, [navigate]);

  // ログアウトハンドラー
  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }, [signOut]);

  // エラー表示
  if (error) {
    return (
      <MobileLayout
        userData={userProfile || { name: 'ユーザー' }}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button 
              onClick={clearError}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              再試行
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ローディング表示
  if (isLoading) {
    return (
      <MobileLayout
        userData={userProfile || { name: 'ユーザー' }}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">データを読み込んでいます...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      userData={userProfile || { name: 'ユーザー' }}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      headerContent={
        <HeaderDeviceMenu
          devices={devices}
          devicesMetadata={devicesMetadata}
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={handleDeviceSelect}
          onLogout={handleLogout}
        />
      }
      dateNavigation={
        activeTab !== 'device' && (
          <DateNavigation
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            showDataStatus={false}
          />
        )
      }
    >
      <DashboardTabs
        swipeIndex={swipeIndex}
        onSwipeChange={handleSwipeChange}
        selectedDeviceId={selectedDeviceId}
        selectedDate={selectedDate}
        onDeviceSelect={handleDeviceSelect}
      />
    </MobileLayout>
  );
};

export default Dashboard;