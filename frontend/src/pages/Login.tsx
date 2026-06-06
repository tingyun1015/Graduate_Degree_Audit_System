import React, { useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Tag from '../components/Tag';
import Button from '../components/Button';
import { loginUser } from '../api';
import { LoginState } from '../types';

const initialState: LoginState = {
  success: false,
  message: "",
  account: "",
  password: "",
};

export default function Login() {
  const navigate = useNavigate();

  async function login(previousState: LoginState, formData: FormData): Promise<LoginState> {
    const account = formData.get("account") as string;
    const password = formData.get("password") as string;

    if (!account || !password) {
      return { success: false, message: "請填寫所有欄位", account, password };
    }

    try {
      const result = await loginUser(account, password);

      if (result.success) {
        localStorage.setItem('student_id', String(result.id));
        localStorage.setItem('user_name', result.name || "");
        navigate("/dashboard");
        return { success: true, message: "登入成功", account, password };
      }
      return { success: false, message: result.message || "登入失敗", account, password };
    } catch (error) {
      return { success: false, message: "無法連線到伺服器，請稍後再試", account, password };
    }
  }

  const [formState, loginAction] = useActionState(login, initialState);

  return (
    <div className="min-h-screen bg-[#fff8ef] flex flex-col items-center justify-center font-sans p-4">
      <div className="bg-white border border-[#ccc] shadow-[3px_4px_3px_rgba(0,0,0,0.06)] rounded-[4px] w-full max-w-[494px] px-[40px] py-[55px] flex flex-col items-center">
        <div className="flex flex-col items-center gap-[9px] mb-[30px]">
          <Tag content="Student" color="#ffb6b0" />
          <Logo />
        </div>

        <form className="w-full flex flex-col gap-[18px]" action={loginAction}>
          <div className="flex flex-col">
            <label className="text-[11.1px] text-black mb-[4.6px]">Account</label>
            <input
              type="text"
              name="account"
              defaultValue={formState.account}
              className="w-full h-[35px] border border-[#ccc] rounded-[4px] px-3 text-sm focus:outline-none focus:border-[#2854c5] focus:ring-1 focus:ring-[#2854c5] transition-colors"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("請填寫帳號")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11.1px] text-black mb-[4.6px]">Password</label>
            <input
              type="password"
              name="password"
              defaultValue={formState.password}
              className="w-full h-[35px] border border-[#ccc] rounded-[4px] px-3 text-sm focus:outline-none focus:border-[#2854c5] focus:ring-1 focus:ring-[#2854c5] transition-colors"
              required
              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("請輸入密碼")}
              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
            />
          </div>
          <p className="text-[12px] text-red-600 text-center min-h-[18px]">
            {!formState.success && formState.message ? formState.message : ""}
          </p>
          <div className="flex flex-col gap-2">
            <Button content="Login" color="#2854c5" hasArrow={true} type="submit" />
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
