import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Home, PlusCircle, Clock, BarChart2, BookOpen, LogOut, Menu, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export const Layout = () => {
  const { user, logout, loading } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-blue-900"><BookOpen size={48} /></div>
      </div>
    );
  }

  if (!user) {
    return <Outlet />;
  }

  const navItems = [
    { name: "Dashboard", path: "/home", icon: <Home size={20} /> },
    { name: "Commit", path: "/commit", icon: <PlusCircle size={20} /> },
    { name: "Check-In", path: "/checkin", icon: <Clock size={20} /> },
    { name: "Progress", path: "/progress", icon: <BarChart2 size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 md:w-72 bg-blue-900 text-white shadow-xl z-20 flex-shrink-0">
        <div className="p-6 flex items-center gap-3 font-bold text-2xl tracking-tight border-b border-blue-800">
          <div className="bg-orange-500 text-white p-2 rounded-xl shadow-inner">
            <BookOpen size={24} />
          </div>
          StudySync
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4 px-4">Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-800 text-orange-400 font-semibold shadow-inner" 
                    : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
                }`}
              >
                <div className={`${isActive ? "text-orange-400" : "text-blue-300 group-hover:text-white"}`}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800 bg-blue-900/50">
          <div className="flex items-center gap-3 px-4 py-3 text-blue-100 bg-blue-800/30 rounded-xl mb-2">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold shadow-sm">
              {user.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user}</p>
              <p className="text-xs text-blue-300">Student</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-300 hover:text-white hover:bg-blue-800 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden bg-blue-900 text-white h-16 flex items-center justify-between px-4 z-30 shadow-md flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="text-orange-500" size={20} /> StudySync
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 text-blue-200 hover:text-white transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-blue-900 text-white z-20 shadow-xl border-t border-blue-800 flex flex-col animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-4 border-b border-blue-800/50 ${
                    isActive ? "text-orange-400 bg-blue-800 font-semibold" : "text-blue-200 hover:bg-blue-800/30"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-4 text-blue-200 hover:bg-blue-800/30 w-full text-left"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        )}

        {/* Page Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
