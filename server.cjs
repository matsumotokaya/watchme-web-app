const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = fs;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 設定の読み込み（.envから）
const CONFIG = {
  // サーバー設定
  PORT: parseInt(process.env.PORT) || 3001,
  EXPRESS_JSON_LIMIT: process.env.EXPRESS_JSON_LIMIT || '50mb',
  
  // ディレクトリ設定
  DATA_ROOT_DIR: process.env.DATA_ROOT_DIR || 'data_accounts',
  USERS_FILE_NAME: process.env.USERS_FILE_NAME || 'users.json',
  STATIC_DIST_DIR: process.env.STATIC_DIST_DIR || 'dist',
  AVATARS_DIR: process.env.AVATARS_DIR || 'public/avatars',
  
  // Supabase設定
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  
  // データソース設定
  DATA_SOURCE: process.env.VITE_DATA_SOURCE || 'supabase',
  
  // 環境設定
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// 設定の検証
const validateConfig = () => {
  const errors = [];
  
  // 必須環境変数のチェック
  if (!CONFIG.SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL が設定されていません');
  }
  if (!CONFIG.SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY が設定されていません');
  }
  
  // ポート番号の検証
  if (isNaN(CONFIG.PORT) || CONFIG.PORT < 1 || CONFIG.PORT > 65535) {
    errors.push(`無効なポート番号: ${CONFIG.PORT}`);
  }
  
  // データソース設定の検証
  if (!['supabase', 'vault'].includes(CONFIG.DATA_SOURCE)) {
    errors.push(`無効なデータソース: ${CONFIG.DATA_SOURCE} (supabase または vault である必要があります)`);
  }
  
  if (errors.length > 0) {
    console.error('❌ 設定エラーが検出されました:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n.envファイルを確認してください。');
    process.exit(1);
  }
  
  // 設定内容のログ出力（開発環境のみ）
  if (CONFIG.NODE_ENV === 'development') {
    console.log('⚙️  設定情報:');
    console.log(`  - ポート: ${CONFIG.PORT}`);
    console.log(`  - データソース: ${CONFIG.DATA_SOURCE}`);
    console.log(`  - 環境: ${CONFIG.NODE_ENV}`);
    console.log(`  - JSONリミット: ${CONFIG.EXPRESS_JSON_LIMIT}`);
  }
};

// 設定検証を実行
validateConfig();

const app = express();

// Supabaseクライアントの初期化
const supabase = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: CONFIG.EXPRESS_JSON_LIMIT }));
app.use(express.static(CONFIG.STATIC_DIST_DIR)); // Viteのビルドディレクトリを提供
app.use('/product/dist', express.static(CONFIG.STATIC_DIST_DIR)); // プロダクション環境用のパス

// アバター画像の静的配信（ローカル・本番共通）
app.use('/avatars', express.static(CONFIG.AVATARS_DIR));
app.use('/product/dist/avatars', express.static(CONFIG.AVATARS_DIR));

// データルートディレクトリ
const DATA_ROOT = path.join(__dirname, CONFIG.DATA_ROOT_DIR);

// ユーザー管理用のファイルパス
const USERS_FILE = path.join(DATA_ROOT, CONFIG.USERS_FILE_NAME);

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

