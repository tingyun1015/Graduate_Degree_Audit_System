import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import StudentProgramDetail from "./pages/StudentProgramDetail"
import AdminLogin from "./pages/AdminLogin"
import AdminProgramList from "./pages/AdminProgramList"
import AdminProgramDetail from "./pages/AdminProgramDetail"
import AdminCourseList from "./pages/AdminCourseList"
import { useToastStore } from "./store/useToastStore"
import Toast from "./components/Toast"
import { ProtectedStudentRoute, ProtectedAdminRoute } from "./components/ProtectedRoute"

function App() {
  const { message: toastMessage, type: toastType, hideToast } = useToastStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedStudentRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/program/:id" element={<StudentProgramDetail />} />
        </Route>
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin/program" element={<AdminProgramList />} />
          <Route path="/admin/program/:id" element={<AdminProgramDetail />} />
          <Route path ="/admin/course" element={<AdminCourseList />} />
        </Route>
      </Routes>
      {toastMessage && toastType && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={hideToast} 
        />
      )}
    </Router>
  )
}

export default App
