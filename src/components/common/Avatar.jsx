import { useState } from 'react';

/**
 * 統一されたアバター表示コンポーネント
 * 画像が存在しない場合は自動的にフォールバック表示
 */
const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'medium', 
  className = '',
  fallbackColor = 'bg-blue-500'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // サイズクラスの定義
  const sizeClasses = {
    small: 'h-8 w-8 text-sm',
    medium: 'h-12 w-12 text-lg', 
    large: 'h-32 w-32 text-4xl',
    xlarge: 'h-40 w-40 text-5xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  // 画像エラー時の処理
  const handleImageError = () => {
    console.log('アバター画像の読み込みに失敗:', src);
    setImageError(true);
    setImageLoaded(false);
  };

  // 画像読み込み成功時の処理
  const handleImageLoad = () => {
    console.log('アバター画像の読み込み成功:', src);
    setImageError(false);
    setImageLoaded(true);
  };

  // 名前から初期文字を取得（安全な取得）
  const getInitial = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name.charAt(0).toUpperCase();
  };

  // フォールバック表示を使用する条件
  const shouldShowFallback = !src || imageError || !imageLoaded;

  return (
    <div className={`relative ${className}`}>
      {/* 画像表示 */}
      {src && !imageError && (
        <img
          src={src}
          alt={alt || name || 'アバター'}
          className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-200`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: shouldShowFallback ? 'none' : 'block' }}
        />
      )}
      
      {/* フォールバック表示（名前の初期文字 + 背景色） */}
      <div 
        className={`${sizeClass} rounded-full ${fallbackColor} text-white flex items-center justify-center font-semibold border-2 border-gray-200 ${
          shouldShowFallback ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-200`}
        style={{ display: shouldShowFallback ? 'flex' : 'none' }}
      >
        {getInitial(name)}
      </div>
      
      {/* 読み込み中の表示 */}
      {src && !imageError && !imageLoaded && (
        <div 
          className={`${sizeClass} rounded-full bg-gray-200 animate-pulse border-2 border-gray-200 absolute top-0 left-0`}
        />
      )}
    </div>
  );
};

export default Avatar;