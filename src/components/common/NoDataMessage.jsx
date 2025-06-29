import { formatDate } from '../../utils/dateUtils';

const NoDataMessage = ({ selectedDate, dataType = 'データ', errorCode = null }) => {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center p-4">
      <div className="text-gray-400 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-1">測定データなし</h3>
      <p className="text-sm text-gray-500">
        {formatDate(selectedDate)}（{selectedDate}）の{dataType}は測定されていません。<br />
        この期間は計測機器が動作していなかった可能性があります。
      </p>
      
      {/* デバッグ情報：カスタマーサービス向け */}
      {errorCode && (
        <div className="mt-3 text-xs text-gray-400 opacity-75">
          エラーコード: {errorCode}
        </div>
      )}
    </div>
  );
};

export default NoDataMessage; 