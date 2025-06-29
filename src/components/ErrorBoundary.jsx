import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo || null
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">アプリケーションエラーが発生しました</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                申し訳ございませんが、予期しないエラーが発生しました。
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mr-2"
              >
                ページを再読み込み
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                再試行
              </button>
            </div>

            <details className="bg-gray-50 rounded-md p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                技術的な詳細 (開発者向け)
              </summary>
              <div className="mt-2">
                <h4 className="font-medium text-gray-800 mb-2">エラー:</h4>
                <pre className="text-xs bg-red-50 p-2 rounded border overflow-auto max-h-32">
                  {this.state.error ? this.state.error.toString() : 'エラー情報なし'}
                </pre>
                
                {this.state.error && this.state.error.stack && (
                  <>
                    <h4 className="font-medium text-gray-800 mb-2 mt-4">エラースタック:</h4>
                    <pre className="text-xs bg-red-50 p-2 rounded border overflow-auto max-h-48">
                      {this.state.error.stack}
                    </pre>
                  </>
                )}
                
                <h4 className="font-medium text-gray-800 mb-2 mt-4">コンポーネントスタック:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded border overflow-auto max-h-48">
                  {this.state.errorInfo && this.state.errorInfo.componentStack ? this.state.errorInfo.componentStack : 'コンポーネントスタック情報なし'}
                </pre>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 