import React, { useState } from 'react';
import logoImg from '../assets/logo.svg';
import Tag from '../components/Tag';
import Button from '../components/Button';

export default function Login() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual login logic
    console.log("Login with", account, password);
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