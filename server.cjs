const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = fs;

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('dist')); // Viteのビルドディレクトリを提供
app.use('/product/dist', express.static('dist')); // プロダクション環境用のパス

// アバター画像の静的配信（ローカル・本番共通）
app.use('/avatars', express.static('public/avatars'));
app.use('/product/dist/avatars', express.static('public/avatars'));

// データルートディレクトリ
const DATA_ROOT = path.join(__dirname, 'data_accounts');

// ユーザー管理用のファイルパス
const USERS_FILE = path.join(DATA_ROOT, 'users.json');

// EC2 API設定
const EC2_CONFIG = {
  BASE_URL: 'https://api.hey-watch.me',
  ENDPOINTS: {
    EMOTION_TIMELINE: '/api/users/{userId}/logs/{date}/emotion-timeline',
    SED_SUMMARY: '/api/users/{userId}/logs/{date}/sed-summary',
    OPENSMILE_SUMMARY: '/api/users/{userId}/logs/{date}/opensmile-summary'
  },
  TIMEOUT: 10000 // 10秒
};

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

// Vault APIへのプロキシエンドポイント
app.get('/api/proxy/sed-summary/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  const timestamp = new Date().getTime();
  const targetUrl = `${EC2_CONFIG.BASE_URL}/api/users/${userId}/logs/${date}/sed-summary?t=${timestamp}`;

  console.log(`[PROXY] SED Summary: ${targetUrl}`);
  try {
    const apiResponse = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'WatchMe-v8/1.0' }
    });
    if (!apiResponse.ok) {
      throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.log(`[PROXY] SED Summary取得で問題が発生:`, error);
    res.status(500).json({ error: 'Vault APIからデータを取得できませんでした' });
  }
});

app.get('/api/proxy/emotion-timeline/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  const timestamp = new Date().getTime();
  const targetUrl = `${EC2_CONFIG.BASE_URL}${EC2_CONFIG.ENDPOINTS.EMOTION_TIMELINE
    .replace('{userId}', userId)
    .replace('{date}', date)}?t=${timestamp}`;
  
  console.log(`[PROXY] Emotion Timeline: ${targetUrl}`);
  try {
    const apiResponse = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'WatchMe-v8/1.0' }
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log(`[PROXY] EC2 API Error ${apiResponse.status}:`, errorText);
      
      // EC2側のエラーレスポンスを解析
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail && errorData.detail.includes('nan')) {
          res.status(500).json({ 
            error: 'データ処理エラー: この日付のデータに無効な値（NaN）が含まれています。しばらく時間をおいてから再度お試しください。'
          });
          return;
        }
      } catch (parseError) {
        // JSON解析に失敗した場合は通常のエラー処理
      }
      
      if (apiResponse.status === 404) {
        res.status(404).json({ error: 'この日付のデータは見つかりません' });
      } else {
        res.status(apiResponse.status).json({ 
          error: `EC2 API Error: ${apiResponse.status} ${apiResponse.statusText}` 
        });
      }
      return;
    }
    
    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.log(`[PROXY] Emotion Timeline取得で問題が発生:`, error);
    
    // ネットワークエラーの場合
    if (error.message.includes('fetch')) {
      res.status(503).json({ 
        error: 'EC2 Vault APIとの通信でエラーが発生しました。ネットワーク接続を確認してください。' 
      });
    } else {
      res.status(500).json({ 
        error: 'データ取得中に予期しないエラーが発生しました。' 
      });
    }
  }
});

app.get('/api/proxy/opensmile-summary/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  const timestamp = new Date().getTime();
  const targetUrl = `${EC2_CONFIG.BASE_URL}${EC2_CONFIG.ENDPOINTS.OPENSMILE_SUMMARY
    .replace('{userId}', userId)
    .replace('{date}', date)}?t=${timestamp}`;
  
  console.log(`[PROXY] OpenSMILE Summary: ${targetUrl}`);
  try {
    const apiResponse = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'WatchMe-v8/1.0' }
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log(`[PROXY] EC2 API Error ${apiResponse.status}:`, errorText);
      
      if (apiResponse.status === 404) {
        res.status(404).json({ error: 'この日付の感情グラフデータは見つかりません' });
      } else {
        res.status(apiResponse.status).json({ 
          error: `EC2 API Error: ${apiResponse.status} ${apiResponse.statusText}` 
        });
      }
      return;
    }
    
    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.log(`[PROXY] OpenSMILE Summary取得で問題が発生:`, error);
    
    // ネットワークエラーの場合
    if (error.message.includes('fetch')) {
      res.status(503).json({ 
        error: 'EC2 Vault APIとの通信でエラーが発生しました。ネットワーク接続を確認してください。' 
      });
    } else {
      res.status(500).json({ 
        error: '感情グラフデータ取得中に予期しないエラーが発生しました。' 
      });
    }
  }
});

