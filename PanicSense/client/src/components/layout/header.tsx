import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import {
  BarChart2,
  Clock,
  Layers,
  Database,
  ChartPie,
  Activity,
  HelpCircle,
  Globe,
  Search,
  Bell,
  User,
} from "lucide-react";
import logo from "/favicon.png"; // Import the PanicSense logo

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.assign("/login");
  };

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <BarChart2 className="w-4 h-4" />,
    },
    {
      path: "/emotion-analysis",
      label: "Geographic Analysis",
      icon: <Globe className="w-4 h-4" />,
    },
    {
      path: "/timeline",
      label: "Timeline",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      path: "/comparison",
      label: "Comparison",
      icon: <Layers className="w-4 h-4" />,
    },
    {
      path: "/raw-data",
      label: "Raw Data",
      icon: <Database className="w-4 h-4" />,
    },
    {
      path: "/evaluation",
      label: "Evaluation",
      icon: <ChartPie className="w-4 h-4" />,
    },
    {
      path: "/real-time",
      label: "Real-time",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      path: "/about",
      label: "About",
      icon: <HelpCircle className="w-4 h-4" />,
    },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700/50 py-3 px-4 shadow-lg z-50"
    >
      <div className="max-w-[2000px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12">
              <motion.div
                className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-purple-600/30"
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <img src={logo} alt="PanicSense PH Logo" className="w-8 h-8 object-cover drop-shadow" />
              </div>
            </div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"
              >
                PanicSense PH
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-400"
              >
                Real-time Sentiment Analysis
              </motion.p>
            </div>
          </div>

          {/* Navigation Menu */}
          {user && (
            <div className="relative flex items-center space-x-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    variant={location === item.path ? "default" : "ghost"}
                    className={`
                      flex items-center space-x-2 whitespace-nowrap transition-all duration-200
                      ${location === item.path ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-slate-800'}
                    `}
                    onClick={() => location !== item.path && window.location.assign(item.path)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Quick Actions */}
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Bell className="h-5 w-5" />
                  </Button>
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-slate-200">Mark Andrei</p>
                    <p className="text-xs text-slate-400">Administrator</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Logout Button */}
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="border border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => window.location.assign("/login")}
                  className="border border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => window.location.assign("/signup")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.header>
  );
}