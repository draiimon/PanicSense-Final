import React from "react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 to-pink-50 overflow-hidden">
      {/* Vibrant animated gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-teal-500/10 to-rose-500/15 animate-gradient"
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Enhanced animated patterns */}
      <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1MDUwRjAiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]"></div>

      {/* Additional decorative elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.8)_0%,transparent_70%)]"></div>

      {/* Floating elements with CSS animations */}
      <div
        className="absolute h-72 w-72 rounded-full bg-purple-500/25 filter blur-3xl animate-float-1 will-change-transform"
        style={{ top: "15%", left: "8%" }}
      />

      <div
        className="absolute h-64 w-64 rounded-full bg-teal-500/20 filter blur-3xl animate-float-2 will-change-transform"
        style={{ bottom: "15%", right: "15%" }}
      />

      <div
        className="absolute h-80 w-80 rounded-full bg-blue-500/20 filter blur-3xl animate-float-3 will-change-transform"
        style={{ bottom: "35%", left: "25%" }}
      />

      <div
        className="absolute h-48 w-48 rounded-full bg-rose-500/15 filter blur-3xl animate-float-4 will-change-transform"
        style={{ top: "25%", right: "20%" }}
      />
    </div>
  );
}