import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createClient } from '@supabase/supabase-js';
import { 
  handleError, 
  expressErrorHandler, 
  asyncHandler, 
  ERROR_CATEGORIES 
} from './config/errorHandler.js';
import dotenv from 'dotenv';

dotenv.config();
const { promises: fsPromises } = fs;

// 環境別設定をCJS形式で読み込み
const getServerConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  
  return {
    // 環境情報
    NODE_ENV: nodeEnv,
    isDevelopment,
    isProduction,
    
    // サーバー設定
    PORT: parseInt(process.env.PORT) || 3001,
    EXPRESS_JSON_LIMIT: process.env.EXPRESS_JSON_LIMIT || '50mb',
    
    // パス設定
    PATHS: {
      dataDir: process.env.DATA_ROOT_DIR || 'data_accounts',
      usersFile: process.env.USERS_FILE_NAME || 'users.json',
      staticDir: process.env.STATIC_DIST_DIR || 'dist',
      avatarsDir: process.env.AVATARS_DIR || 'public/avatars',
    },
    
    // Supabase設定
    SUPABASE: {
      url: process.env.VITE_SUPABASE_URL,
      anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    },
    
    // データソース設定
    DATA_SOURCE: process.env.VITE_DATA_SOURCE || 'supabase',
    
    // CORS設定（環境別）
    CORS: {
      origin: isDevelopment 
        ? [`http://localhost:${parseInt(process.env.VITE_PORT) || 5173}`]
        : (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*']),
      credentials: true,
    }
  };
};

// 設定の検証
const validateServerConfig = (config) => {
  const errors = [];
  
  // 必須環境変数のチェック
  if (!config.SUPABASE.url) {
    errors.push('VITE_SUPABASE_URL が設定されていません');
  }
  if (!config.SUPABASE.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY が設定されていません');
  }
  
  // ポート番号の検証
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push(`無効なポート番号: ${config.PORT}`);
  }
  
  // データソース設定の検証
  if (!['supabase', 'vault'].includes(config.DATA_SOURCE)) {
    errors.push(`無効なデータソース: ${config.DATA_SOURCE} (supabase または vault である必要があります)`);
  }
  
  if (errors.length > 0) {
    console.error('❌ サーバー設定エラーが検出されました:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n.envファイルを確認してください。');
    process.exit(1);
  }
  
  return config;
};

// 設定のログ出力
const logServerConfig = (config) => {
  if (config.isDevelopment) {
    console.log('⚙️  サーバー設定情報:');
    console.log(`  - 環境: ${config.NODE_ENV}`);
    console.log(`  - ポート: ${config.PORT}`);
    console.log(`  - データソース: ${config.DATA_SOURCE}`);
    console.log(`  - JSONリミット: ${config.EXPRESS_JSON_LIMIT}`);
    console.log(`  - CORS Origin: ${config.CORS.origin.join(', ')}`);
    console.log(`  - 静的ファイル: ${config.PATHS.staticDir}`);
    console.log(`  - データディレクトリ: ${config.PATHS.dataDir}`);
  }
};

// 設定を取得・検証
const CONFIG = validateServerConfig(getServerConfig());
logServerConfig(CONFIG);

const app = express();

// Supabaseクライアントの初期化
const supabase = createClient(
  CONFIG.SUPABASE.url,
  CONFIG.SUPABASE.anonKey
);

// ミドルウェア
app.use(cors(CONFIG.CORS));
app.use(express.json({ limit: CONFIG.EXPRESS_JSON_LIMIT }));

// 静的ファイル配信（環境別パス対応）
app.use(express.static(CONFIG.PATHS.staticDir)); // Viteのビルドディレクトリを提供
if (CONFIG.isProduction) {
  // プロダクション環境でのパス設定
  app.use('/product/dist', express.static(CONFIG.PATHS.staticDir));
  app.use('/product/dist/avatars', express.static(CONFIG.PATHS.avatarsDir));
}

// アバター画像の静的配信（ローカル・本番共通）
app.use('/avatars', express.static(CONFIG.PATHS.avatarsDir));

