import { Route, BrowserRouter as Router, Routes, Navigate, Outlet } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import AdminLogin from "./pages/AdminLogin"
import AdminProgramList from "./pages/AdminProgramList"
import AdminProgramDetail from "./pages/AdminProgramDetail"
import AdminCourseList from "./pages/AdminCourseList"

// 如果 localStorage 裡面沒有 student_id，就強制跳轉回首頁 ("/")
function ProtectedStudentRoute() {
  const isAuthenticated = !!localStorage.getItem('student_id');
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

// 如果 localStorage 裡面沒有 admin_id，就強制跳轉回首頁 ("/")
function ProtectedAdminRoute() {
  const isAuthenticated = !!localStorage.getItem('admin_id');

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedStudentRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin/program" element={<AdminProgramList />} />
          <Route path="/admin/program/:id" element={<AdminProgramDetail />} />
          <Route path ="/admin/course" element={<AdminCourseList />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
