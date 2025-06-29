/**
 * 心理グラフデータ検証・前処理ユーティリティ
 * Dashboard.jsxから分離された機能モジュール
 */
import { getTodayString } from './dateUtils';

/**
 * 必須フィールドの検証
 * @param {Object} data - 検証するデータオブジェクト
 * @returns {boolean} - 検証結果
 */
export const validateRequiredFields = (data) => {
  if (!data.timePoints || !data.emotionScores) {
    console.warn('❌ 必須フィールド（timePoints, emotionScores）が不足しています');
    return false;
  }
  return true;
};

/**
 * 感情スコアの数値処理とサニタイズ
 * @param {Array} emotionScores - 処理する感情スコア配列
 * @returns {Object} - {processedScores: Array, warnings: Array}
 */
export const processEmotionScores = (emotionScores) => {
  const warnings = [];
  
  if (!Array.isArray(emotionScores)) {
    return { processedScores: [], warnings: ['emotionScoresが配列ではありません'] };
  }

  const originalScores = [...emotionScores];
  const processedScores = emotionScores.map((score, index) => {
    // nullやundefinedはそのまま保持（データ欠損として扱う）
    if (score === null || score === undefined) {
      return score;
    }
    
    // NaN文字列をチェック
    if (score === 'NaN' || (typeof score === 'string' && score.toLowerCase() === 'nan')) {
      warnings.push(`インデックス ${index}: "NaN"文字列を0に変換`);
      return 0;
    }
    
    // 数値に変換を試行
    const numScore = typeof score === 'string' ? parseFloat(score) : Number(score);
    
    // NaNチェック
    if (isNaN(numScore)) {
      warnings.push(`インデックス ${index}: 無効な値 "${score}" を0に変換`);
      return 0;
    }
    
    // float値の場合は四捨五入して整数化
    if (numScore % 1 !== 0) {
      const rounded = Math.round(numScore);
      console.log(`🔢 float値 ${numScore} を整数 ${rounded} に四捨五入`);
      return rounded;
    }
    
    // 異常値の範囲チェック（-100～100）
    if (numScore < -100 || numScore > 100) {
      const clamped = Math.max(-100, Math.min(100, numScore));
      warnings.push(`インデックス ${index}: 範囲外の値 ${numScore} を ${clamped} にクランプ`);
      return clamped;
    }
    
    return numScore;
  });
  
  // 変換の統計情報を出力
  const validCount = processedScores.filter(s => s !== null && s !== undefined).length;
  const nullCount = processedScores.filter(s => s === null || s === undefined).length;
  console.log(`📊 emotionScores処理結果: 有効値=${validCount}個, null/undefined=${nullCount}個`);
  
  return { processedScores, warnings };
};

/**
 * 配列長の整合性チェックと調整
 * @param {Array} timePoints - 時間ポイント配列
 * @param {Array} emotionScores - 感情スコア配列  
 * @returns {Object} - {adjustedTimePoints: Array, adjustedEmotionScores: Array, warnings: Array}
 */
export const ensureArrayConsistency = (timePoints, emotionScores) => {
  const warnings = [];
  
  if (!Array.isArray(timePoints) || !Array.isArray(emotionScores)) {
    return { 
      adjustedTimePoints: timePoints || [], 
      adjustedEmotionScores: emotionScores || [], 
      warnings: ['timePointsまたはemotionScoresが配列ではありません'] 
    };
  }

  const timeLength = timePoints.length;
  const scoreLength = emotionScores.length;
  
  if (timeLength !== scoreLength) {
    warnings.push(`配列長の不一致: timePoints=${timeLength}, emotionScores=${scoreLength}`);
    
    // 短い方に合わせる
    const minLength = Math.min(timeLength, scoreLength);
    const adjustedTimePoints = timePoints.slice(0, minLength);
    const adjustedEmotionScores = emotionScores.slice(0, minLength);
    console.log(`⚖️ 配列長を ${minLength} に統一しました`);
    
    return { adjustedTimePoints, adjustedEmotionScores, warnings };
  }
  
  return { adjustedTimePoints: timePoints, adjustedEmotionScores: emotionScores, warnings };
};

/**
 * 平均スコアの計算と検証
 * @param {Array} emotionScores - 感情スコア配列
 * @param {number} existingAverage - 既存の平均スコア
 * @returns {Object} - {averageScore: number, warnings: Array}
 */
