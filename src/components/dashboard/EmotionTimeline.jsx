import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getAllLogData } from '../../services/dataService';
import { getTodayString } from '../../utils/dateUtils';

import NoDataMessage from '../common/NoDataMessage';

// Chart.js コンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 親コンポーネントからデータを受け取る
const EmotionTimeline = ({ data: initialData, isLoading: initialLoading, userId, selectedDate, onDateChange }) => {
  console.log('==== EmotionTimeline コンポーネント開始 ====');
  console.log('受け取ったprops:', { initialData, initialLoading, userId, selectedDate });
  
  const [selectedInsight, setSelectedInsight] = useState(0);
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // 初期データが変更されたときに内部状態を更新
  useEffect(() => {
    // データの最終安全性チェック
    const safeData = validateComponentData(initialData);
    setData(safeData);
    setIsLoading(initialLoading);
  }, [initialData, initialLoading]);

  /**
   * コンポーネントレベルでのデータ安全性確認
   * @param {Object} inputData - 受け取ったデータ
   * @returns {Object|null} - 安全なデータまたはnull
   */
  const validateComponentData = (inputData) => {
    if (!inputData) return null;
    
    try {
      console.log('🔍 EmotionTimelineコンポーネント側でデータ安全性を確認');
      
      // 必須フィールドの存在確認
      if (!inputData.timePoints || !inputData.emotionScores) {
        console.warn('⚠️ コンポーネント側で必須フィールドが不足');
        return null;
      }
      
      // 配列型の確認
      if (!Array.isArray(inputData.timePoints) || !Array.isArray(inputData.emotionScores)) {
        console.warn('⚠️ timePointsまたはemotionScoresが配列ではありません');
        return null;
      }
      
      // 最小データ長の確認
      if (inputData.timePoints.length === 0 || inputData.emotionScores.length === 0) {
        console.warn('⚠️ データが空配列です');
        return null;
      }
      
      // emotionScoresの最終数値チェック
      const validatedScores = inputData.emotionScores.map((score, index) => {
        if (score === null || score === undefined) return score;
        
        const num = Number(score);
        if (isNaN(num)) {
          console.warn(`⚠️ コンポーネント側で無効なスコアを検出: index=${index}, value=${score}`);
          return 0;
        }
        return num;
      });
      
      console.log('✅ コンポーネント側データ検証完了');
      return {
        ...inputData,
        emotionScores: validatedScores
      };
      
    } catch (error) {
      console.error('❌ コンポーネント側データ検証エラー:', error);
      return null;
    }
  };

  // チャートのオプション
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: -100,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => value === 0 ? '0' : value
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.dataIndex;
            const events = data?.emotionChanges || [];
            const event = events.find(e => e.time === data?.timePoints?.[point]);
            
            // データ欠損の場合の処理
            if (context.parsed.y === null || context.parsed.y === undefined || isNaN(context.parsed.y)) {
              return [
                'データなし（測定中断）',
                '※ このポイントは分析から除外されています'
              ];
            }
            
            const labels = [];
            
            // 基本的な心理スコア情報
            labels.push(`心理スコア: ${context.parsed.y}`);
            
            // イベント情報
            if (event) {
              labels.push(`イベント: ${event.event}`);
              labels.push(`スコア変化: ${event.score > 0 ? '+' : ''}${event.score}`);
            }
            
            // データ処理情報
            const originalValue = data?.emotionScores?.[point];
            if (originalValue !== context.parsed.y && originalValue !== null && originalValue !== undefined) {
              if (originalValue % 1 !== 0) {
                labels.push(`※ 元の値 ${originalValue} を四捨五入`);
              } else if (originalValue !== context.parsed.y) {
                labels.push(`※ 元の値 ${originalValue} を補正`);
              }
            }
            
            // データ品質情報
            if (dataStats) {
              const timeInterval = dataStats.timeInterval;
              if (timeInterval !== 30) { // デフォルトと異なる場合
                labels.push(`※ 測定間隔: ${timeInterval}分`);
              }
            }
            
            return labels;
          },
          title: (context) => {
            const point = context[0].dataIndex;
            const timePoint = data?.timePoints?.[point];
            const date = data?.date || '不明';
            return [`${date} ${timePoint}`];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    // データ欠損時の線の描画設定
    spanGaps: false, // nullの部分で線を途切れさせる
  };

  // データ欠損の統計情報を計算
  const calculateDataStats = () => {
    if (!data || !data.emotionScores) return null;
    
    try {
      const totalPoints = data.emotionScores.length;
      const validPoints = data.emotionScores.filter(score => 
        score !== null && score !== undefined && !isNaN(score)
      ).length;
      const missingPoints = totalPoints - validPoints;
      
      // 動的な時間間隔の計算（デフォルト30分間隔）
      const timeInterval = totalPoints > 0 ? (24 * 60) / totalPoints : 30; // 分単位
      const intervalHours = timeInterval / 60;
      
      const totalHours = totalPoints * intervalHours;
      const measuredHours = validPoints * intervalHours;
      const unmeasuredHours = missingPoints * intervalHours;
      const coverageRate = totalHours > 0 ? Math.round((measuredHours / 24) * 100) : 0;
      
      return {
        totalPoints,
        validPoints,
        missingPoints,
        totalHours: Math.round(totalHours * 10) / 10,
        measuredHours: Math.round(measuredHours * 10) / 10,
        unmeasuredHours: Math.round(unmeasuredHours * 10) / 10,
        coverageRate,
        dataQuality: coverageRate >= 90 ? '良好' : coverageRate >= 70 ? '普通' : '不良',
        timeInterval: Math.round(timeInterval)
      };
    } catch (error) {
      console.error('データ統計計算エラー:', error);
      return null;
    }
  };

  const dataStats = calculateDataStats();

  // チャートデータの作成（安全性強化）
  const createChartData = () => {
    if (!data || !data.timePoints || !data.emotionScores) return null;
    
    try {
      console.log('📊 チャートデータ作成開始');
      
      // データ長の最終確認
      if (data.timePoints.length !== data.emotionScores.length) {
        console.warn('⚠️ チャート作成時にデータ長不一致を検出');
        const minLength = Math.min(data.timePoints.length, data.emotionScores.length);
        const adjustedTimePoints = data.timePoints.slice(0, minLength);
        const adjustedScores = data.emotionScores.slice(0, minLength);
        
        return createChartDataObject(adjustedTimePoints, adjustedScores);
      }
      
      return createChartDataObject(data.timePoints, data.emotionScores);
      
    } catch (error) {
      console.error('❌ チャートデータ作成エラー:', error);
      return null;
    }
  };

  const createChartDataObject = (timePoints, emotionScores) => {
    return {
      labels: timePoints,
      datasets: [
        {
          label: '心理スコア',
          data: emotionScores,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: (context) => {
            const index = context.dataIndex;
            const value = emotionScores[index];
            
            // データ欠損の場合は透明にする
            if (value === null || value === undefined || isNaN(value)) {
              return 'transparent';
            }
            
            const events = data?.emotionChanges || [];
            return events.find(e => e.time === timePoints[index]) 
              ? 'rgba(220, 38, 38, 1)' 
              : 'rgba(59, 130, 246, 1)';
          },
          pointBorderColor: (context) => {
            const index = context.dataIndex;
            const value = emotionScores[index];
            
            // データ欠損の場合は透明にする
            if (value === null || value === undefined || isNaN(value)) {
              return 'transparent';
            }
            
            return 'rgba(59, 130, 246, 1)';
          },
          pointRadius: (context) => {
            const index = context.dataIndex;
            const value = emotionScores[index];
            
            // データ欠損の場合は表示しない
            if (value === null || value === undefined || isNaN(value)) {
              return 0;
            }
            
            const events = data?.emotionChanges || [];
            return events.find(e => e.time === timePoints[index]) ? 6 : 3;
          },
          tension: 0.3,
          fill: {
            target: 'origin',
            above: 'rgba(59, 130, 246, 0.1)',
            below: 'rgba(239, 68, 68, 0.1)'
          }
        }
      ]
    };
  };

  const chartData = createChartData();

  // 時間帯を見やすい形式に変換
  const formatTimeRange = () => {
    if (!data || !data.timePoints || data.timePoints.length < 2) return '';
    const start = data.timePoints[0];
    const end = data.timePoints[data.timePoints.length - 1];
    return `${start} 〜 ${end}`;
  };

  // 主要な感情変化イベントを表示
  const renderEmotionChanges = () => {
    if (!data || !data.emotionChanges) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">主要な感情変化</h3>
        <div className="space-y-2">
          {data.emotionChanges.map((change, index) => (
            <div key={index} className="flex items-center p-2 rounded-lg bg-white shadow-sm border border-gray-100">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${change.score > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {change.score > 0 ? '↑' : '↓'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">{change.time} - {change.event}</p>
                <p className="text-xs text-gray-500">心理スコア: {change.score > 0 ? '+' : ''}{change.score}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Vault APIから直接データを取得する関数
  const fetchFromVaultAPI = async () => {
    if (!userId || !selectedDate) {
      console.warn('ユーザーIDまたは選択日付が指定されていません:', { userId, selectedDate });
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      console.log('🔄 プロキシ経由でemotion-timelineデータを再取得中...');
      
      const url = `/api/proxy/emotion-timeline/${userId}/${selectedDate}`;
      console.log('🌐 リクエストURL (プロキシ):', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const fetchedData = await response.json();
      if (fetchedData.error) {
        throw new Error(fetchedData.error);
      }
      
      console.log('✅ プロキシ経由でemotion-timelineデータ再取得成功:', fetchedData);
      
      // データの安全性確認
      const validatedData = validateComponentData(fetchedData);
      if (validatedData) {
        setData(validatedData);
      } else {
        throw new Error('取得したデータの形式が無効です');
      }
      
    } catch (err) {
      console.error('❌ プロキシ経由でのemotion-timelineデータ再取得エラー:', err);
      setError(err.message || 'データの再取得に失敗しました');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">心理グラフ</h2>
          {/* グラフ更新ボタン */}
          <button
            onClick={fetchFromVaultAPI}
            disabled={isRefreshing}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              isRefreshing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
            title="Vault APIから最新データを再取得"
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>更新中...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>更新</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-blue-500">データを読み込み中...</div>
        </div>
      ) : data ? (
        <>
          <div className="h-64 md:h-80 relative">
            <Line data={chartData} options={chartOptions} />
          </div>
          
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-700 mb-1">インサイト</h3>
            {data.insights && data.insights.length > 0 ? (
              <>
                <div className="flex overflow-x-auto py-2 -mx-2 px-2 space-x-2">
                  {data.insights.map((insight, index) => (
                    <button
                      key={index}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                        selectedInsight === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600 border border-blue-200'
                      }`}
                      onClick={() => setSelectedInsight(index)}
                    >
                      インサイト {index + 1}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-blue-800">
                  {data.insights[selectedInsight] || 'インサイト情報が利用できません'}
                </p>
              </>
            ) : (
              <p className="text-sm text-blue-600">インサイトデータがありません</p>
            )}
          </div>
          
          {renderEmotionChanges()}
          
          {/* データ品質情報の表示（最下部に移動） */}
          {dataStats && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">データ品質情報</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{dataStats.measuredHours}h</div>
                  <div className="text-gray-500">測定時間</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500">{dataStats.unmeasuredHours}h</div>
                  <div className="text-gray-500">非測定時間</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-500">{dataStats.coverageRate}%</div>
                  <div className="text-gray-500">カバー率</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    dataStats.dataQuality === '良好' ? 'text-green-600' : 
                    dataStats.dataQuality === '普通' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {dataStats.dataQuality}
                  </div>
                  <div className="text-gray-500">品質</div>
                </div>
              </div>
              
              {/* 詳細統計情報 */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">測定点数:</span> {dataStats.validPoints}/{dataStats.totalPoints}
                  </div>
                  <div>
                    <span className="font-medium">時間間隔:</span> {dataStats.timeInterval}分
                  </div>
                  <div>
                    <span className="font-medium">総測定時間:</span> {dataStats.totalHours}h
                  </div>
                </div>
              </div>
              
              {/* 品質に応じた警告メッセージ */}
              {dataStats.coverageRate < 70 && (
                <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                  ⚠️ データカバー率が低いため、分析結果の信頼性が低い可能性があります
                </div>
              )}
              
              {dataStats.validPoints < 10 && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                  🚨 有効な測定点数が非常に少ないため、グラフの精度が低下している可能性があります
                </div>
              )}
              
              {data?.averageScore !== undefined && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  📊 平均心理スコア: {typeof data.averageScore === 'number' ? data.averageScore.toFixed(1) : data.averageScore}
                  {dataStats.validPoints > 0 && (
                    <span className="ml-2">
                      (有効データから算出)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <NoDataMessage selectedDate={selectedDate} dataType="感情タイムラインデータ" />
      )}
    </div>
  );
};

export default EmotionTimeline; 