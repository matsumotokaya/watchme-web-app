// データサービス統合モジュール
// 開発・プロダクション環境で適切なサービスを選択

// 環境判定
const isDevelopment = import.meta.env.DEV;

// デバッグ用ログ
console.log('🔧 dataService.js が読み込まれました');
console.log('🌍 環境判定:', {
  isDevelopment,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD
});

// サービスを動的にインポートする関数
const getDataService = async () => {
  // 開発・プロダクション環境共にfileStorageServiceを使用
  console.log('🔧 fileStorageService.js を使用します');
  return await import('./fileStorageService.js');
};

// 全ユーザーの一覧を取得する
export const getAllUsers = async () => {
  const service = await getDataService();
  return service.getAllUsers();
};

// 個別ユーザー情報を取得する
export const getUser = async (userId) => {
  const service = await getDataService();
  return service.getUser(userId);
};

// 指定した日付のすべてのデータを取得する
export const getAllLogData = async (userId, date) => {
  const service = await getDataService();
  return service.getAllLogData(userId, date);
};

// 指定した日付の特定データタイプのデータを取得する
export const getLogData = async (userId, date, dataType) => {
  const service = await getDataService();
  return service.getLogData(userId, date, dataType);
};

// ユーザーのログ一覧を取得する
export const getUserLogs = async (userId) => {
  const service = await getDataService();
  return service.getUserLogs(userId);
};

// 特定の日付のログに含まれるデータタイプ一覧を取得する
export const getLogDataTypes = async (userId, date) => {
  const service = await getDataService();
  return service.getLogDataTypes(userId, date);
};

// ユーザーのお知らせを取得する
export const getUserNotifications = async (userId) => {
  const service = await getDataService();
  return service.getUserNotifications(userId);
};

// ユーザーディレクトリを作成する
export const createUserDirectory = async (userId) => {
  const service = await getDataService();
  return service.createUserDirectory(userId);
};

// 新規ユーザーを作成する
export const createUser = async (userData) => {
  const service = await getDataService();
  return service.createUser(userData);
};

// ユーザー情報を更新する
export const updateUser = async (userId, userData) => {
  const service = await getDataService();
  return service.updateUser(userId, userData);
};

// ユーザーを削除する
export const deleteUser = async (userId) => {
  const service = await getDataService();
  return service.deleteUser(userId);
};

// 特定のデータタイプを指定して日ごとのデータを保存する
export const saveLogData = async (userId, date, dataType, data, append = false) => {
  const service = await getDataService();
  return service.saveLogData(userId, date, dataType, data, append);
};

// 月次データを取得する
export const getMonthlyData = async (userId, year, month) => {
  const service = await getDataService();
  return service.getMonthlyData(userId, year, month);
};

// 通知を一括送信する
export const broadcastNotification = async (notificationData) => {
  const service = await getDataService();
  return service.broadcastNotification(notificationData);
};

// SEDサマリーデータを取得する
export const getSedSummaryData = async (userId, date) => {
  const service = await getDataService();
  return service.getSedSummaryData(userId, date);
};

// 各グラフ専用のデータ取得関数を追加
export const getEmotionTimelineData = async (...args) => {
  const service = await getDataService();
  return service.getEmotionTimelineData(...args);
};

export const getEventLogsData = async (...args) => {
  const service = await getDataService();
  return service.getEventLogsData(...args);
};

// export const getEmotionDistributionData = async (...args) => { // 🗑️ 削除予定: 使用されていない感情分布API
//   const service = await getDataService();
//   return service.getEmotionDistributionData(...args);
// };

// 環境情報もエクスポート
export const isDev = isDevelopment;
export const isProd = !isDevelopment; 