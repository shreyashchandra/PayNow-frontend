/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#F3EFE6", raised: "#FBF9F4", sunk: "#EAE5D9" },
        ink: { DEFAULT: "#1A1A17", soft: "#46453F", muted: "#7A776D", faint: "#A6A296" },
        rule: { DEFAULT: "#DCD6C8", strong: "#C4BCA9" },
        ledger: { DEFAULT: "#1E4D3A", deep: "#153827", soft: "#E1EAE2" },
        debit: { DEFAULT: "#A23B21", soft: "#F5E3DC" },
        amber: { DEFAULT: "#8A5A00", soft: "#F6ECD4" },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      borderRadius: { DEFAULT: "4px", md: "6px" },
      keyframes: {
        "slide-up": { from: { transform: "translateY(8px)", opacity: 0 }, to: { transform: "none", opacity: 1 } },
        tick: { "0%, 100%": { opacity: 0.25 }, "50%": { opacity: 1 } },
      },
      animation: {
        "slide-up": "slide-up 180ms ease-out",
        tick: "tick 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
