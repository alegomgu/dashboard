import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f5f7fb",
        ink: "#111827",
        panel: "#ffffff",
        panelSoft: "#f8fafc",
        line: "#dde5ef",
        accent: "#2563eb",
        accentSoft: "#dbeafe",
        sidebar: "#0f172a",
        sidebarMuted: "#94a3b8",
        info: "#4f46e5",
        positive: "#047857",
        warning: "#c2410c",
        danger: "#be123c",
        muted: "#64748b",
      },
      boxShadow: {
        panel:
          "0 1px 2px rgba(15, 23, 42, 0.05), 0 18px 44px rgba(15, 23, 42, 0.07)",
        sidebar: "14px 0 42px rgba(15, 23, 42, 0.18)",
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
