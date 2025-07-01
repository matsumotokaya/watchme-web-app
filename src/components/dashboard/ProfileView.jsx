import { useState, useEffect } from 'react';
import { getUser } from '../../services/dataService';
import { getTodayString } from '../../utils/dateUtils';
import Avatar from '../common/Avatar';

const ProfileView = ({ userId, isLoading, onDataUpdate }) => {
  const [user, setUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      console.log('ProfileView: ユーザーデータ読み込み開始:', userId);
      
      // 更新状態のみリセット（プロフィール情報は読み込み完了まで維持）
      setUpdateStatus('');
      setIsUpdating(false);
      
      try {
        const userData = await getUser(userId);
        console.log('ProfileView: ユーザーデータ取得成功:', userData);
        setUser(userData);
      } catch (error) {
        console.log('ProfileView: ユーザーデータ取得失敗:', error);
        // データなし時はデフォルト値を設定
        setUser({
          id: userId,
          name: 'ユーザー情報なし',
          birthDate: '',
          age: 0,
          gender: '',
          organization: '',
          notes: 'ユーザー情報がまだ登録されていません',
          profileImageUrl: '',
        });
      }
    };

    loadUserData();
  }, [userId]);

  // 初期化: デフォルトの日付範囲を設定
  useEffect(() => {
    const today = getTodayString();
    // デフォルト: 過去1週間
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split('T')[0];
    
    setStartDate(weekAgoString);
    setEndDate(today);
  }, []);

  // 日付範囲の日付配列を生成
  const generateDateRange = (start, end) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // 日付範囲一括更新ボタンのハンドラー
  const handleBulkUpdate = async () => {
    if (!startDate || !endDate) {
      setUpdateStatus('📅 開始日と終了日を指定してください');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setUpdateStatus('📅 開始日は終了日より前の日付を指定してください');
      return;
    }

    setIsUpdating(true);
    setUpdateStatus('');
    setUpdateProgress({ current: 0, total: 0 });
    
    try {
      const dateRange = generateDateRange(startDate, endDate);
      const totalDates = dateRange.length;
      setUpdateProgress({ current: 0, total: totalDates });
      
      console.log(`一括更新開始 - 対象期間: ${startDate} ～ ${endDate} (${totalDates}日間)`);
      
      const results = [];
      const errors = [];
      
      // 各日付を順次処理（並列処理だとサーバー負荷が高いため）
      for (let i = 0; i < dateRange.length; i++) {
        const date = dateRange[i];
        setUpdateProgress({ current: i + 1, total: totalDates });
        setUpdateStatus(`📅 ${date} のデータを更新中... (${i + 1}/${totalDates})`);
        
        try {
          console.log(`${date} のデータを取得中...`);
          
          const response = await fetch(`/api/users/${userId}/logs/${date}/load-from-insights`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const result = await response.json();
          
          if (response.ok) {
            results.push({
              date,
              success: true,
              dataTypes: result.dataTypes || [],
              message: result.message
            });
            console.log(`✅ ${date}: 成功 (${result.dataTypes?.join(', ') || 'データなし'})`);
          } else {
            errors.push({
              date,
              error: result.error || 'サーバーエラー',
              status: response.status
            });
            console.log(`⚠️ ${date}: データなし - ${result.error}`);
          }
          
        } catch (dateError) {
          errors.push({
            date,
            error: dateError.message,
            status: 'ネットワークエラー'
          });
          console.log(`⚠️ ${date}: 通信問題 -`, dateError);
        }
        
        // 各リクエスト間に短い間隔を設ける（サーバー負荷軽減）
        if (i < dateRange.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // 結果をまとめて表示
      const successCount = results.length;
      const errorCount = errors.length;
      
      let finalMessage = '';
      if (successCount > 0 && errorCount === 0) {
        finalMessage = `✅ 全ての日付のデータ更新が完了しました (${successCount}/${totalDates})`;
      } else if (successCount > 0 && errorCount > 0) {
        finalMessage = `⚠️ 一部のデータ更新が完了しました (成功: ${successCount}, 失敗: ${errorCount})`;
      } else {
        finalMessage = `⚠️ データを取得できませんでした (${errorCount}/${totalDates})`;
      }
      
      setUpdateStatus(finalMessage);
      
      // 詳細ログをコンソール出力
      console.log('=== 一括更新結果 ===');
      console.log(`成功: ${successCount}件`, results);
      console.log(`失敗: ${errorCount}件`, errors);
      
      // 親コンポーネントにデータ更新を通知（最後の日付で）
      if (onDataUpdate && successCount > 0) {
        onDataUpdate(endDate);
      }
      
    } catch (error) {
      console.log('一括更新で問題が発生:', error);
      setUpdateStatus(`⚠️ 一括更新で問題が発生しました: ${error.message}`);
    } finally {
      setIsUpdating(false);
      setUpdateProgress({ current: 0, total: 0 });
      
      // ステータスメッセージを10秒後にクリア（一括更新は長めに表示）
      setTimeout(() => {
        setUpdateStatus('');
      }, 10000);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="animate-pulse h-32 w-32 rounded-full bg-gray-200 mb-4"></div>
        <div className="animate-pulse h-6 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar
            src={user?.profileImageUrl}
            name={user?.name || 'ユーザー'}
            size="large"
            alt={user?.name || 'ユーザー'}
            className="border-4 border-blue-100"
          />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">{user?.name || 'ユーザー情報なし'}</h2>
          <p className="text-sm text-gray-500">{user?.id || ''}</p>
        </div>

        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">生年月日</p>
                <p className="text-sm font-medium">{user?.birthDate || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">年齢</p>
                <p className="text-sm font-medium">{user?.age || 0} 歳</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">性別</p>
                <p className="text-sm font-medium">{user?.gender || '未設定'}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">所属</p>
            <p className="text-sm font-medium">{user?.organization || '未設定'}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">認知・性格特記欄</p>
            <p className="text-sm whitespace-pre-wrap">{user?.notes || '情報がありません'}</p>
          </div>

          {/* 日付範囲一括更新機能 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">🧪 一括データ更新機能</h3>
              <p className="text-xs text-yellow-700 mb-3">
                指定した期間のemotion-timeline及びSEDサマリーデータをEC2から一括で更新します
              </p>
              
              {/* プリセット期間選択 */}
              <div className="flex flex-wrap gap-1 mb-3">
                <button
                  onClick={() => {
                    const today = getTodayString();
                    setStartDate(today);
                    setEndDate(today);
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-white border border-yellow-300 rounded hover:bg-yellow-50 disabled:opacity-50"
                >
                  今日
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setStartDate(weekAgo.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-white border border-yellow-300 rounded hover:bg-yellow-50 disabled:opacity-50"
                >
                  過去1週間
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    setStartDate(monthAgo.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-white border border-yellow-300 rounded hover:bg-yellow-50 disabled:opacity-50"
                >
                  過去1ヶ月
                </button>
                <button
                  onClick={() => {
                    setStartDate('2025-06-01');
                    setEndDate('2025-06-30');
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-white border border-yellow-300 rounded hover:bg-yellow-50 disabled:opacity-50"
                >
                  6月全体
                </button>
              </div>

              {/* 日付範囲選択 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-yellow-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isUpdating}
                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-yellow-700 mb-1">終了日</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isUpdating}
                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
              
              {/* 進捗表示 */}
              {isUpdating && updateProgress.total > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-yellow-700 mb-1">
                    <span>進捗</span>
                    <span>{updateProgress.current}/{updateProgress.total}</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(updateProgress.current / updateProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleBulkUpdate}
                disabled={isUpdating || !startDate || !endDate}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isUpdating || !startDate || !endDate
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isUpdating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    更新中...
                  </span>
                ) : (
                  '📊 EC2から日付範囲データを一括更新'
                )}
              </button>
              
              {/* ステータスメッセージ */}
              {updateStatus && (
                <div className="mt-3 p-2 bg-white border rounded text-xs text-center">
                  {updateStatus}
                </div>
              )}
              
              <p className="text-xs text-yellow-600 mt-2">
                ※ EC2 (https://api.hey-watch.me/status/{user?.id || 'USER_ID'}/YYYY-MM-DD/) から各日付のデータを順次読み込み
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView; 