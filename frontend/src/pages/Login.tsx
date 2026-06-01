import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.svg';
import Tag from '../components/Tag';
import Button from '../components/Button';
import { loginUser } from '../api';

export default function Login() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');     // 登入失敗時要顯示的訊息
  const navigate = useNavigate();              // react-router 提供的「跳轉頁面」工具

  // async:因為裡面要 await 等後端回應
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();   // 擋掉瀏覽器預設的「送出表單會重新整理頁面」
    setError('');         // 每次重新嘗試先清空舊的錯誤訊息

    try {
      const result = await loginUser(account, password);

      if (result.success) {
        // 登入成功:把使用者資訊存進瀏覽器的 localStorage,Dashboard 之後讀取
        localStorage.setItem('student_id', String(result.id));
        localStorage.setItem('user_name', result.name);
        navigate('/dashboard');   // 跳轉到 dashboard 頁
      } else {
        setError(result.message); // 失敗:顯示後端給的訊息(例如「帳號或密碼錯誤」)
      }
    } catch {
      // 連不上後端(沒開、網路問題等)時的保底訊息
      setError('無法連線到伺服器,請稍後再試');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8ef] flex flex-col items-center justify-center font-sans p-4">
      <div className="bg-white border border-[#ccc] shadow-[3px_4px_3px_rgba(0,0,0,0.06)] rounded-[4px] w-full max-w-[494px] px-[40px] py-[55px] flex flex-col items-center">

        {/* Header / Logo Area */}
        <div className="flex flex-col items-center gap-[9px] mb-[30px]">
          <Tag content="Student" color="#ffb6b0" />
          <img src={logoImg} alt="Degree Audit Logo" />
        </div>

        {/* Form Area */}
        <form className="w-full flex flex-col gap-[18px]" onSubmit={handleLogin}>
          <div className="flex flex-col">
            <label className="text-[11.1px] text-black mb-[4.6px]">Account</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full h-[35px] border border-[#ccc] rounded-[4px] px-3 text-sm focus:outline-none focus:border-[#2854c5] focus:ring-1 focus:ring-[#2854c5] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11.1px] text-black mb-[4.6px]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[35px] border border-[#ccc] rounded-[4px] px-3 text-sm focus:outline-none focus:border-[#2854c5] focus:ring-1 focus:ring-[#2854c5] transition-colors"
              required
            />
          </div>

          {/* 錯誤訊息:只有當 error 有內容時才顯示 */}
          {error && (
            <p className="text-[12px] text-red-600 text-center">{error}</p>
          )}

          <div className="mt-[25px] flex flex-col gap-2">
            <Button content="Login" color="#2854c5" hasArrow={true} />
            <div className="flex justify-end">
              <a href="#" className="text-[11.4px] text-black underline decoration-solid hover:text-gray-600 transition-colors">
                Forgot password?
              </a>
            </div>
          </div>
        </form>

        {/* Footer Area */}
        <div className="mt-[60px]">
          <p className="text-[10.5px] text-black text-center">
            v0.1 · NCCU DBMS Group 8
          </p>
        </div>

      </div>
    </div>
  );
}
