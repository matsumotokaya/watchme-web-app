import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageLayout = ({ title, backTo, backToParams, rightContent, children }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (backTo) {
      if (backToParams) {
        navigate(backTo, { state: backToParams });
      } else {
        navigate(backTo);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackClick}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-label="戻る"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {title && (
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              )}
            </div>
            
            {rightContent && (
              <div className="flex items-center">
                {rightContent}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-screen-lg mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default PageLayout; 