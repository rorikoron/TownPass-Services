// 在瀏覽器 Console 執行這段代碼來插入測試資料
// 複製以下整段程式碼到 Console 執行即可

// 當前用戶 ID（志工）
const currentUserId = '7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250';

// 插入一筆已確認的遛狗活動（status = 'active'）
// 這筆資料會出現在「遛狗清單」中
const insertConfirmedEvent = async () => {
  // 使用頁面中已經存在的 supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('event')
    .insert([
      {
        user_id: 'owner-test-id-001', // 發布者的 ID（雇主）
        user_name: '測試雇主',
        dog_name: 'Lucky',
        dog_breed: '黃金獵犬',
        latitude: 25.0330,
        longitude: 121.5654,
        activity_type: 'walk',
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小時後
        end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3小時後
        status: 'active', // 已確認狀態 - 會出現在遛狗清單
        request_sitter: true,
        preference: '喜歡在公園玩飛盤',
        sitter_id: currentUserId, // 你作為志工接單
        proposer_name: '測試雇主'
      }
    ])
    .select();

  if (error) {
    console.error('❌ 插入資料錯誤:', error);
  } else {
    console.log('✅ 成功插入已確認的活動:', data);
    console.log('請重新整理頁面，資料會出現在「遛狗清單」tab');
  }
};

// 執行插入
insertConfirmedEvent();
