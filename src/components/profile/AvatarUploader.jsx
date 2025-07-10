import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';

const AvatarUploader = ({ currentAvatar, onAvatarChange }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);


  // ファイル選択時の処理
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // ファイルサイズチェック（30MB以下）
      if (file.size > 30 * 1024 * 1024) {
        alert('画像サイズは30MB以下にしてください');
        return;
      }

      try {
        setIsProcessing(true);
        
        // 画像圧縮オプション
        const options = {
          maxSizeMB: 1, // 最大1MBに圧縮
          maxWidthOrHeight: 1920, // 最大幅または高さ
          useWebWorker: true,
          fileType: 'image/jpeg' // 一旦JPEGとして圧縮
        };

        // 画像を圧縮
        const compressedFile = await imageCompression(file, options);
        console.log(`圧縮前: ${(file.size / 1024 / 1024).toFixed(2)}MB → 圧縮後: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        // 圧縮後の画像をDataURLとして読み込み
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => {
          setSelectedImage(reader.result);
          setShowCropper(true);
          setIsProcessing(false);
        };
      } catch (error) {
        console.error('画像圧縮エラー:', error);
        alert('画像の処理に失敗しました');
        setIsProcessing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  // クロップ完了時の処理
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // クロップした画像を生成
  const createCroppedImage = useCallback(async () => {
    try {
      const croppedImageUrl = await getCroppedImg(selectedImage, croppedAreaPixels);
      onAvatarChange(croppedImageUrl); // 親コンポーネントに通知
      setShowCropper(false);
      setSelectedImage(null);
    } catch (e) {
      console.error('クロップエラー:', e);
    }
  }, [selectedImage, croppedAreaPixels, onAvatarChange]);

  // 画像のクロップ処理
  const getCroppedImg = async (imageSrc, pixelCrop) => {
    if (!pixelCrop) {
      console.error('pixelCrop is null');
      return null;
    }

    const image = new Image();
    image.src = imageSrc;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 正方形にクロップ（512x512）
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    
    // アンチエイリアシングを有効にして高品質な描画
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      size,
      size
    );
    
    // WebP形式で保存（品質80%）
    return canvas.toDataURL('image/webp', 0.8);
  };

  const handleCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
  };

  return (
    <div className="w-full">
      {/* クロッパーモーダル */}
      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">画像を調整</h3>
            
            <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            {/* ズームスライダー */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ズーム
              </label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* ボタン */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={createCroppedImage}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* アップロードエリア */}
      {!showCropper && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} />
          
          {/* 現在のアバターまたはプレビュー */}
          <div className="mb-4">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="現在のアバター"
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          
          {isProcessing ? (
            <div>
              <p className="text-gray-600">画像を処理中...</p>
              <div className="mt-2">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                {isDragActive
                  ? 'ここに画像をドロップ'
                  : 'クリックまたはドラッグ&ドロップで画像を選択'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG, GIF, WebP（30MB以下）
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;