import type { Dashboard, LoginResponse } from './types'; // 拿我們剛寫好的規格來用
const BASE_URL = 'http://localhost:8000'; // 後端位置,集中放一個地方好維護

// 登入:把帳號密碼用 POST 送給後端,回傳登入結果
// 注意:這裡「不」像 getDashboard 那樣在失敗時 throw,
// 因為登入失敗(401)時後端仍回 JSON({success:false, message}),
// 我們要把那個 message 顯示給使用者看,所以直接 return 讓呼叫端判斷 success。
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',                                  // 登入用 POST(不是預設的 GET)
    headers: { 'Content-Type': 'application/json' }, // 告訴後端:我送的是 JSON
    body: JSON.stringify({ email, password }),       // 把帳密物件轉成 JSON 文字送出
  });
  return response.json();
}

// 這個函式:給它一個 studentId,回傳那位學生的 Dashboard 資料
export async function getDashboard(studentId: number): Promise<Dashboard> {
  
  // 1. 去打 API。注意這裡用反引號 ` 不是單引號,才能用 ${} 把變數塞進網址
  const response = await
fetch(`${BASE_URL}/api/student/dashboard-all?student_id=${studentId}`);
  
  // 2. 如果後端回錯誤(例如 404 查無此人),主動丟出錯誤,免得後面拿到壞資料
  if (!response.ok) {
    throw new Error('無法取得 dashboard 資料');
  } 
  // 3. 把回傳的 JSON 文字轉成物件,並告訴 TS「它的形狀是 Dashboard」
  return response.json();
}
