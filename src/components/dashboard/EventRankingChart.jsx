import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
// Chart.js コンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EventRankingChart = ({ summaryRanking }) => {
  // イベント種別ごとの色マッピング
  const eventColorMap = {
    'Speech': '#3B82F6',
    'Silence': '#6B7280',
    'Inside, small room': '#10B981',
    'Music': '#F59E0B',
    'Crowd': '#EF4444',
    'Mechanisms': '#8B5CF6',
    'Vehicle': '#F97316',
    'Tools': '#06B6D4',
    'Nature sounds, water': '#84CC16',
    'Animal': '#EC4899',
    'Human sounds': '#14B8A6',
    'Speech synthesizer': '#A855F7',
  };

  // Top10のデータのみを取得
  const top10Data = summaryRanking ? summaryRanking.slice(0, 10) : [];

  // チャートデータの作成
  const chartData = {
    labels: top10Data.map(item => item.event),
    datasets: [
      {
        label: 'イベント回数',
        data: top10Data.map(item => item.count),
        backgroundColor: top10Data.map(item => 
          eventColorMap[item.event] || '#6B7280'
        ),
        borderColor: top10Data.map(item => 
          eventColorMap[item.event] || '#6B7280'
        ),
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  // チャートオプション（横棒グラフ、モバイル対応）
  const chartOptions = {
    indexAxis: 'y', // 横棒グラフにする
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => `イベント回数: ${context.parsed.x}回`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          precision: 0,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            // 長いラベルを短縮
            return label.length > 15 ? label.substring(0, 15) + '...' : label;
          }
        }
      }
    },
    layout: {
      padding: {
        right: 50 // データラベル用のスペース
      }
    }
  };

  if (!summaryRanking || summaryRanking.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">イベントランキングデータがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">🔝 イベントランキング（Top10）</h2>
          <div className="text-sm text-gray-500">
            総イベント数: <span className="font-semibold">{summaryRanking.reduce((sum, item) => sum + item.count, 0).toLocaleString()}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          音響イベントの発生回数ランキング（降順）
        </p>
      </div>
      
      <div className="h-80 md:h-96 relative">
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* モバイル用の詳細情報 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
        {top10Data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: eventColorMap[item.event] || '#6B7280' }}
            ></div>
            <span className="truncate text-gray-600">{item.event}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventRankingChart; 