// データルートディレクトリ
const DATA_ROOT = path.join(__dirname, CONFIG.PATHS.dataDir);

// ユーザー管理用のファイルパス
const USERS_FILE = path.join(DATA_ROOT, CONFIG.PATHS.usersFile);

// ⚠️ 重要: 以下のファイルシステムAPIは廃止予定です
// TODO: 将来的にSupabaseへの完全移行を行い、これらのAPIを削除してください
// 現在はフロントエンドで使用されているため、代替実装が必要です

// 注意: EC2 API設定は削除されました。現在はSupabaseのみを使用しています。

// ディレクトリが存在しない場合は作成
async function ensureDirectory(dirPath) {
  try {
    await fsPromises.access(dirPath, fs.constants.F_OK);
  } catch (error) {
    // ディレクトリが存在しない場合は作成
    await fsPromises.mkdir(dirPath, { recursive: true });
  }
}

// ユーザーファイルの初期化 - Supabaseを使用するため無効化
// async function ensureUsersFile() {
//   try {
//     await fsPromises.access(USERS_FILE, fs.constants.F_OK);
//   } catch (error) {
//     // ファイルが存在しない場合はデフォルトユーザーで初期化
//     const defaultUsers = [
//       { 
//         id: 'user123',
//         name: '佐藤由紀子',
//         birthDate: '1990-05-15',
//         age: 33,
//         gender: '女',
//         organization: '株式会社サンプル',
//         notes: '集中力が高い。細かい作業が得意。',
//         profileImageUrl: `/avatars/avatar-user123.png`,
//         type: 'master'
//       },
//       { 
//         id: 'user456',
//         name: '佐藤あやか',
//         birthDate: '2015-12-03',
//         age: 8,
//         gender: '女',
//         organization: '○○小学校',
//         notes: '社交的で活発。言語能力が高い。',
//         profileImageUrl: `/avatars/avatar-user456.png`,
//         type: 'normal'
//       },
//       { 
//         id: 'user789',
//         name: '佐藤みなと',
//         birthDate: '2018-07-22',
//         age: 5,
//         gender: '男',
//         organization: '△△幼稚園',
//         notes: '好奇心旺盛。集中時間が短い傾向あり。',
//         profileImageUrl: `/avatars/avatar-user789.png`,
//         type: 'normal'
//       }
//     ];
//     await fsPromises.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
//     console.log('デフォルトユーザーファイルを作成しました');
//   }
// }

// サーバー起動時にルートデータディレクトリを確認
(async () => {
  await ensureDirectory(DATA_ROOT);
  // await ensureUsersFile(); // Supabaseを使用するため無効化
  console.log(`データディレクトリを確認: ${DATA_ROOT}`);
})();



