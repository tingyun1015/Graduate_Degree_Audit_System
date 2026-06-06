import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DepartmentInfo } from '../types';

interface AuthState {
  // Common state
  isLoggedIn: boolean;
  role: 'student' | 'admin' | null;
  userName: string | null;
  
  // Role specific state
  userId: number | null; // Represents either student_id or admin_id depending on role
  departmentList: DepartmentInfo[]; // Only for admin
  
  // Actions
  loginAdmin: (adminId: number, userName: string, departmentList: DepartmentInfo[]) => void;
  loginStudent: (studentId: number, userName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      role: null,
      userName: null,
      userId: null,
      departmentList: [],

      loginAdmin: (adminId, userName, departmentList) => 
        set({ 
          isLoggedIn: true, 
          role: 'admin', 
          userId: adminId, 
          userName, 
          departmentList
        }),

      loginStudent: (studentId, userName) => 
        set({ 
          isLoggedIn: true, 
          role: 'student', 
          userId: studentId, 
          userName, 
          departmentList: []
        }),

      logout: () => 
        set({ 
          isLoggedIn: false, 
          role: null, 
          userId: null, 
          userName: null, 
          departmentList: []
        }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // default is localStorage
    }
  )
);
