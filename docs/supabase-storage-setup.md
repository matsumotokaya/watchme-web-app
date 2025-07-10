# Supabase Storage設定ガイド

## avatarsバケットのRLSポリシー設定

アバター画像（ユーザー・デバイス）のアップロード機能を有効にするには、Supabase管理画面でRLSポリシーを設定する必要があります。

### 手順

1. **Supabase管理画面にログイン**
   - https://app.supabase.com にアクセス
   - プロジェクトを選択

2. **Storageセクションに移動**
   - 左側のメニューから「Storage」をクリック
   - 「avatars」バケットを選択

3. **RLSポリシーの設定**
   - 「Policies」タブをクリック
   - 「New Policy」をクリック

4. **以下のポリシーを追加**

#### ポリシー1: ユーザー自身のアバター読み取り
```sql
-- Policy name: Allow users to view their own avatar
-- Allowed operation: SELECT

(auth.uid())::text = (storage.foldername(name))[1]
```

#### ポリシー2: ユーザー自身のアバターアップロード
```sql
-- Policy name: Allow users to upload their own avatar
-- Allowed operation: INSERT

(auth.uid())::text = (storage.foldername(name))[1]
```

#### ポリシー3: ユーザー自身のアバター更新
```sql
-- Policy name: Allow users to update their own avatar
-- Allowed operation: UPDATE

(auth.uid())::text = (storage.foldername(name))[1]
```

#### ポリシー4: ユーザー自身のアバター削除
```sql
-- Policy name: Allow users to delete their own avatar
-- Allowed operation: DELETE

(auth.uid())::text = (storage.foldername(name))[1]
```

### デバイスアバター用ポリシー（追加設定）

デバイスアバター機能を使用する場合は、以下のポリシーも追加してください：

#### ポリシー5: デバイスアバター読み取り
```sql
-- Policy name: Allow users to view device avatars
-- Allowed operation: SELECT

(storage.foldername(name))[1] = 'devices' AND auth.role() = 'authenticated'
```

#### ポリシー6: デバイスアバターアップロード・更新・削除
```sql
-- Policy name: Allow users to manage device avatars
-- Allowed operations: INSERT, UPDATE, DELETE

(storage.foldername(name))[1] = 'devices' AND auth.role() = 'authenticated'
```

### 代替案：簡易設定（開発用）

開発環境では、以下の簡易ポリシーを使用することもできます：

```sql
-- Policy name: Allow authenticated users full access
-- Allowed operations: ALL (SELECT, INSERT, UPDATE, DELETE)

auth.role() = 'authenticated'
```

**注意**: この設定は開発環境のみで使用し、本番環境では上記の個別ポリシーを使用してください。

### 設定確認

1. ポリシー作成後、「avatars」バケットのポリシー一覧に表示されることを確認
2. アプリケーションでアバターアップロードを再度試行

### ファイル構造

```
avatars/
├── {user_id}/              # ユーザーアバター
│   └── avatar.webp
└── devices/                # デバイスアバター
    └── {device_id}/
        └── avatar.webp
```

### トラブルシューティング

- エラーが続く場合は、Supabase管理画面の「Authentication」→「Policies」でRLSが有効になっているか確認
- バケットの設定で「Public」がOFFになっていることを確認（privateバケットとして運用）
- デバイスアバターのアップロードで403エラーが出る場合は、デバイス用ポリシーが正しく設定されているか確認