export const calculateAverageScore = (emotionScores, existingAverage) => {
  const warnings = [];
  
  if (!Array.isArray(emotionScores)) {
    return { averageScore: existingAverage || 0, warnings: ['emotionScoresが配列ではありません'] };
  }

  const validScores = emotionScores.filter(s => typeof s === 'number' && !isNaN(s));
  
  if (validScores.length === 0) {
    return { averageScore: existingAverage || 0, warnings: ['有効な感情スコアがありません'] };
  }

  const calculatedAverage = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  const roundedAverage = Math.round(calculatedAverage * 10) / 10; // 小数点1桁まで
  
  if (!existingAverage || isNaN(existingAverage)) {
    console.log(`🧮 averageScoreを再計算: ${roundedAverage}`);
    return { averageScore: roundedAverage, warnings };
  }
  
  // 既存の値が大きく異なる場合は再計算値を使用
  const existingAvg = Number(existingAverage);
  if (Math.abs(existingAvg - roundedAverage) > 10) {
    warnings.push(`averageScore不整合: 既存=${existingAvg}, 計算値=${roundedAverage} → 計算値を採用`);
    return { averageScore: roundedAverage, warnings };
  }
  
  return { averageScore: existingAvg, warnings };
};

/**
 * 時間分布データの処理と検証
 * @param {Object} data - 時間分布データを含むオブジェクト
 * @returns {Object} - {processedHours: Object, warnings: Array}
 */
export const processTimeDistribution = (data) => {
  const warnings = [];
  const processedHours = {};
  
  // デフォルト値設定
  const setDefaultHours = (key, defaultValue) => {
    if (!data[key] || isNaN(Number(data[key]))) {
      processedHours[key] = defaultValue;
      console.log(`⚡ デフォルト値設定: ${key} = ${defaultValue}`);
    } else {
      processedHours[key] = Number(data[key]);
    }
  };
  
  setDefaultHours('positiveHours', 8);
  setDefaultHours('negativeHours', 4);
  setDefaultHours('neutralHours', 12);
  
  // 時間分布の整合性チェック（合計24時間）
  const totalHours = processedHours.positiveHours + processedHours.negativeHours + processedHours.neutralHours;
  
  if (Math.abs(totalHours - 24) > 1) { // 1時間の誤差許容
    const neutralAdjustment = 24 - processedHours.positiveHours - processedHours.negativeHours;
    processedHours.neutralHours = Math.max(0, neutralAdjustment);
    warnings.push(`時間分布調整: 合計=${totalHours}h → neutralHours=${processedHours.neutralHours}hに調整`);
  }
  
  return { processedHours, warnings };
};

/**
 * インサイトデータの処理とサニタイズ
 * @param {Array} insights - インサイト配列
 * @returns {Array} - 処理済みインサイト配列
 */
export const processInsights = (insights) => {
  if (!Array.isArray(insights) || insights.length === 0) {
    console.log('💡 デフォルトinsightsを設定');
    return ['分析データが不足しているため、詳細なインサイトは利用不可'];
  }
  
  // 無効な要素を除去
  const processedInsights = insights.filter(insight => 
    typeof insight === 'string' && insight.trim().length > 0
  );
  
  return processedInsights.length > 0 ? processedInsights : ['分析データが不足しているため、詳細なインサイトは利用不可'];
};

/**
 * 感情変化データの処理とサニタイズ
 * @param {Array} emotionChanges - 感情変化配列
 * @returns {Array} - 処理済み感情変化配列
 */
export const processEmotionChanges = (emotionChanges) => {
  if (!Array.isArray(emotionChanges)) {
    console.log('🎭 空のemotionChanges配列を設定');
    return [];
  }
  
  const processedChanges = emotionChanges.filter(change => 
    change && 
    typeof change.time === 'string' && 
    typeof change.event === 'string' && 
    !isNaN(Number(change.score))
  ).map(change => ({
    time: change.time,
    event: change.event,
    score: Math.round(Number(change.score))
  }));
  
  return processedChanges;
};

/**
 * 日付フィールドの検証
 * @param {string} date - 検証する日付文字列
 * @returns {string} - 有効な日付文字列
 */
export const validateDate = (date) => {
  if (!date || typeof date !== 'string') {
    const defaultDate = getTodayString();
    console.log(`📅 デフォルト日付を設定: ${defaultDate}`);
    return defaultDate;
  }
  return date;
};

/**
 * フォールバックデータ作成
 * @param {Object} rawData - 元データ
 * @returns {Object|null} - 最小限のフォールバックデータ
 */
