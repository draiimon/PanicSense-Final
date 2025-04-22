animation: {
    "accordion-down": "accordion-down 0.2s ease-out",
    "accordion-up": "accordion-up 0.2s ease-out",
    "ripple-slow": "ripple 3s linear infinite",
  },
  keyframes: {
    ripple: {
      "0%": { transform: "scale(0.5)", opacity: "0.8" },
      "100%": { transform: "scale(3)", opacity: "0" },
    },
  },
  utilities: {
    '.animation-delay-1000': {
      'animation-delay': '1000ms',
    },
    '.animation-delay-2000': {
      'animation-delay': '2000ms',
    },
  },