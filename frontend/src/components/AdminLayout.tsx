import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fff8ef]">
      <Header />
      <div className="flex-1 flex w-full mx-auto">
        <AdminSidebar />
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
