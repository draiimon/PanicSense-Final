import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  Clock,
  Layers,
  Database,
  ChartPie,
  Activity,
  HelpCircle,
  Menu,
  User,
  LogOut,
  Globe,
  MapPin,
  Newspaper,
} from "lucide-react";
import logo from "/favicon.png"; // Import the PanicSense logo
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useDeviceCapability } from "@/hooks/use-device-capability";


interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isCapableDevice } = useDeviceCapability();

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <BarChart2 className="w-4 h-4" />,
    },
    {
      path: "/geographic-analysis",
      label: "Geographic Analysis",
      icon: <MapPin className="w-4 h-4" />,
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
      path: "/news-monitoring",
      label: "News Monitoring",
      icon: <Newspaper className="w-4 h-4" />,
    },
    {
      path: "/about",
      label: "About",
      icon: <HelpCircle className="w-4 h-4" />,
    },
  ];

  // Render header based on device capability
  const renderHeader = () => {
    if (isCapableDevice) {
      return (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed w-full top-0 bg-white border-b border-slate-200 shadow-lg z-50"
        >
          {renderHeaderContent()}
        </motion.header>
      );
    } else {
      return (
        <header className="fixed w-full top-0 bg-white border-b border-slate-200 shadow-lg z-50 header-fade-in">
          {renderHeaderContent()}
        </header>
      );
    }
  };

  // Render logo based on device capability
  const renderLogo = () => {
    if (isCapableDevice) {
      return (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-purple-600/30 rounded-xl shadow-lg"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      );
    } else {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-purple-600/30 rounded-xl shadow-lg simple-pulse" />
      );
    }
  };

  // Render title based on device capability
  const renderTitle = () => {
    if (isCapableDevice) {
      return (
        <>
          <motion.h1
            className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            PanicSense PH
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base text-slate-600 font-medium"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            Real-time Disaster Analysis
          </motion.p>
        </>
      );
    } else {
      return (
        <>
          <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
            PanicSense PH
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Real-time Disaster Analysis
          </p>
        </>
      );
    }
  };

  // Render desktop sidebar based on device capability
  const renderDesktopSidebar = () => {
    const headerHeight = 85; // Increased height to prevent overlap

    if (isCapableDevice) {
      return (
        <motion.div
          initial={{ opacity: 0, x: -280 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -280 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ top: "101px", paddingTop: "0.5rem" }}
          className="hidden md:block fixed left-0 h-[calc(100vh-88px)] w-64 bg-white shadow-xl border-r border-slate-200 z-30 overflow-y-auto"
        >
          <nav className="p-4">
            <div className="pt-2">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      location === item.path
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium"
                        : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-lg">{item.icon}</div>
                    <span className="text-sm">{item.label}</span>
                    {location === item.path && (
                      <motion.div
                        layoutId="activeSidebarItem"
                        className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </motion.div>
      );
    } else {
      return (
        <div
          style={{ top: `${headerHeight}px` }}
          className="hidden md:block fixed left-0 h-[calc(100vh-85px)] w-64 bg-slate-900 shadow-xl border-r border-slate-700 z-30 overflow-y-auto sidebar-slide-in"
        >
          {renderSidebarNav()}
        </div>
      );
    }
  };

  // Render mobile menu based on device capability
  const renderMobileMenu = () => {
    if (isCapableDevice) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden absolute top-full left-0 right-0 bg-slate-900 shadow-xl border-t border-slate-700 z-40 max-h-[80vh] overflow-y-auto"
        >
          {renderMobileNav()}
        </motion.div>
      );
    } else {
      return (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl z-40 max-h-[80vh] overflow-y-auto mobile-dropdown-fade-in">
          {renderMobileNav()}
        </div>
      );
    }
  };

  // Common sidebar navigation content
  const renderSidebarNav = () => (
    <nav className="p-4 bg-white">
      <div className="pt-2 border-t border-slate-700">
        <p className="text-xs text-slate-400 uppercase font-semibold mb-4 mt-3 px-3">
          Main Navigation
        </p>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                location === item.path
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              <div className="text-lg">{item.icon}</div>
              <span className="text-sm">{item.label}</span>
              {location === item.path &&
                (isCapableDevice ? (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                ) : (
                  <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full" />
                ))}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );

  // Common mobile navigation content
  const renderMobileNav = () => (
    <nav className="p-4 bg-white">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {menuItems.map((item) => (
          <div key={item.path}>
            <Link
              href={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-all duration-200 text-sm ${
                location === item.path
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          </div>
        ))}
      </div>
    </nav>
  );

  // Header content
  const renderHeaderContent = () => (
    <div className="max-w-[2000px] mx-auto">
      <div className="flex items-center justify-between px-3 py-3 sm:px-8 sm:py-5">
        {/* Left side - Menu (for desktop), Logo and Title */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Menu Button - Now on the left like YouTube */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="relative w-11 h-11 sm:w-14 sm:h-14">
            {renderLogo()}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <img src={logo} alt="PanicSense PH Logo" className="w-7 h-7 sm:w-9 sm:h-9 drop-shadow" />
            </div>
          </div>
          <div>{renderTitle()}</div>
        </div>

        {/* Right side - Profile and Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Profile - More compact on mobile */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden">
              <img src="/images/drei.jpg" alt="Mark Andrei" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-700 hidden sm:inline">
              Mark Andrei
            </span>
          </div>

          {/* Logout Button - Icon only on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-auto rounded-full hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            onClick={() => console.log("Logout clicked")}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Logout</span>
          </Button>
        </div>
      </div>

      {/* YouTube-style Sidebar for Desktop & Dropdown for Mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop for mobile only */}
            <div
              className="md:hidden fixed inset-0 z-20"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* DESKTOP: Left side YouTube-style sidebar */}
            {renderDesktopSidebar()}

            {/* MOBILE: Dropdown menu from top */}
            {renderMobileMenu()}
          </>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="wave-animation"></div>
      </div>

      {/* Header with Navigation */}
      {renderHeader()}

      {/* Container for Sidebar and Main Content */}
      <div className="flex flex-grow relative z-10">
        {/* Empty placeholder for sidebar space when sidebar is open */}
        <div
          className={`hidden md:block flex-shrink-0 w-0 transition-all duration-300 ${isMenuOpen ? "w-64" : "w-0"}`}
        ></div>

        {/* Main Content */}
        <main className="flex-grow pt-[89px] w-full pb-[60px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Removed tutorial guide and tutorial button as requested */}

      {/* Footer */}
      <footer
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 sm:py-4 z-50`}
      >
        <div
          className={`transition-all duration-300 ${isMenuOpen ? "md:pl-64" : ""}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-1 sm:gap-2">
              <img src={logo} alt="PanicSense PH Logo" className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>PanicSense PH © 2025</span>
            </div>
            <div className="mt-1 sm:mt-0">
              Advanced Disaster Sentiment Analysis Platform
            </div>
          </div>
        </div>
      </footer>

      {/* Animation styles - Optimized for all devices */}
      <style>{`
        /* Background wave animation - CSS-based for better performance */
        .wave-animation {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(60deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          animation: wave 8s ease-in-out infinite;
          background-size: 400% 400%;
        }

        .wave-animation::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(60deg, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          animation: wave 8s ease-in-out infinite;
          animation-delay: -4s;
          background-size: 400% 400%;
        }

        @keyframes wave {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Simple CSS pulse animation for logo on low-end devices */
        .simple-pulse {
          animation: simplePulse 0.7s ease-in-out infinite;
        }

        @keyframes simplePulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        /* CSS-based sidebar slide-in for low-end devices */
        .sidebar-slide-in {
          animation: slideFromLeft 0.3s ease-out forwards;
        }

        @keyframes slideFromLeft {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        /* CSS-based dropdown fade-in for mobile menu on low-end devices */
        .mobile-dropdown-fade-in {
          animation: fadeInDown 0.2s ease-out forwards;
        }

        @keyframes fadeInDown {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        /* CSS-based header fade-in for low-end devices */
        .header-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}