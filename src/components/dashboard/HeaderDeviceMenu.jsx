import React, { useState, useEffect, useRef } from 'react';

/**
 * ダッシュボードヘッダーに表示するデバイス選択メニュー
 * 観測対象の選択とユーザーアクション（ログアウト）を提供
 */
const HeaderDeviceMenu = ({ 
  devices = [], 
  devicesMetadata = {}, 
  selectedDeviceId, 
  onDeviceSelect, 
  onLogout 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // メニューの外側をクリックしたときに閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // 選択中のデバイスのメタデータを取得
  const selectedDeviceMetadata = selectedDeviceId ? devicesMetadata[selectedDeviceId] : null;

  // デバイス選択ハンドラー
  const handleDeviceSelect = (deviceId) => {
    onDeviceSelect?.(deviceId);
    setShowUserMenu(false);
  };

  // ログアウトハンドラー
  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout?.();
  };

  return (
    <div className="relative" ref={menuRef}>
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        {/* 観測対象アバター */}
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
          {selectedDeviceMetadata?.avatar_url ? (
            <img 
              src={selectedDeviceMetadata.avatar_url} 
              alt="観測対象" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        
        {/* デバイス情報 */}
        <div className="ml-2">
          <p className="text-sm font-medium text-gray-800">
            {selectedDeviceMetadata?.name || '観測対象未選択'}
          </p>
          <p className="text-xs text-gray-500">
            {selectedDeviceId ? `デバイス: ${selectedDeviceId.substring(0, 8)}...` : '観測対象を選択'}
          </p>
        </div>
        
        {/* ドロップダウンアイコン */}
        <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* デバイス選択ドロップダウン */}
      {showUserMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-10 w-64">
          <div className="p-2">
            {/* ヘッダー */}
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              観測対象選択
            </div>
            
            {/* デバイス一覧 */}
            <div className="mt-1 space-y-1">
              {devices.length > 0 ? (
                devices.map((device) => (
                  <button
                    key={device.device_id}
                    onClick={() => handleDeviceSelect(device.device_id)}
                    className={`w-full text-left px-2 py-2 text-sm rounded-md flex items-center space-x-2 ${
                      selectedDeviceId === device.device_id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {/* デバイスアバター */}
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
                    
                    {/* デバイス情報 */}
                    <div className="flex-1">
                      <p className="font-medium">
                        {devicesMetadata[device.device_id]?.name || `観測対象 ${devices.indexOf(device) + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        デバイス: {device.device_id.substring(0, 12)}...
                      </p>
                    </div>
                    
                    {/* 選択中アイコン */}
                    {selectedDeviceId === device.device_id && (
                      <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-2 py-2 text-sm text-gray-500">
                  利用可能なデバイスがありません
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// パフォーマンス最適化：propsが変更されない限り再レンダリングを防ぐ
export default React.memo(HeaderDeviceMenu);