// EC2からデータを読み込んでユーザーログに保存（手動更新用）
app.post('/api/users/:userId/logs/:date/load-from-insights', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // EC2からemotion-timelineデータを取得
    const ec2Url = EC2_CONFIG.BASE_URL + EC2_CONFIG.ENDPOINTS.EMOTION_TIMELINE
      .replace('{userId}', userId)
      .replace('{date}', date);
    
    console.log(`手動更新: EC2からデータを読み込み中...`);
    console.log(`取得URL: ${ec2Url}`);
    
    const graphData = { date };
    const loadedDataTypes = [];
    const errors = [];
    
    try {
      // EC2からemotion-timelineデータを取得
      const response = await fetch(ec2Url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WatchMe-v8/1.0'
        },
        // タイムアウト設定
        signal: AbortSignal.timeout(EC2_CONFIG.TIMEOUT)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const emotionTimelineData = await response.json();
      
      // データの妥当性チェック
      if (!emotionTimelineData || typeof emotionTimelineData !== 'object') {
        throw new Error('取得したデータが無効です（JSONオブジェクトではありません）');
      }
      
      graphData['emotion-timeline'] = emotionTimelineData;
      loadedDataTypes.push('emotion-timeline');
      console.log(`✅ emotion-timeline.json EC2から読み込み成功`);
      
    } catch (error) {
      console.log(`⚠️ EC2からのemotion-timeline取得なし:`, error.message);
      errors.push(`emotion-timeline (EC2): ${error.message}`);
    }

    // EC2からSEDサマリーデータを取得
    const sedSummaryUrl = EC2_CONFIG.BASE_URL + EC2_CONFIG.ENDPOINTS.SED_SUMMARY
      .replace('{userId}', userId)
      .replace('{date}', date);
    
    try {
      console.log(`EC2からSEDサマリーデータを取得中...`);
      console.log(`取得URL: ${sedSummaryUrl}`);
      
      const sedResponse = await fetch(sedSummaryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WatchMe-v8/1.0'
        },
        signal: AbortSignal.timeout(EC2_CONFIG.TIMEOUT)
      });
      
      if (!sedResponse.ok) {
        throw new Error(`HTTP ${sedResponse.status}: ${sedResponse.statusText}`);
      }
      
      const sedSummaryData = await sedResponse.json();
      
      // データの妥当性チェック
      if (!sedSummaryData || typeof sedSummaryData !== 'object') {
        throw new Error('取得したSEDサマリーデータが無効です（JSONオブジェクトではありません）');
      }
      
      graphData['sed-summary'] = sedSummaryData;
      loadedDataTypes.push('sed-summary');
      console.log(`✅ sed-summary/result.json EC2から読み込み成功`);
      
    } catch (error) {
      console.log(`⚠️ EC2からのSEDサマリー取得なし:`, error.message);
      errors.push(`sed-summary (EC2): ${error.message}`);
    }
    
    // データが取得できなかった場合はエラー
    if (loadedDataTypes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `指定された日付（${date}）のデータが見つかりませんでした`,
        ec2Url,
        errors
      });
    }
    
    // ユーザーログディレクトリの準備
    const userDir = path.join(DATA_ROOT, userId);
    const logsDir = path.join(userDir, 'logs');
    const userLogFilePath = path.join(logsDir, `${date}.json`);
    
    await ensureDirectory(userDir);
    await ensureDirectory(logsDir);
    
    // 統合されたJSONファイルとして保存
    await fsPromises.writeFile(userLogFilePath, JSON.stringify(graphData, null, 2));
    
    console.log(`手動更新完了: ${userId}/${date}.json にデータを保存しました`);
    console.log(`読み込み成功: ${loadedDataTypes.join(', ')}`);
    if (errors.length > 0) {
      console.log(`データなし: ${errors.join(', ')}`);
    }
    
    res.json({ 
      success: true, 
      message: `EC2からデータを正常に更新しました`,
      sourceUrl: ec2Url,
      targetFile: `${userId}/${date}.json`,
      dataTypes: loadedDataTypes,
      dataSize: JSON.stringify(graphData).length,
      warnings: errors.length > 0 ? `一部のデータが利用できませんでした: ${errors.join(', ')}` : null
    });
    
  } catch (error) {
    console.log('手動更新で問題が発生:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

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
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 