// Supabaseからemotion-timelineデータを取得する新しいエンドポイント
app.get('/api/proxy/emotion-timeline-supabase/:deviceId/:date', asyncHandler(async (req, res) => {
  const { deviceId, date } = req.params;
  
  // リクエスト検証
  if (!deviceId || !date) {
    const { statusCode, response } = handleError(
      new Error('デバイスIDと日付は必須です'), 
      { endpoint: 'emotion-timeline-supabase', deviceId, date }
    );
    return res.status(statusCode).json(response);
  }

  console.log(`[PROXY] Emotion Timeline from Supabase: device=${deviceId}, date=${date}`);
  
  try {
    // vibe_whisper_summaryテーブルからデータを取得
    const { data: summaryData, error } = await supabase
      .from('vibe_whisper_summary')
      .select('*')
      .eq('device_id', deviceId)
      .eq('date', date)
      .single();
    
    if (error) {
      const { statusCode, response } = handleError(error, {
        endpoint: 'emotion-timeline-supabase',
        deviceId,
        date,
        operation: 'supabase_query'
      });
      return res.status(statusCode).json(response);
    }
    
    if (!summaryData) {
      const { statusCode, response } = handleError(
        { code: 'PGRST116', message: 'No data found' },
        { endpoint: 'emotion-timeline-supabase', deviceId, date }
      );
      return res.status(statusCode).json(response);
    }
    
    // 時間ポイントを生成（00:00から23:30まで30分刻み）
    const generateTimePoints = () => {
      const timePoints = [];
      for (let hour = 0; hour < 24; hour++) {
        timePoints.push(`${hour.toString().padStart(2, '0')}:00`);
        timePoints.push(`${hour.toString().padStart(2, '0')}:30`);
      }
      return timePoints;
    };
    
    // データ変換処理
    try {
      // EmotionTimeline.jsxが期待する形式に変換
      const emotionTimelineData = {
        timePoints: generateTimePoints(),
        emotionScores: summaryData.vibe_scores || [],
        averageScore: summaryData.average_score || 0,
        positiveHours: summaryData.positive_hours || 0,
        negativeHours: summaryData.negative_hours || 0,
        neutralHours: summaryData.neutral_hours || 0,
        insights: summaryData.insights || [],
        emotionChanges: summaryData.vibe_changes || [],
        date: summaryData.date,
        processedAt: summaryData.processed_at,
        deviceId: summaryData.device_id
      };
      
      console.log(`[PROXY] Emotion Timeline data retrieved successfully for ${deviceId}/${date}`);
      res.json(emotionTimelineData);
      
    } catch (dataError) {
      const { statusCode, response } = handleError(dataError, {
        endpoint: 'emotion-timeline-supabase',
        deviceId,
        date,
        operation: 'data_transformation',
        originalData: summaryData
      });
      return res.status(statusCode).json(response);
    }
    
  } catch (error) {
    const { statusCode, response } = handleError(error, {
      endpoint: 'emotion-timeline-supabase',
      deviceId,
      date,
      operation: 'general_error'
    });
    return res.status(statusCode).json(response);
  }
}));

// Supabaseからsed-summaryデータを取得する新しいエンドポイント
app.get('/api/proxy/sed-summary-supabase/:deviceId/:date', asyncHandler(async (req, res) => {
  const { deviceId, date } = req.params;
  
  // リクエスト検証
  if (!deviceId || !date) {
    const { statusCode, response } = handleError(
      new Error('デバイスIDと日付は必須です'), 
      { endpoint: 'sed-summary-supabase', deviceId, date }
    );
    return res.status(statusCode).json(response);
  }
  
  console.log(`[PROXY] SED Summary from Supabase: device=${deviceId}, date=${date}`);
  
  try {
    // behavior_summaryテーブルからデータを取得
    const { data: summaryData, error } = await supabase
      .from('behavior_summary')
      .select('*')
      .eq('device_id', deviceId)
      .eq('date', date)
      .single();
    
    if (error) {
      const { statusCode, response } = handleError(error, {
        endpoint: 'sed-summary-supabase',
        deviceId,
        date,
        operation: 'supabase_query'
      });
      return res.status(statusCode).json(response);
    }
    
    if (!summaryData) {
      const { statusCode, response } = handleError(
        { code: 'PGRST116', message: 'No SED data found' },
        { endpoint: 'sed-summary-supabase', deviceId, date }
      );
      return res.status(statusCode).json(response);
    }
    
    // Supabaseの新形式からVault API形式に変換
    const convertToVaultFormat = (supabaseData) => {
      const { summary_ranking, time_blocks } = supabaseData;
      
      // time_blocksを文字列配列形式に変換
      const convertedTimeBlocks = {};
      
      // 48スロット（00-00から23-30まで）を生成
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeSlot = `${hour.toString().padStart(2, '0')}-${minute.toString().padStart(2, '0')}`;
          
          if (time_blocks[timeSlot] === null) {
            // データなしの場合
            convertedTimeBlocks[timeSlot] = ["データなし"];
          } else if (Array.isArray(time_blocks[timeSlot])) {
            // データありの場合：[{"event": "Speech", "count": 3}] → ["Speech 3回"]
            convertedTimeBlocks[timeSlot] = time_blocks[timeSlot].map(item => 
              `${item.event} ${item.count}回`
            );
          } else {
            // 予期しない形式の場合
            convertedTimeBlocks[timeSlot] = ["データなし"];
          }
        }
      }
      
      return {
        date: supabaseData.date,
        summary_ranking: summary_ranking || [],
        time_blocks: convertedTimeBlocks,
        total_events: summary_ranking ? summary_ranking.reduce((sum, item) => sum + item.count, 0) : 0,
        analysis_period: "24 hours",
        generated_at: new Date().toISOString()
      };
    };
    
    // データ変換処理
    try {
      const vaultFormatData = convertToVaultFormat(summaryData);
      
      console.log(`[PROXY] SED Summary data converted successfully for ${deviceId}/${date}`);
      res.json(vaultFormatData);
      
    } catch (conversionError) {
      const { statusCode, response } = handleError(conversionError, {
        endpoint: 'sed-summary-supabase',
        deviceId,
        date,
        operation: 'data_conversion',
        originalData: summaryData
      });
      return res.status(statusCode).json(response);
    }
    
  } catch (error) {
    const { statusCode, response } = handleError(error, {
      endpoint: 'sed-summary-supabase',
      deviceId,
      date,
      operation: 'general_error'
    });
    return res.status(statusCode).json(response);
  }
}));

