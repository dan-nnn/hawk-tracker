import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Link } from "react-router-dom";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to Hawk Tracker!" },
  ];
}

function HomeContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-900">Hawk Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 用户行为监控 按钮 */}
      <div className="container mx-auto px-4 mt-2 mb-8">
        <div className="flex justify-end gap-4">
          <Link to="/behavior-monitor">
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 shadow-md hover:shadow-lg">
              用户行为监控
            </button>
          </Link>
        </div>
      </div>

      <Welcome />
    </div >

  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}