-- ⭐ 快速插入已確認的遛狗活動（可以開始和結束）
-- 在 Supabase Dashboard 的 SQL Editor 執行這段 SQL

INSERT INTO event (
  user_id,
  user_name,
  dog_name,
  dog_breed,
  latitude,
  longitude,
  activity_type,
  start_time,
  end_time,
  status,
  request_sitter,
  preference,
  sitter_id,
  proposer_name
) VALUES (
  'demo-owner-001',  -- 雇主 ID
  'Demo 雇主',
  'Lucky',
  '黃金獵犬',
  25.0330,
  121.5654,
  'walk',
  NOW() + INTERVAL '1 hours',  -- 1小時後開始
  NOW() + INTERVAL '2 hours',  -- 2小時後結束
  'active',  -- ✅ 已確認狀態 → 會出現在遛狗清單，可以點「開始遛狗」
  true,
  '喜歡玩飛盤',
  '7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250',  -- 你的志工 ID（固定）
  'Demo 雇主'
);

-- 如果想插入多筆測試資料，可以再執行以下 SQL：

INSERT INTO event (
  user_id,
  user_name,
  dog_name,
  dog_breed,
  latitude,
  longitude,
  activity_type,
  start_time,
  end_time,
  status,
  request_sitter,
  preference,
  sitter_id,
  proposer_name
) VALUES 
(
  'owner-test-id-002',
  '李小華',
  'Momo',
  '柴犬',
  25.0340,
  121.5664,
  'walk',
  NOW() + INTERVAL '1 hours',
  NOW() + INTERVAL '2 hours',
  'active',  -- 已確認
  true,
  '喜歡慢慢走',
  '7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250',
  '李小華'
),
(
  'owner-test-id-003',
  '張大明',
  'Cookie',
  '貴賓犬',
  25.0350,
  121.5674,
  'walk',
  NOW() + INTERVAL '4 hours',
  NOW() + INTERVAL '5 hours',
  'active',  -- 已確認
  true,
  '怕打雷',
  '7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250',
  '張大明'
);
