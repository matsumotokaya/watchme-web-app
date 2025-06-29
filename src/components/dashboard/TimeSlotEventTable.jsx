import { useState } from 'react';

const TimeSlotEventTable = ({ timeBlocks }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 時間スロットを生成（00:00～23:30の48スロット）
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        const timeSlot = `${hourStr}-${minuteStr}`;
        const displayTime = `${hourStr}:${minuteStr}`;
        slots.push({
          key: timeSlot,
          display: displayTime,
          events: timeBlocks?.[timeSlot] || ['データなし']
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 表示するスロット数を制御
  const displaySlots = isExpanded ? timeSlots : timeSlots.slice(0, 12);

  // イベントが「データなし」かどうかをチェック
  const isNoData = (events) => {
    return events.length === 1 && events[0] === 'データなし';
  };

  // 時間帯によるスタイリング
  const getTimeSlotStyle = (hour) => {
    const h = parseInt(hour.split(':')[0]);
    if (h >= 6 && h < 12) return 'bg-yellow-50 border-l-4 border-yellow-400'; // 朝
    if (h >= 12 && h < 18) return 'bg-blue-50 border-l-4 border-blue-400'; // 昼
    if (h >= 18 && h < 22) return 'bg-orange-50 border-l-4 border-orange-400'; // 夕
    return 'bg-gray-50 border-l-4 border-gray-400'; // 夜
  };

  if (!timeBlocks) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🕐 時間別イベントログ</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-2xl mb-2">⏰</div>
            <p className="text-sm">時間別イベントデータがありません</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">🕐 時間別イベントログ</h2>
          <div className="text-sm text-gray-500">
            30分刻み・48スロット
          </div>
        </div>
        <p className="text-sm text-gray-600">
          各時間帯で発生した音響イベントの一覧（最大10イベント表示）
        </p>
      </div>

      {/* 時間帯の凡例 */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
          <span>朝 (06:00-11:30)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
          <span>昼 (12:00-17:30)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
          <span>夕 (18:00-21:30)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
          <span>夜 (22:00-05:30)</span>
        </div>
      </div>

      {/* イベントテーブル */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                  時刻
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  イベント一覧
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displaySlots.map((slot, index) => (
                <tr 
                  key={slot.key}
                  className={`${getTimeSlotStyle(slot.display)} ${
                    index % 2 === 0 ? 'bg-opacity-30' : 'bg-opacity-50'
                  } hover:bg-opacity-70 transition-colors duration-150`}
                >
                  <td className="px-3 py-3 text-sm font-mono font-medium text-gray-900">
                    {slot.display}
                  </td>
                  <td className="px-3 py-3">
                    {isNoData(slot.events) ? (
                      <span className="text-gray-400 italic text-sm">No data</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {slot.events.slice(0, 10).map((event, eventIndex) => (
                          <span
                            key={eventIndex}
                            className="inline-block px-2 py-1 text-xs bg-white bg-opacity-80 text-gray-700 rounded-md border border-gray-200 shadow-sm"
                          >
                            {event}
                          </span>
                        ))}
                        {slot.events.length > 10 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-md">
                            +{slot.events.length - 10}件
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 展開/折りたたみボタン */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {isExpanded ? (
            <>
              <span>⬆️ 折りたたむ</span>
              <span className="ml-2 text-xs text-gray-500">({timeSlots.length - 12}件を非表示)</span>
            </>
          ) : (
            <>
              <span>⬇️ 全て表示</span>
              <span className="ml-2 text-xs text-gray-500">({timeSlots.length - 12}件をさらに表示)</span>
            </>
          )}
        </button>
      </div>

      {/* モバイル用サマリー */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg md:hidden">
        <h4 className="text-sm font-medium text-gray-700 mb-2">📊 アクティビティサマリー</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">アクティブ時間:</span>
            <span className="ml-1 font-semibold">
              {timeSlots.filter(slot => !isNoData(slot.events)).length}/48
            </span>
          </div>
          <div>
            <span className="text-gray-600">データなし:</span>
            <span className="ml-1 font-semibold">
              {timeSlots.filter(slot => isNoData(slot.events)).length}/48
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotEventTable; 