export const createFallbackEmotionData = (rawData) => {
  console.log('🆘 フォールバックデータを作成します');
  
  try {
    // 最小限のデータ構造を作成
    const fallbackData = {
      date: rawData?.date || getTodayString(),
      timePoints: rawData?.timePoints || ['12:00'],
      emotionScores: rawData?.emotionScores || [0],
      averageScore: 0,
      positiveHours: 8,
      negativeHours: 4,
      neutralHours: 12,
      insights: ['データの解析中です。しばらくお待ちください。'],
      emotionChanges: []
    };
    
    // timePointsが配列でない場合は最小限のデータ
    if (!Array.isArray(fallbackData.timePoints)) {
      fallbackData.timePoints = ['12:00'];
      fallbackData.emotionScores = [0];
    }
    
    // emotionScoresが配列でない場合
    if (!Array.isArray(fallbackData.emotionScores)) {
      fallbackData.emotionScores = new Array(fallbackData.timePoints.length).fill(0);
    }
    
    // 長さの整合性確保
    if (fallbackData.timePoints.length !== fallbackData.emotionScores.length) {
      const minLength = Math.min(fallbackData.timePoints.length, fallbackData.emotionScores.length);
      fallbackData.timePoints = fallbackData.timePoints.slice(0, minLength);
      fallbackData.emotionScores = fallbackData.emotionScores.slice(0, minLength);
    }
    
    console.log('🔄 フォールバックデータ作成完了:', fallbackData);
    return fallbackData;
    
  } catch (fallbackError) {
    console.error('❌ フォールバックデータ作成も失敗:', fallbackError);
    return null;
  }
};

/**
 * 心理グラフ用の包括的データ検証・前処理関数（リファクタリング版）
 * @param {Object} rawData - 生のJSONデータ
 * @returns {Object|null} - 処理済みデータまたはnull
 */
export const validateEmotionTimelineData = (rawData) => {
  console.log('🔄 心理グラフデータの柔軟な前処理を開始します');
  console.log('受信データ:', rawData);

  try {
    // 必要なキーのみを抽出（その他のキーは無視）
    const requiredKeys = [
      'timePoints', 'emotionScores', 'averageScore', 
      'positiveHours', 'negativeHours', 'neutralHours', 
      'insights', 'emotionChanges', 'date'
    ];
    
    const processedData = {};
    const allWarnings = [];
    
    // 1. 必要なキーのみ抽出
    requiredKeys.forEach(key => {
      if (rawData[key] !== undefined) {
        processedData[key] = rawData[key];
      }
    });
    
    // 無視されたキーをログ出力
    const ignoredKeys = Object.keys(rawData).filter(key => !requiredKeys.includes(key));
    if (ignoredKeys.length > 0) {
      console.log('⏭️ 無視されたキー:', ignoredKeys);
    }
    
    // 2. 必須フィールドの検証
    if (!validateRequiredFields(processedData)) {
      return null;
    }
    
    // 3. 感情スコアの処理
    const { processedScores, warnings: scoresWarnings } = processEmotionScores(processedData.emotionScores);
    processedData.emotionScores = processedScores;
    allWarnings.push(...scoresWarnings);
    
    // 4. 配列長の整合性チェック
    const { adjustedTimePoints, adjustedEmotionScores, warnings: consistencyWarnings } = 
      ensureArrayConsistency(processedData.timePoints, processedData.emotionScores);
    processedData.timePoints = adjustedTimePoints;
    processedData.emotionScores = adjustedEmotionScores;
    allWarnings.push(...consistencyWarnings);
    
    // 5. 平均スコア再計算
    const { averageScore, warnings: avgWarnings } = 
      calculateAverageScore(processedData.emotionScores, processedData.averageScore);
    processedData.averageScore = averageScore;
    allWarnings.push(...avgWarnings);
    
    // 6. 時間分布データの処理
    const { processedHours, warnings: hoursWarnings } = processTimeDistribution(processedData);
    Object.assign(processedData, processedHours);
    allWarnings.push(...hoursWarnings);
    
    // 7. インサイトデータの処理
    processedData.insights = processInsights(processedData.insights);
    
    // 8. 感情変化データの処理
    processedData.emotionChanges = processEmotionChanges(processedData.emotionChanges);
    
    // 9. 日付フィールドの検証
    processedData.date = validateDate(processedData.date);
    
    // 10. ワーニングログの出力
    if (allWarnings.length > 0) {
      console.warn('⚠️ データ前処理で以下の問題を修正しました:');
      allWarnings.forEach((warning, index) => {
        console.warn(`  ${index + 1}. ${warning}`);
      });
    }
    
    console.log('✅ 心理グラフデータの前処理が完了しました');
    console.log('処理済みデータ:', processedData);
    
    return processedData;
    
  } catch (error) {
    console.error('❌ 心理グラフデータの前処理でエラーが発生:', error);
    console.error('エラースタック:', error.stack);
    
    // エラーが発生してもフォールバック処理を試行
    return createFallbackEmotionData(rawData);
  }
};