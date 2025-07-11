-- デバイステーブルに観測対象者の詳細情報フィールドを追加
-- Migration: 001_add_device_profile_fields
-- Date: 2025-07-11

-- デバイステーブルに新しいカラムを追加
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0 AND age <= 150),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS relationship VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- updated_atを自動更新するトリガーを作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーをdevicesテーブルに適用
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_devices_owner_user_id ON devices(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- コメントを追加
COMMENT ON COLUMN devices.nickname IS '観測対象者のニックネーム';
COMMENT ON COLUMN devices.age IS '観測対象者の年齢';
COMMENT ON COLUMN devices.gender IS '観測対象者の性別（male, female, other, prefer_not_to_say）';
COMMENT ON COLUMN devices.relationship IS '観測者との関係（例：家族、友人、患者など）';
COMMENT ON COLUMN devices.notes IS '観測対象者に関するメモ';