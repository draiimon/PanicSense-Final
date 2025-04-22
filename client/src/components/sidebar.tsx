import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  Clock,
  LineChart,
  Database,
  FileText,
  Activity,
  Info,
  Menu,
  X,
  User,
  LogOut,
  Globe,
  MapPin,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: JSX.Element;
}

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      href: "/emotion-analysis",
      label: "Geographic Analysis",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      href: "/timeline",
      label: "Timeline",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      href: "/comparison",
      label: "Comparison",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      href: "/raw-data",
      label: "Raw Data",
      icon: <Database className="h-5 w-5" />,
    },
    {
      href: "/evaluation",
      label: "Evaluation",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      href: "/real-time",
      label: "Real-Time",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      href: "/about",
      label: "About",
      icon: <Info className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Menu Button - Always visible on mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Profile Section */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Andrei Castillo</h1>
              <p className="text-xs text-slate-400">@Rae</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 pb-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                    location === item.href
                      ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/10",
                  )}
                  onClick={() => {
                    if (location !== item.href) {
                      window.location.href = item.href;
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {location === item.href && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Logout Button Only - Removed Tutorial Button */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          {/* Logout Button */}
          <button
            onClick={() => console.log("Logout clicked")}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu Content */}
          <div className="lg:hidden fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900 to-slate-800 z-50 shadow-xl">
            {/* Profile Section */}
            <div className="p-6 mt-16">
              {" "}
              {/* Added margin-top to account for the fixed button */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">John Doe</h1>
                  <p className="text-xs text-slate-400">Disaster Analyst</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="px-4">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <div key={item.href} className="relative">
                    <div
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                        location === item.href
                          ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/10",
                      )}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (location !== item.href) {
                          window.location.href = item.href;
                        }
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            {/* Mobile Logout Button Only */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 space-y-2">
              {/* Logout Button */}
              <button
                onClick={() => console.log("Logout clicked")}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
