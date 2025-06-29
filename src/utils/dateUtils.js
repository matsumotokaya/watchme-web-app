/**
 * 日付操作ユーティリティ
 * WatchMe v8 全体で使用される日付関連の関数
 */

/**
 * 今日の日付を YYYY-MM-DD 形式で取得
 * @returns {string} YYYY-MM-DD形式の日付文字列
 */
export const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 日付を YYYY年MM月DD日 形式でフォーマット
 * @param {string|Date} date - 日付文字列またはDateオブジェクト
 * @returns {string} フォーマットされた日付文字列
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `${year}年${month}月${day}日`;
};

/**
 * 指定された日付が今日かどうかを判定
 * @param {string|Date} date - 判定する日付
 * @returns {boolean} 今日の場合true
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return targetDate.getFullYear() === today.getFullYear() &&
         targetDate.getMonth() === today.getMonth() &&
         targetDate.getDate() === today.getDate();
};

/**
 * 日付を指定された日数だけ変更
 * @param {string} dateString - YYYY-MM-DD形式の日付文字列
 * @param {number} days - 変更する日数（負の値で過去、正の値で未来）
 * @returns {string} 変更後のYYYY-MM-DD形式の日付文字列
 */
export const changeDate = (dateString, days) => {
  if (!dateString) return getTodayString();
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return getTodayString();
  
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 日付文字列を Date オブジェクトに変換
 * @param {string} dateString - YYYY-MM-DD形式の日付文字列
 * @returns {Date|null} Dateオブジェクトまたはnull
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * 日付の差を日数で計算
 * @param {string|Date} date1 - 開始日
 * @param {string|Date} date2 - 終了日
 * @returns {number} 日数の差
 */
export const dateDifference = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  const timeDiff = d2.getTime() - d1.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 曜日を取得
 * @param {string|Date} date - 日付
 * @returns {string} 曜日（月、火、水...）
 */
export const getDayOfWeek = (date) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return days[d.getDay()];
};

/**
 * 月の日数を取得
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {number} その月の日数
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

/**
 * 日付範囲を生成
 * @param {string} startDate - YYYY-MM-DD形式の開始日
 * @param {string} endDate - YYYY-MM-DD形式の終了日
 * @returns {string[]} 日付文字列の配列
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  
  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}; 