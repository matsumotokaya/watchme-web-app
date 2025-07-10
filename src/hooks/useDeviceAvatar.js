import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useDeviceAvatar = (deviceId) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 署名付きURLを取得
  const getSignedUrl = async () => {
    if (!deviceId) return null;

    try {
      const path = `devices/${deviceId}/avatar.webp`;
      
      // まず画像が存在するか確認
      const { data: fileData, error: listError } = await supabase.storage
        .from('avatars')
        .list(`devices/${deviceId}`, {
          limit: 1,
          search: 'avatar.webp'
        });

      if (listError) {
        console.error('リスト取得エラー:', listError);
        return null;
      }

      // ファイルが存在しない場合
      if (!fileData || fileData.length === 0) {
        return null;
      }

      // 署名付きURLを生成（1時間有効）
      const { data, error: urlError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);

      if (urlError) {
        console.error('署名付きURL生成エラー:', urlError);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error('デバイスアバターURL取得エラー:', err);
      return null;
    }
  };

  // 画像をアップロード
  const uploadAvatar = async (base64Data) => {
    if (!user?.id) {
      throw new Error('ユーザーがログインしていません');
    }

    if (!deviceId) {
      throw new Error('デバイスIDが指定されていません');
    }

    setLoading(true);
    setError(null);

    try {
      // base64をBlobに変換
      const base64Response = await fetch(base64Data);
      const blob = await base64Response.blob();
      
      // WebP形式のFileオブジェクトを作成
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' });
      
      const path = `devices/${deviceId}/avatar.webp`;

      // Supabase Storageにアップロード（既存ファイルは上書き）
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) {
        throw uploadError;
      }

      // アップロード後、新しい署名付きURLを取得
      const newUrl = await getSignedUrl();
      setAvatarUrl(newUrl);
      
      return newUrl;
    } catch (err) {
      console.error('デバイスアバターアップロードエラー:', err);
      
      // エラーメッセージをよりユーザーフレンドリーに
      let errorMessage = 'アップロードに失敗しました。';
      
      if (err.message?.includes('row-level security policy') || err.statusCode === '403') {
        errorMessage = 'デバイスアバターのアップロード権限がありません。管理者にお問い合わせください。';
      } else if (err.message?.includes('network')) {
        errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
      } else if (err.message?.includes('size')) {
        errorMessage = 'ファイルサイズが大きすぎます。';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み時とデバイスID変更時にアバターURLを取得
  useEffect(() => {
    const fetchAvatar = async () => {
      if (deviceId) {
        setLoading(true);
        const url = await getSignedUrl();
        setAvatarUrl(url);
        setLoading(false);
      } else {
        setAvatarUrl(null);
      }
    };

    fetchAvatar();
  }, [deviceId]);

  return {
    avatarUrl,
    uploadAvatar,
    loading,
    error,
    refreshAvatar: async () => {
      const url = await getSignedUrl();
      setAvatarUrl(url);
      return url;
    }
  };
};