// ユーザーディレクトリの作成
app.post('/api/users/:userId/create', async (req, res) => {
  try {
    const { userId } = req.params;
    const userDir = path.join(DATA_ROOT, userId);
    const logsDir = path.join(userDir, 'logs');
    
    await ensureDirectory(userDir);
    await ensureDirectory(logsDir);
    
    res.json({ success: true, message: `ユーザーディレクトリを作成しました: ${userId}` });
  } catch (error) {
    console.log('ディレクトリ作成で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Supabaseからemotion-timelineデータを取得する新しいエンドポイント
app.get('/api/proxy/emotion-timeline-supabase/:deviceId/:date', async (req, res) => {
  const { deviceId, date } = req.params;
  
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
      console.log(`[PROXY] Supabase Error:`, error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'この日付のデータは見つかりません' });
      }
      return res.status(500).json({ error: 'データベースエラーが発生しました' });
    }
    
    if (!summaryData) {
      return res.status(404).json({ error: 'この日付のデータは見つかりません' });
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
    
    console.log(`[PROXY] Supabase data retrieved successfully`);
    res.json(emotionTimelineData);
  } catch (error) {
    console.log(`[PROXY] Emotion Timeline from Supabase取得で問題が発生:`, error);
    res.status(500).json({ error: 'データ取得中に予期しないエラーが発生しました。' });
  }
});

// Supabaseからsed-summaryデータを取得する新しいエンドポイント
app.get('/api/proxy/sed-summary-supabase/:deviceId/:date', async (req, res) => {
  const { deviceId, date } = req.params;
  
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
      console.log(`[PROXY] Supabase Error:`, error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'この日付のSEDデータは見つかりません' });
      }
      return res.status(500).json({ error: 'データベースエラーが発生しました' });
    }
    
    if (!summaryData) {
      return res.status(404).json({ error: 'この日付のSEDデータは見つかりません' });
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
    
    const vaultFormatData = convertToVaultFormat(summaryData);
    
    console.log(`[PROXY] Supabase SED data converted to Vault format successfully`);
    res.json(vaultFormatData);
  } catch (error) {
    console.log(`[PROXY] SED Summary from Supabase取得で問題が発生:`, error);
    res.status(500).json({ error: 'データ取得中に予期しないエラーが発生しました。' });
  }
});

// Supabaseからopensmile-summaryデータを取得する新しいエンドポイント
app.get('/api/proxy/opensmile-summary-supabase/:deviceId/:date', async (req, res) => {
  const { deviceId, date } = req.params;
  
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
      console.log(`[PROXY] Supabase query error:`, error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'この日付の感情グラフデータは見つかりません',
          date: date 
        });
      }
      throw error;
    }
    
    // EmotionGraph.jsxが期待する形式に変換
    // emotion_graphフィールドのJSONBデータをそのまま使用
    const opensmileData = {
      date: summaryData.date,
      emotion_graph: summaryData.emotion_graph || [],
      device_id: summaryData.device_id,
      created_at: summaryData.created_at
    };
    
    res.json(opensmileData);
  } catch (error) {
    console.log(`[PROXY] OpenSMILE Summary from Supabase取得で問題が発生:`, error);
    res.status(500).json({ error: '感情グラフデータ取得中に予期しないエラーが発生しました。' });
  }
});


// 注意: EC2からの手動データ取得エンドポイントは削除されました。現在はSupabaseのみを使用しています。

