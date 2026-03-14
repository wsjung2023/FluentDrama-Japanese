// Tailwind theme tokens for the FluentDrama Japanese dark-luxury visual system.
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },

        scene: {
          bg: 'hsl(222, 20%, 7%)',
          surface: 'hsl(222, 15%, 12%)',
          border: 'hsl(222, 12%, 20%)',
          'border-hover': 'hsl(38, 60%, 50%)',
        },
        gold: {
          DEFAULT: 'hsl(38, 70%, 55%)',
          dim: 'hsl(38, 50%, 40%)',
          bright: 'hsl(42, 90%, 65%)',
        },
        ivory: {
          DEFAULT: 'hsl(50, 30%, 90%)',
          muted: 'hsl(50, 15%, 65%)',
          subtle: 'hsl(50, 10%, 45%)',
        },
        feedback: {
          natural: 'hsl(152, 60%, 45%)',
          clear: 'hsl(207, 70%, 55%)',
          awkward: 'hsl(38, 80%, 55%)',
          retry: 'hsl(280, 60%, 60%)',
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      backgroundImage: {
        'scene-hero': 'linear-gradient(135deg, hsl(222, 20%, 7%) 0%, hsl(240, 15%, 10%) 100%)',
        'gold-glow': 'radial-gradient(ellipse at center, hsl(38, 70%, 55%, 0.15) 0%, transparent 70%)',
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
