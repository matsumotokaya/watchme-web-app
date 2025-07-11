import React from 'react';
import SwipeableViews from 'react-swipeable-views';
import ErrorBoundary from '../ErrorBoundary';
import VibeGraph from './EmotionTimeline';
import BehaviorGraph from './EventLogs';
import EmotionGraph from './EmotionGraph';
import DeviceView from './DeviceView';

/**
 * ダッシュボードのタブコンテンツを管理するコンポーネント
 * スワイプ機能と各グラフコンポーネントのレンダリングを担当
 */
const DashboardTabs = ({ 
  swipeIndex, 
  onSwipeChange, 
  selectedDeviceId, 
  selectedDate, 
  onDeviceSelect 
}) => {
  return (
    <SwipeableViews 
      index={swipeIndex} 
      onChangeIndex={onSwipeChange} 
      className="h-full"
    >
      {/* タブ 1: 感情タイムライン */}
      <div>
        <ErrorBoundary>
          <VibeGraph 
            deviceId={selectedDeviceId} 
            selectedDate={selectedDate} 
          />
        </ErrorBoundary>
      </div>
      
      {/* タブ 2: 行動ログ */}
      <div>
        <ErrorBoundary>
          <BehaviorGraph 
            userId={selectedDeviceId} 
            selectedDate={selectedDate} 
          />
        </ErrorBoundary>
      </div>
      
      {/* タブ 3: 感情グラフ */}
      <div>
        <ErrorBoundary>
          <EmotionGraph 
            userId={selectedDeviceId} 
            selectedDate={selectedDate} 
          />
        </ErrorBoundary>
      </div>
      
      {/* タブ 4: デバイス管理 */}
      <div>
        <ErrorBoundary>
          <DeviceView 
            onDeviceSelect={onDeviceSelect} 
          />
        </ErrorBoundary>
      </div>
    </SwipeableViews>
  );
};

// パフォーマンス最適化：propsが変更されない限り再レンダリングを防ぐ
export default React.memo(DashboardTabs);