// 日付を指定して全データタイプを一括保存（手動更新用）
app.post('/api/users/:userId/logs/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const allData = req.body;
    
    if (!allData || typeof allData !== 'object') {
      return res.status(400).json({ success: false, error: '有効なJSONデータが提供されていません' });
    }
    
    const userDir = path.join(DATA_ROOT, userId);
    const logsDir = path.join(userDir, 'logs');
    const filePath = path.join(logsDir, `${date}.json`);
    
    // ディレクトリが存在することを確認
    await ensureDirectory(userDir);
    await ensureDirectory(logsDir);
    
    // 日付情報を追加（存在しない場合）
    if (!allData.date) {
      allData.date = date;
    }
    
    // ファイルに書き込み（既存データは完全に上書き）
    await fsPromises.writeFile(filePath, JSON.stringify(allData, null, 2));
    
    console.log(`手動更新: ${userId}/${date}.json にデータを保存しました`);
    res.json({ 
      success: true, 
      message: `データを保存しました: ${userId}/${date}.json`,
      dataTypes: Object.keys(allData).filter(key => key !== 'date')
    });
  } catch (error) {
    console.log('データ一括保存で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 特定のデータタイプを指定して日ごとのデータを保存
app.post('/api/users/:userId/logs/:date/:dataType', async (req, res) => {
  try {
    const { userId, date, dataType } = req.params;
    const { data, append = false } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: 'データが提供されていません' });
    }
    
    const userDir = path.join(DATA_ROOT, userId);
    const logsDir = path.join(userDir, 'logs');
    const filePath = path.join(logsDir, `${date}.json`);
    
    // ディレクトリが存在することを確認
    await ensureDirectory(userDir);
    await ensureDirectory(logsDir);
    
    let existingData = {};
    
    // 既存ファイルがある場合は読み込み
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = await fsPromises.readFile(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        console.log('既存ファイル読み込みで問題が発生:', error);
        existingData = {};
      }
    }
    
    if (append && existingData[dataType]) {
      // 既存のデータに追記
      if (Array.isArray(existingData[dataType]) && Array.isArray(data)) {
        // 配列の場合は結合
        existingData[dataType] = [...existingData[dataType], ...data];
      } else if (typeof existingData[dataType] === 'object' && typeof data === 'object') {
        // オブジェクトの場合はマージ
        existingData[dataType] = { ...existingData[dataType], ...data };
      } else {
        // その他の場合は上書き
        existingData[dataType] = data;
      }
    } else {
      // 新規データまたは上書き
      existingData[dataType] = data;
    }
    
    // ファイルに書き込み
    await fsPromises.writeFile(filePath, JSON.stringify(existingData, null, 2));
    
    res.json({ success: true, message: `データを保存しました: ${userId}/${date}.json (${dataType})` });
  } catch (error) {
    console.log('データ保存で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 特定の日付のログに含まれるデータタイプ一覧を取得
app.get('/api/users/:userId/logs/:date/types', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const filePath = path.join(DATA_ROOT, userId, 'logs', `${date}.json`);
    
    try {
      await fsPromises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      return res.json({ success: true, dataTypes: [] });
    }
    
    const fileContent = await fsPromises.readFile(filePath, 'utf8');
    const allData = JSON.parse(fileContent);
    const dataTypes = Object.keys(allData);
    
    res.json({ success: true, dataTypes });
  } catch (error) {
    console.log('データタイプ一覧取得で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 特定のデータタイプを指定して日付のデータを取得
app.get('/api/users/:userId/logs/:date/:dataType', async (req, res) => {
  try {
    const { userId, date, dataType } = req.params;
    const filePath = path.join(DATA_ROOT, userId, 'logs', `${date}.json`);
    
    try {
      await fsPromises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({ success: false, error: '指定された日付のデータが見つかりません' });
    }
    
    const fileContent = await fsPromises.readFile(filePath, 'utf8');
    const allData = JSON.parse(fileContent);
    
    if (!allData[dataType]) {
      return res.status(404).json({ success: false, error: `指定されたデータタイプ(${dataType})のデータが見つかりません` });
    }
    
    res.json({ success: true, data: allData[dataType] });
  } catch (error) {
    console.log('データ取得で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 日付を指定してデータを取得（全データタイプ）
app.get('/api/users/:userId/logs/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const filePath = path.join(DATA_ROOT, userId, 'logs', `${date}.json`);
    
    try {
      await fsPromises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({ success: false, error: '指定された日付のデータが見つかりません' });
    }
    
    const data = await fsPromises.readFile(filePath, 'utf8');
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    console.log('データ取得で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// 新規ユーザーを作成
app.post('/api/users', async (req, res) => {
  try {
    const newUser = req.body;
    
    // 必須フィールドの検証
    if (!newUser.name) {
      return res.status(400).json({ success: false, error: '名前は必須です' });
    }
    
    // 通常アカウントの場合は親アカウントが必須
    if (newUser.type === 'normal' && !newUser.parentId) {
      return res.status(400).json({ success: false, error: '通常アカウントには親アカウントの指定が必須です' });
    }
    
    // IDを生成（タイムスタンプベース）
    newUser.id = `user${Date.now()}`;
    
    // デフォルト値の設定
    newUser.type = newUser.type || 'normal';
    
    // profileImageフィールドは削除（統一のため）
    delete newUser.profileImage;
    
    // profileImageUrlが指定されていない場合はデフォルト画像を生成
    if (!newUser.profileImageUrl || !newUser.profileImageUrl.trim()) {
      newUser.profileImageUrl = `/avatars/avatar-${newUser.name.charAt(0)}.png`;
    }
    
    const fileContent = await fsPromises.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(fileContent);
    
    // 親子関係の処理
    if (newUser.type === 'master') {
      // マスターアカウントの場合は空のchildrenIds配列を初期化
      newUser.childrenIds = [];
    } else if (newUser.type === 'normal' && newUser.parentId) {
      // 通常アカウントの場合は親アカウントを確認し、親のchildrenIdsに追加
      const parentUser = users.find(u => u.id === newUser.parentId);
      if (!parentUser) {
        return res.status(400).json({ success: false, error: '指定された親アカウントが見つかりません' });
      }
      if (parentUser.type !== 'master') {
        return res.status(400).json({ success: false, error: '親アカウントはマスターアカウントである必要があります' });
      }
      
      // 親アカウントのchildrenIdsに新しいユーザーIDを追加
      if (!parentUser.childrenIds) {
        parentUser.childrenIds = [];
      }
      parentUser.childrenIds.push(newUser.id);
    }
    
    // 新しいユーザーを追加
    users.push(newUser);
    
    // ファイルに保存
    await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    // ユーザーディレクトリも作成
    await ensureDirectory(path.join(DATA_ROOT, newUser.id));
    await ensureDirectory(path.join(DATA_ROOT, newUser.id, 'logs'));
    
    res.json({ success: true, user: newUser, message: 'ユーザーが作成されました' });
  } catch (error) {
    console.log('ユーザー作成で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ユーザー情報を更新
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedUserData = req.body;
    
    const fileContent = await fsPromises.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(fileContent);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'ユーザーが見つかりません' });
    }
    
    // ユーザー情報を更新（IDは変更不可）
    users[userIndex] = { ...users[userIndex], ...updatedUserData, id: userId };
    
    // ファイルに保存
    await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    res.json({ success: true, user: users[userIndex], message: 'ユーザー情報が更新されました' });
  } catch (error) {
    console.log('ユーザー更新で問題が発生:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ユーザーを削除
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const fileContent = await fsPromises.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(fileContent);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'ユーザーが見つかりません' });
    }
    
    const deletedUser = users[userIndex];
    
    // 親子関係の処理
    if (deletedUser.type === 'master' && deletedUser.childrenIds && deletedUser.childrenIds.length > 0) {
      // マスターアカウントに子アカウントがある場合は削除を拒否
      return res.status(400).json({ 
        success: false, 
        error: 'このマスターアカウントには子アカウントが存在します。先に子アカウントを削除してください。' 
      });
    } else if (deletedUser.type === 'normal' && deletedUser.parentId) {
      // 通常アカウントの場合は親アカウントのchildrenIdsから削除
      const parentUser = users.find(u => u.id === deletedUser.parentId);
      if (parentUser && parentUser.childrenIds) {
        parentUser.childrenIds = parentUser.childrenIds.filter(id => id !== userId);
      }
    }
    
    // ユーザーをリストから削除
    users.splice(userIndex, 1);
    
    // ファイルに保存
    await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    // ユーザーのデータディレクトリも削除（オプション）
    const userDir = path.join(DATA_ROOT, userId);
    try {
      await fsPromises.access(userDir, fs.constants.F_OK);
      // ディレクトリが存在する場合は削除
      await fsPromises.rm(userDir, { recursive: true, force: true });
      console.log(`ユーザーディレクトリを削除しました: ${userDir}`);
    } catch (error) {
      console.log(`ユーザーディレクトリが存在しないか削除できませんでした: ${userDir}`);
    }
    
    res.json({ 
      success: true, 
      user: deletedUser, 
      message: `ユーザー「${deletedUser.name}」が削除されました` 
    });
  } catch (error) {
    console.log('ユーザー削除で問題が発生:', error);
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
  res.sendFile(path.join(__dirname, CONFIG.STATIC_DIST_DIR, 'index.html'));
});

app.listen(CONFIG.PORT, () => {
  console.log(`サーバーがポート ${CONFIG.PORT} で起動しました`);
  console.log(`ダッシュボード: http://localhost:${CONFIG.PORT}`);
  console.log(`API: http://localhost:${CONFIG.PORT}/api`);
  console.log(`データディレクトリ: ${DATA_ROOT}`);
  console.log(`アバターディレクトリ: ${CONFIG.AVATARS_DIR}`);
  console.log(`Supabase URL: ${CONFIG.SUPABASE_URL}`);
}); 