// Supabaseからopensmile-summaryデータを取得する新しいエンドポイント
app.get('/api/proxy/opensmile-summary-supabase/:deviceId/:date', asyncHandler(async (req, res) => {
  const { deviceId, date } = req.params;
  
  // リクエスト検証
  if (!deviceId || !date) {
    const { statusCode, response } = handleError(
      new Error('デバイスIDと日付は必須です'), 
      { endpoint: 'opensmile-summary-supabase', deviceId, date }
    );
    return res.status(statusCode).json(response);
  }
  
  console.log(`[PROXY] OpenSMILE Summary from Supabase: device=${deviceId}, date=${date}`);
  
  try {
    // emotion_opensmile_summaryテーブルからデータを取得
    const { data: summaryData, error } = await supabase
      .from('emotion_opensmile_summary')
      .select('*')
      .eq('device_id', deviceId)
      .eq('date', date)
      .single();
    
    if (error) {
      const { statusCode, response } = handleError(error, {
        endpoint: 'opensmile-summary-supabase',
        deviceId,
        date,
        operation: 'supabase_query'
      });
      return res.status(statusCode).json(response);
    }
    
    if (!summaryData) {
      const { statusCode, response } = handleError(
        { code: 'PGRST116', message: 'No emotion graph data found' },
        { endpoint: 'opensmile-summary-supabase', deviceId, date }
      );
      return res.status(statusCode).json(response);
    }
    
    // データ変換処理
    try {
      // EmotionGraph.jsxが期待する形式に変換
      const opensmileData = {
        date: summaryData.date,
        emotion_graph: summaryData.emotion_graph || [],
        device_id: summaryData.device_id,
        created_at: summaryData.created_at
      };
      
      console.log(`[PROXY] OpenSMILE data retrieved successfully for ${deviceId}/${date}`);
      res.json(opensmileData);
      
    } catch (dataError) {
      const { statusCode, response } = handleError(dataError, {
        endpoint: 'opensmile-summary-supabase',
        deviceId,
        date,
        operation: 'data_transformation',
        originalData: summaryData
      });
      return res.status(statusCode).json(response);
    }
    
  } catch (error) {
    const { statusCode, response } = handleError(error, {
      endpoint: 'opensmile-summary-supabase',
      deviceId,
      date,
      operation: 'general_error'
    });
    return res.status(statusCode).json(response);
  }
}));


// 注意: EC2からの手動データ取得エンドポイントは削除されました。現在はSupabaseのみを使用しています。



// ===== ユーザー管理API =====

