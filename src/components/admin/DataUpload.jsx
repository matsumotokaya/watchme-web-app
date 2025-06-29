import { useState, useEffect, useRef } from 'react';
import {
  createUserDirectory,
  saveLogData,
  getAllLogData,
  getUserLogs,
  getLogDataTypes
} from '../../services/dataService';

const DataUpload = ({ users = [] }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [savedLogsDate, setSavedLogsDate] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [availableDataTypes, setAvailableDataTypes] = useState([]);
  
  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState(today);
  
  // 期待されるデータタイプ
  const expectedDataTypes = ['emotion-timeline', 'event-logs', 'emotion-distribution'];
  
  // データタイプの日本語名
  const dataTypeNames = {
    'emotion-timeline': '感情タイムライン',
    'event-logs': '行動ログ', 
    'emotion-distribution': '感情分布'
  };
  
  // usersが変更されたときにselectedUserを更新
  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0].id);
    }
  }, [users, selectedUser]);
  
  // 選択されたユーザーのデータを取得
  const selectedUserData = users.find(user => user.id === selectedUser);
  
  // 選択されたユーザーが変更されたときに保存済みデータを読み込む
  useEffect(() => {
    if (selectedUser) {
      loadUserLogs(selectedUser);
    }
  }, [selectedUser]);
  
  // 選択された日付が変更されたときに利用可能なデータタイプを読み込む
  useEffect(() => {
    if (selectedUser && selectedDate) {
      loadAvailableDataTypes(selectedUser, selectedDate);
    }
  }, [selectedUser, selectedDate]);
  
  // 指定されたユーザーのログ一覧を読み込む
  const loadUserLogs = async (userId) => {
    try {
      setIsLoadingLogs(true);
      // まずユーザーディレクトリを確認（なければ作成）
      await createUserDirectory(userId);
      
      // ログ一覧を取得
      const logs = await getUserLogs(userId);
      setSavedLogsDate(logs);
      
      if (logs.length > 0) {
        // 最新のログを選択
        setSelectedDate(logs[logs.length - 1]);
      } else {
        setSelectedDate('');
      }
    } catch (error) {
      console.error('ログ一覧取得エラー:', error);
      setMessage({ text: `ログ一覧の取得に失敗しました: ${error.message}`, type: 'error' });
    } finally {
      setIsLoadingLogs(false);
    }
  };
  
  // 指定された日付の利用可能なデータタイプを読み込む
  const loadAvailableDataTypes = async (userId, date) => {
    try {
      const dataTypes = await getLogDataTypes(userId, date);
      setAvailableDataTypes(dataTypes);
    } catch (error) {
      // エラーが発生した場合は空配列を設定し、コンソールエラーは抑制
      setAvailableDataTypes([]);
      // 404エラー以外の場合のみログ出力
      if (!error.message.includes('404') && !error.message.includes('見つかりません')) {
        console.warn('データタイプ一覧取得で予期しないエラー:', error);
      }
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }

    setSelectedFile(file);
    
    // JSONファイルのプレビューと検証
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        
        // 統合形式の検証
        if (typeof jsonData === 'object' && jsonData !== null) {
          const containedTypes = Object.keys(jsonData).filter(key => expectedDataTypes.includes(key));
          
          if (containedTypes.length > 0) {
            setPreviewData(jsonData);
            setMessage({ 
              text: `統合JSONデータが正常に読み込まれました（含まれるデータタイプ: ${containedTypes.map(type => dataTypeNames[type]).join(', ')}）`, 
              type: 'success' 
            });
          } else {
            setPreviewData(jsonData);
            setMessage({ 
              text: '統合形式ではありませんが、JSONとして読み込まれました。期待されるデータタイプが含まれていない可能性があります。', 
              type: 'warning' 
            });
          }
        } else {
          setPreviewData(jsonData);
          setMessage({ text: 'JSONデータが読み込まれましたが、オブジェクト形式ではありません', type: 'warning' });
        }
      } catch (error) {
        setPreviewData(null);
        setMessage({ text: '無効なJSONファイルです', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser || !previewData) {
      setMessage({ text: '必須項目がすべて入力されていません', type: 'error' });
      return;
    }
    
    setUploading(true);
    
    try {
      // ファイルシステムに統合形式で保存
      await createUserDirectory(selectedUser);
      
      // 統合形式の場合、各データタイプを個別に保存
      if (typeof previewData === 'object' && previewData !== null) {
        let savedCount = 0;
        const errors = [];
        
        for (const [dataType, data] of Object.entries(previewData)) {
          if (expectedDataTypes.includes(dataType)) {
            try {
              await saveLogData(selectedUser, logDate, dataType, data);
              savedCount++;
            } catch (error) {
              errors.push(`${dataTypeNames[dataType] || dataType}: ${error.message}`);
            }
          }
        }
        
        if (savedCount > 0) {
          setMessage({ 
            text: `${savedCount}種類のデータがファイルシステムに保存されました（${selectedUser}/${logDate}.json）${errors.length > 0 ? '\nエラー: ' + errors.join(', ') : ''}`, 
            type: savedCount === Object.keys(previewData).length ? 'success' : 'warning'
          });
          // ログ一覧を更新
          loadUserLogs(selectedUser);
        } else {
          throw new Error('保存できるデータタイプが見つかりませんでした');
        }
      } else {
        throw new Error('統合形式のオブジェクトではありません');
      }
      
      // フォームをリセット
      setTimeout(() => {
        setUploading(false);
        setSelectedFile(null);
        setPreviewData(null);
        
        // ファイル入力をリセット
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
          fileInput.value = '';
        }
      }, 800);
    } catch (error) {
      setUploading(false);
      setMessage({ text: `データの保存に失敗しました: ${error.message}`, type: 'error' });
    }
  };

  // ユーザー選択が変更されたときの処理
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    // 選択されているユーザーが変更されたら、フォームをリセット
    setSelectedFile(null);
    setPreviewData(null);
    setMessage({ text: '', type: '' });
  };
  
  // 選択された日付のログを読み込む
  const handleLoadLogData = async () => {
    if (!selectedUser || !selectedDate) return;
    
    try {
      setUploading(true);
      const data = await getAllLogData(selectedUser, selectedDate);
      setPreviewData(data);
      setMessage({ text: `${selectedDate}の統合データを読み込みました`, type: 'success' });
    } catch (error) {
      console.error('ログデータ読み込みエラー:', error);
      setMessage({ text: `ログデータの読み込みに失敗しました: ${error.message}`, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">統合JSONデータアップロード</h2>
        <p className="text-sm text-gray-600 mb-3">
          1つのJSONファイルに3つのグラフデータを統合した形式でアップロードします。
        </p>
      </div>
      
      {message.text && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 
          message.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
          'bg-red-50 text-red-800'
        }`}>
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-md font-medium text-gray-700">アップロード設定</h3>
          </div>
          
          <div className="p-4 space-y-4">
            {/* ユーザー選択UI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ユーザー選択
              </label>
              {users.length === 0 ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  ユーザーデータを読み込み中...
                </div>
              ) : (
                <select
                  value={selectedUser || ''}
                  onChange={handleUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">ユーザーを選択してください</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.id})
                    </option>
                  ))}
                </select>
              )}
            </div>
        {/* 選択されたユーザー情報の表示 */}
        {selectedUserData && (
          <div className="bg-blue-50 rounded-lg p-4 flex items-center space-x-4">
            {selectedUserData.profileImageUrl ? (
              <img
                src={selectedUserData.profileImageUrl}
                alt={selectedUserData.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {selectedUserData.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-blue-800">
                {selectedUserData.name}の統合データを管理します
              </p>
              <p className="text-xs text-blue-600">
                ユーザーID: {selectedUserData.id}
                {` | 保存日付: ${logDate}`}
              </p>
            </div>
          </div>
        )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                保存日付
              </label>
              <input
                type="date"
                value={logDate || ''}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                統合JSONファイル
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                3つのグラフデータを統合した.json形式のファイルをアップロードしてください
              </p>
            </div>
          </div>
        </div>
        

        
        {/* ファイルシステムのログ一覧を表示（ファイルシステムモードの場合） */}
        {selectedUser && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">保存済みログ一覧</h3>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => loadUserLogs(selectedUser)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  更新
                </button>
              </div>
            </div>
            
            <div className="p-3">
              {isLoadingLogs ? (
                <p className="text-sm text-gray-500 text-center py-2">読み込み中...</p>
              ) : savedLogsDate.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      value={selectedDate || ''}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">日付を選択</option>
                      {savedLogsDate.map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                    
                    <button
                      type="button"
                      onClick={handleLoadLogData}
                      disabled={!selectedDate}
                      className={`px-4 py-2 rounded-md text-sm ${
                        !selectedDate
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                      }`}
                    >
                      読み込み
                    </button>
                  </div>
                  
                  {selectedDate && availableDataTypes.length > 0 && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {selectedDate}に含まれるデータタイプ: {availableDataTypes.map(type => dataTypeNames[type] || type).join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  保存済みログはありません
                </p>
              )}
            </div>
          </div>
        )}
        
        {previewData && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">データプレビュー</h3>
              <span className="text-xs text-gray-500">統合JSON形式</span>
            </div>
            <div className="p-3 overflow-auto max-h-60">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedUser || !previewData || uploading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '保存中...' : 'ファイルシステムに保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DataUpload; 