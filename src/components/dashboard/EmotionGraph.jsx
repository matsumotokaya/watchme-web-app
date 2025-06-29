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

// モックデータ（指定されたJSONデータ）
const MOCK_EMOTION_DATA = {
  "date": "2025-06-26",
  "emotion_graph": [
    {"time": "00:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "00:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "01:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "01:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "02:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "02:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "03:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "03:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "04:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "04:30", "anger": 4, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 1, "trust": 1, "disgust": 1},
    {"time": "05:00", "anger": 6, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 1, "trust": 1, "disgust": 1},
    {"time": "05:30", "anger": 5, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 1, "trust": 1, "disgust": 1},
    {"time": "06:00", "anger": 3, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 1, "trust": 1, "disgust": 1},
    {"time": "06:30", "anger": 3, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 1, "trust": 1, "disgust": 1},
    {"time": "07:00", "anger": 0, "fear": 0, "anticipation": 2, "surprise": 1, "joy": 8, "sadness": 0, "trust": 4, "disgust": 0},
    {"time": "07:30", "anger": 0, "fear": 0, "anticipation": 2, "surprise": 1, "joy": 11, "sadness": 0, "trust": 4, "disgust": 0},
    {"time": "08:00", "anger": 0, "fear": 0, "anticipation": 2, "surprise": 1, "joy": 7, "sadness": 0, "trust": 4, "disgust": 0},
    {"time": "08:30", "anger": 0, "fear": 0, "anticipation": 2, "surprise": 1, "joy": 6, "sadness": 0, "trust": 4, "disgust": 0},
    {"time": "09:00", "anger": 1, "fear": 1, "anticipation": 2, "surprise": 0, "joy": 3, "sadness": 1, "trust": 5, "disgust": 0},
    {"time": "09:30", "anger": 1, "fear": 1, "anticipation": 2, "surprise": 0, "joy": 3, "sadness": 1, "trust": 5, "disgust": 0},
    {"time": "10:00", "anger": 1, "fear": 1, "anticipation": 2, "surprise": 0, "joy": 3, "sadness": 1, "trust": 5, "disgust": 0},
    {"time": "10:30", "anger": 1, "fear": 1, "anticipation": 2, "surprise": 0, "joy": 3, "sadness": 1, "trust": 5, "disgust": 0},
    {"time": "11:00", "anger": 1, "fear": 1, "anticipation": 2, "surprise": 0, "joy": 3, "sadness": 1, "trust": 5, "disgust": 0},
    {"time": "11:30", "anger": 1, "fear": 1, "anticipation": 2, "surprise": 0, "joy": 3, "sadness": 1, "trust": 5, "disgust": 0},
    {"time": "12:00", "anger": 6, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 2, "trust": 1, "disgust": 1},
    {"time": "12:30", "anger": 7, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 2, "trust": 1, "disgust": 1},
    {"time": "13:00", "anger": 5, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 2, "trust": 1, "disgust": 1},
    {"time": "13:30", "anger": 4, "fear": 1, "anticipation": 2, "surprise": 1, "joy": 1, "sadness": 2, "trust": 1, "disgust": 1},
    {"time": "14:00", "anger": 1, "fear": 0, "anticipation": 1, "surprise": 0, "joy": 4, "sadness": 0, "trust": 3, "disgust": 0},
    {"time": "14:30", "anger": 1, "fear": 0, "anticipation": 1, "surprise": 0, "joy": 3, "sadness": 0, "trust": 3, "disgust": 0},
    {"time": "15:00", "anger": 0, "fear": 0, "anticipation": 1, "surprise": 0, "joy": 2, "sadness": 0, "trust": 3, "disgust": 0},
    {"time": "15:30", "anger": 0, "fear": 0, "anticipation": 1, "surprise": 0, "joy": 1, "sadness": 0, "trust": 3, "disgust": 0},
    {"time": "16:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "16:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "17:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "17:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "18:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "18:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "19:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "19:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "20:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "20:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "21:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "21:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "22:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "22:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "23:00", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0},
    {"time": "23:30", "anger": 0, "fear": 0, "anticipation": 0, "surprise": 0, "joy": 0, "sadness": 0, "trust": 0, "disgust": 0}
  ]
};

const EmotionGraph = ({ userId, selectedDate }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmotions, setSelectedEmotions] = useState(
    Object.keys(EMOTIONS).reduce((acc, emotion) => ({ ...acc, [emotion]: true }), {})
  );

  // 統一エラーハンドラーの初期化
  const handleError = useErrorHandler('EmotionGraph');

  // コンポーネント初期化時にモックデータを設定
  useEffect(() => {
    try {
      console.log('🎭 感情グラフ: モックデータを読み込み中...');
      setIsLoading(true);
      
      // モックデータを少し遅延させて実際のAPIコールをシミュレート
      const loadMockData = () => {
        try {
          setData(MOCK_EMOTION_DATA);
          console.log('✅ 感情グラフ: モックデータ読み込み完了');
        } catch (err) {
          const error = handleError(err, {
            action: 'loadMockData',
            userId,
            selectedDate
          });
          setError(getUserFriendlyMessage(error));
        } finally {
          setIsLoading(false);
        }
      };

      setTimeout(loadMockData, 500); // 500ms遅延でローディング感を演出
    } catch (err) {
      const error = handleError(err, {
        action: 'initializeComponent',
        userId,
        selectedDate
      });
      setError(getUserFriendlyMessage(error));
      setIsLoading(false);
    }
  }, [userId, selectedDate, handleError]);

  // Chart.jsデータ生成
  const generateChartData = () => {
    if (!data?.emotion_graph) return null;

    try {
      const timeLabels = data.emotion_graph.map(point => point.time);
      
      const datasets = Object.entries(EMOTIONS)
        .filter(([emotion]) => selectedEmotions[emotion])
        .map(([emotion, config]) => ({
          label: config.label,
          data: data.emotion_graph.map(point => point[emotion]),
          borderColor: config.color,
          backgroundColor: config.color + '20', // 20% opacity for fill
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.1 // スムーズな曲線
        }));

      return {
        labels: timeLabels,
        datasets: datasets
      };
    } catch (err) {
      const error = handleError(err, {
        action: 'generateChartData',
        dataAvailable: !!data?.emotion_graph
      });
      setError(getUserFriendlyMessage(error));
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
        display: true,
        text: 'Plutchik 8感情分類 - 感情出現数の時系列変化',
        font: {
          size: 14,
          weight: 'bold'
        }
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
          display: true,
          text: '時刻',
          font: {
            size: 12,
            weight: 'bold'
          }
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
          display: true,
          text: '感情出現数',
          font: {
            size: 12,
            weight: 'bold'
          }
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
          <p className="text-sm text-gray-600 mt-1">Plutchik 8感情分類による時系列表示</p>
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

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* ローディング状態 */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-blue-500">感情データを読み込み中...</div>
        </div>
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
              const total = data.emotion_graph.reduce((sum, point) => sum + point[emotion], 0);
              const max = Math.max(...data.emotion_graph.map(point => point[emotion]));
              
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
                    <div>合計: {total}回</div>
                    <div>最大: {max}回</div>
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