// 全ユーザー一覧を取得
app.get('/api/users', async (req, res) => {
  try {
    const fileContent = await fsPromises.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(fileContent);
    res.json({ success: true, users });
  } catch (error) {
    console.log('ユーザー一覧取得で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 個別ユーザー情報を取得
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const fileContent = await fsPromises.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(fileContent);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'ユーザーが見つかりません' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.log('ユーザー取得で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ===== お知らせ管理API =====

// 特定ユーザーのお知らせ一覧を取得
app.get('/api/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const userDir = path.join(DATA_ROOT, userId);
    const notificationsFile = path.join(userDir, 'notifications.json');
    
    // ユーザーディレクトリを確認
    await ensureDirectory(userDir);
    
    try {
      await fsPromises.access(notificationsFile, fs.constants.F_OK);
      const fileContent = await fsPromises.readFile(notificationsFile, 'utf8');
      const data = JSON.parse(fileContent);
      res.json({ success: true, notifications: data.notifications || [] });
    } catch (error) {
      // ファイルが存在しない場合は空のファイルを作成
      const emptyNotifications = { notifications: [] };
      await fsPromises.writeFile(notificationsFile, JSON.stringify(emptyNotifications, null, 2));
      console.log(`空のお知らせファイルを作成しました: ${userId}/notifications.json`);
      res.json({ success: true, notifications: [] });
    }
  } catch (error) {
    console.log('お知らせ取得で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 特定ユーザーにお知らせを追加
app.post('/api/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const { message, type = 'info', priority = 'normal' } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'メッセージは必須です' });
    }
    
    const userDir = path.join(DATA_ROOT, userId);
    const notificationsFile = path.join(userDir, 'notifications.json');
    
    // ユーザーディレクトリを確認
    await ensureDirectory(userDir);
    
    let notifications = [];
    
    // 既存のお知らせファイルがある場合は読み込み
    try {
      await fsPromises.access(notificationsFile, fs.constants.F_OK);
      const fileContent = await fsPromises.readFile(notificationsFile, 'utf8');
      const data = JSON.parse(fileContent);
      notifications = data.notifications || [];
    } catch (error) {
      // ファイルが存在しない場合は新規作成
    }
    
    // 新しいお知らせを作成
    const newNotification = {
      id: Date.now(),
      type,
      priority,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    // 配列の先頭に追加（最新が上に来るように）
    notifications.unshift(newNotification);
    
    // ファイルに保存
    await fsPromises.writeFile(notificationsFile, JSON.stringify({ notifications }, null, 2));
    
    res.json({ success: true, notification: newNotification, message: 'お知らせを追加しました' });
  } catch (error) {
    console.log('お知らせ追加で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// お知らせの既読状態を更新
app.put('/api/users/:userId/notifications/:notificationId', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    const { isRead } = req.body;
    
    const notificationsFile = path.join(DATA_ROOT, userId, 'notifications.json');
    
    try {
      await fsPromises.access(notificationsFile, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({ success: false, error: 'お知らせファイルが見つかりません' });
    }
    
    const fileContent = await fsPromises.readFile(notificationsFile, 'utf8');
    const data = JSON.parse(fileContent);
    const notifications = data.notifications || [];
    
    const notificationIndex = notifications.findIndex(n => n.id == notificationId);
    if (notificationIndex === -1) {
      return res.status(404).json({ success: false, error: 'お知らせが見つかりません' });
    }
    
    // 既読状態を更新
    notifications[notificationIndex].isRead = isRead;
    
    // ファイルに保存
    await fsPromises.writeFile(notificationsFile, JSON.stringify({ notifications }, null, 2));
    
    res.json({ success: true, notification: notifications[notificationIndex], message: '既読状態を更新しました' });
  } catch (error) {
    console.log('お知らせ更新で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// お知らせを削除
app.delete('/api/users/:userId/notifications/:notificationId', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    const notificationsFile = path.join(DATA_ROOT, userId, 'notifications.json');
    
    try {
      await fsPromises.access(notificationsFile, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({ success: false, error: 'お知らせファイルが見つかりません' });
    }
    
    const fileContent = await fsPromises.readFile(notificationsFile, 'utf8');
    const data = JSON.parse(fileContent);
    let notifications = data.notifications || [];
    
    const originalLength = notifications.length;
    notifications = notifications.filter(n => n.id != notificationId);
    
    if (notifications.length === originalLength) {
      return res.status(404).json({ success: false, error: 'お知らせが見つかりません' });
    }
    
    // ファイルに保存
    await fsPromises.writeFile(notificationsFile, JSON.stringify({ notifications }, null, 2));
    
    res.json({ success: true, message: 'お知らせを削除しました' });
  } catch (error) {
    console.log('お知らせ削除で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 全ユーザーにお知らせを一括送信
app.post('/api/notifications/broadcast', async (req, res) => {
  try {
    const { message, type = 'info', priority = 'normal', targetUserIds } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'メッセージは必須です' });
    }
    
    // 対象ユーザーを取得
    const fileContent = await fsPromises.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(fileContent);
    
    let targetUsers = users;
    if (targetUserIds && Array.isArray(targetUserIds)) {
      targetUsers = users.filter(user => targetUserIds.includes(user.id));
    }
    
    const results = [];
    
    // 各ユーザーにお知らせを追加
    for (const user of targetUsers) {
      try {
        const userDir = path.join(DATA_ROOT, user.id);
        const notificationsFile = path.join(userDir, 'notifications.json');
        
        await ensureDirectory(userDir);
        
        let notifications = [];
        
        // 既存のお知らせファイルがある場合は読み込み
        try {
          await fsPromises.access(notificationsFile, fs.constants.F_OK);
          const fileContent = await fsPromises.readFile(notificationsFile, 'utf8');
          const data = JSON.parse(fileContent);
          notifications = data.notifications || [];
        } catch (error) {
          // ファイルが存在しない場合は新規作成
        }
        
        // 新しいお知らせを作成
        const newNotification = {
          id: Date.now() + Math.random(), // 重複を避けるためランダム要素を追加
          type,
          priority,
          message,
          timestamp: new Date().toISOString(),
          isRead: false,
          createdAt: new Date().toISOString(),
          isBroadcast: true
        };
        
        // 配列の先頭に追加
        notifications.unshift(newNotification);
        
        // ファイルに保存
        await fsPromises.writeFile(notificationsFile, JSON.stringify({ notifications }, null, 2));
        
        results.push({ userId: user.id, success: true });
      } catch (error) {
        console.log(`ユーザー ${user.id} へのお知らせ送信で問題が発生:`, error);
        results.push({ userId: user.id, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    res.json({ 
      success: true, 
      message: `${successCount}/${targetUsers.length} 人のユーザーにお知らせを送信しました`,
      results 
    });
  } catch (error) {
    console.log('一括お知らせ送信で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ログ管理API =====

// SPAのルーティングをサポート
app.get('*', (req, res) => {
  // APIエンドポイントの場合はエラーレスポンスを返す
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // その他のリクエストはindex.htmlを返す（SPAルーティング対応）
  res.sendFile(path.join(__dirname, CONFIG.PATHS.staticDir, 'index.html'));
});

// グローバルエラーハンドラーの追加
app.use(expressErrorHandler);

// 404ハンドラー（APIエンドポイント以外）
app.use((req, res) => {
  const { statusCode, response } = handleError(
    new Error('リクエストされたページが見つかりません'),
    { url: req.url, method: req.method }
  );
  res.status(404).json(response);
});

app.listen(CONFIG.PORT, () => {
  console.log(`🚀 サーバーがポート ${CONFIG.PORT} で起動しました`);
  console.log(`📊 ダッシュボード: http://localhost:${CONFIG.PORT}`);
  console.log(`🔌 API: http://localhost:${CONFIG.PORT}/api`);
  if (CONFIG.isDevelopment) {
    console.log(`📁 データディレクトリ: ${DATA_ROOT}`);
    console.log(`🖼️  アバターディレクトリ: ${CONFIG.PATHS.avatarsDir}`);
    console.log(`🗄️  Supabase URL: ${CONFIG.SUPABASE.url}`);
  }
  console.log(`✅ 環境: ${CONFIG.NODE_ENV} | データソース: ${CONFIG.DATA_SOURCE}`);
}); 