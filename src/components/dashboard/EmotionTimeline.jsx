import { useState } from 'react';
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

import useVaultAPI from '../../hooks/useVaultAPI';
import NoDataMessage from '../common/NoDataMessage';
import RefreshButton from '../common/RefreshButton';
import ErrorDisplay from '../common/ErrorDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

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

const EmotionTimeline = ({ userId, selectedDate }) => {
  const { data, isLoading, isRefreshing, error, refresh } = useVaultAPI(
    'emotion-timeline',
    userId,
    selectedDate
  );

  const [selectedInsight, setSelectedInsight] = useState(0);

  // チャートのオプション（簡素化）
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
                '測定なし',
                '※ このポイントは分析から除外されています'
              ];
            }
            
            const labels = [`心理スコア: ${context.parsed.y}`];
            
            // イベント情報
            if (event) {
              labels.push(`イベント: ${event.event}`);
              labels.push(`スコア変化: ${event.score > 0 ? '+' : ''}${event.score}`);
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
    spanGaps: false, // nullの部分で線を途切れさせる
  };

  // チャートデータの作成（簡素化）
  const createChartData = () => {
    if (!data || !data.timePoints || !data.emotionScores) return null;
    
    return {
      labels: data.timePoints,
      datasets: [
        {
          label: '心理スコア',
          data: data.emotionScores,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: (context) => {
            const index = context.dataIndex;
            const value = data.emotionScores[index];
            
            // データ欠損の場合は透明にする
            if (value === null || value === undefined || isNaN(value)) {
              return 'transparent';
            }
            
            const events = data?.emotionChanges || [];
            return events.find(e => e.time === data.timePoints[index]) 
              ? 'rgba(220, 38, 38, 1)' 
              : 'rgba(59, 130, 246, 1)';
          },
          pointBorderColor: (context) => {
            const index = context.dataIndex;
            const value = data.emotionScores[index];
            
            // データ欠損の場合は透明にする
            if (value === null || value === undefined || isNaN(value)) {
              return 'transparent';
            }
            
            return 'rgba(59, 130, 246, 1)';
          },
          pointRadius: (context) => {
            const index = context.dataIndex;
            const value = data.emotionScores[index];
            
            // データ欠損の場合は表示しない
            if (value === null || value === undefined || isNaN(value)) {
              return 0;
            }
            
            const events = data?.emotionChanges || [];
            return events.find(e => e.time === data.timePoints[index]) ? 6 : 3;
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

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">心理グラフ</h2>
          <RefreshButton 
            onClick={refresh} 
            isRefreshing={isRefreshing}
          />
        </div>
      </div>

      <ErrorDisplay error={error} />

      {isLoading ? (
        <LoadingSpinner />
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
        </>
      ) : (
        <NoDataMessage selectedDate={selectedDate} dataType="心理グラフデータ" />
      )}
    </div>
  );
};

export default EmotionTimeline;