import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function StudentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fff8ef]">
      <Header />
      <main className="flex-1 w-full mx-auto px-20 py-8 flex flex-col gap-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
