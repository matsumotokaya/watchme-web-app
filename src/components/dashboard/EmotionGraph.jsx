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
  Legend
} from 'chart.js';
import { useErrorHandler, getUserFriendlyMessage } from '../../utils/errorHandler';
import NoDataMessage from '../common/NoDataMessage';
import useVaultAPI from '../../hooks/useVaultAPI';

// Chart.js コンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Plutchik の8感情分類の定義とカラーパレット
const EMOTIONS = {
  anger: { label: '怒り', color: 'rgb(239, 68, 68)' },      // red-500
  fear: { label: '恐れ', color: 'rgb(124, 58, 237)' },       // violet-500
  anticipation: { label: '期待', color: 'rgb(34, 197, 94)' }, // green-500
  surprise: { label: '驚き', color: 'rgb(251, 191, 36)' },   // amber-400
  joy: { label: '喜び', color: 'rgb(59, 130, 246)' },         // blue-500
  sadness: { label: '悲しみ', color: 'rgb(107, 114, 128)' }, // gray-500
  trust: { label: '信頼', color: 'rgb(16, 185, 129)' },      // emerald-500
  disgust: { label: '嫌悪', color: 'rgb(217, 119, 6)' }      // amber-600
};

// 感情グラフはVault API /api/users/{userId}/logs/{date}/opensmile-summary からデータを取得

const EmotionGraph = ({ userId, selectedDate }) => {
  const [selectedEmotions, setSelectedEmotions] = useState(
    Object.keys(EMOTIONS).reduce((acc, emotion) => ({ ...acc, [emotion]: true }), {})
  );

  // Vault APIからopensmile-summaryデータを取得
  const { data, isLoading, error, refresh } = useVaultAPI('opensmile-summary', userId, selectedDate);

  // 統一エラーハンドラーの初期化
  const handleError = useErrorHandler('EmotionGraph');

  // データ取得状況をログ出力
  useEffect(() => {
    console.log('🎭 感情グラフ: データ状況', {
      userId,
      selectedDate,
      hasData: !!data,
      isLoading,
      error,
      dataStructure: data ? Object.keys(data) : null
    });
  }, [userId, selectedDate, data, isLoading, error]);

  // Chart.jsデータ生成
  const generateChartData = () => {
    // Vault API /api/users/{userId}/logs/{date}/opensmile-summary からのデータを使用
    if (!data) return null;

    try {
      let emotionData;
      
      // Vault APIからのデータ構造に対応
      if (data.emotion_graph) {
        emotionData = data.emotion_graph;
      } else if (Array.isArray(data)) {
        emotionData = data;
      } else if (data.timeline || data.features || data.result) {
        emotionData = data.timeline || data.features || data.result;
      } else {
        console.warn('🎭 感情グラフ: 未知のデータ構造です', data);
        return null;
      }

      if (!Array.isArray(emotionData)) {
        console.warn('🎭 感情グラフ: データが配列ではありません', emotionData);
        return null;
      }

      // タイムラベルを生成（30分間隔、48ポイント）
      const timeLabels = emotionData.map((point, index) => {
        if (point.time) {
          return point.time;
        }
        // タイムスタンプがない場合は30分間隔で生成
        const hour = Math.floor(index / 2);
        const minute = (index % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      });
      
      const datasets = Object.entries(EMOTIONS)
        .filter(([emotion]) => selectedEmotions[emotion])
        .map(([emotion, config]) => ({
          label: config.label,
          data: emotionData.map(point => {
            const value = point[emotion];
            // NaN値やnull値をnullに正規化
            return (typeof value === 'number' && !isNaN(value)) ? value : null;
          }),
          borderColor: config.color,
          backgroundColor: config.color + '20', // 20% opacity for fill
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.1, // スムーズな曲線
          spanGaps: false // null値で線を途切れさせる
        }));

      console.log('✅ 感情グラフ: Chart.jsデータ生成完了', { timeLabels, datasets });
      return {
        labels: timeLabels,
        datasets: datasets
      };
    } catch (err) {
      const error = handleError(err, {
        action: 'generateChartData',
        dataAvailable: !!data
      });
      console.error('🎭 感情グラフ: Chart.js データ生成エラー:', error);
      return null;
    }
  };

  // Chart.jsオプション
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          },
          padding: 10,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return `時刻: ${context[0].label}`;
          },
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y}回`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: false
        },
        ticks: {
          maxTicksLimit: 12, // X軸のラベル数を制限
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            // 2時間ごとにラベルを表示
            return index % 4 === 0 ? label : '';
          }
        }
      },
      y: {
        title: {
          display: false
        },
        beginAtZero: true,
        ticks: {
          precision: 0 // 整数のみ表示
        }
      }
    }
  };

  const chartData = generateChartData();

  // 感情の表示/非表示切り替え
  const toggleEmotion = (emotion) => {
    setSelectedEmotions(prev => ({
      ...prev,
      [emotion]: !prev[emotion]
    }));
  };

  // 全感情の表示/非表示切り替え
  const toggleAllEmotions = () => {
    const allSelected = Object.values(selectedEmotions).every(selected => selected);
    const newState = Object.keys(EMOTIONS).reduce(
      (acc, emotion) => ({ ...acc, [emotion]: !allSelected }), 
      {}
    );
    setSelectedEmotions(newState);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">感情グラフ</h2>
          <p className="text-sm text-gray-600 mt-1">8感情の推移</p>
        </div>
        
        {/* 全体切り替えボタン */}
        <button
          onClick={toggleAllEmotions}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
          title="全感情の表示/非表示を切り替え"
        >
          {Object.values(selectedEmotions).every(selected => selected) ? '全て非表示' : '全て表示'}
        </button>
      </div>

      {/* ローディング状態 */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-blue-500">感情グラフデータを読み込み中...</div>
        </div>
      ) : error ? (
        <NoDataMessage selectedDate={selectedDate} dataType="感情グラフデータ" />
      ) : chartData ? (
        <>
          {/* 感情フィルター */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {Object.entries(EMOTIONS).map(([emotion, config]) => (
                <button
                  key={emotion}
                  onClick={() => toggleEmotion(emotion)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                    selectedEmotions[emotion]
                      ? 'text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-100'
                  }`}
                  style={selectedEmotions[emotion] ? { backgroundColor: config.color } : {}}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* グラフ表示 */}
          <div className="h-64 md:h-80 relative">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* データサマリー */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(EMOTIONS).map(([emotion, config]) => {
              // Vault APIデータ構造に対応した統計計算
              let emotionData;
              if (data.emotion_graph) {
                emotionData = data.emotion_graph;
              } else if (Array.isArray(data)) {
                emotionData = data;
              } else if (data.timeline || data.features || data.result) {
                emotionData = data.timeline || data.features || data.result;
              } else {
                emotionData = [];
              }

              if (!Array.isArray(emotionData)) {
                emotionData = [];
              }

              // NaN値を除外して計算
              const validValues = emotionData
                .map(point => point[emotion])
                .filter(value => typeof value === 'number' && !isNaN(value));
              
              const total = validValues.reduce((sum, value) => sum + value, 0);
              const max = validValues.length > 0 ? Math.max(...validValues) : 0;
              
              return (
                <div key={emotion} className="p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs font-medium text-gray-700">{config.label}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    <div>合計: {total.toFixed(1)}回</div>
                    <div>最大: {max.toFixed(1)}回</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <NoDataMessage selectedDate={selectedDate} dataType="感情グラフデータ" />
      )}
    </div>
  );
};

export default EmotionGraph;