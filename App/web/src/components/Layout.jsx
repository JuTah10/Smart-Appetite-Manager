import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import {
  ChefHatIcon,
  LayoutDashboardIcon,
  PackageIcon,
  UtensilsCrossedIcon,
  ShoppingCartIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboardIcon, activeColor: "bg-gray-800 text-white" },
  { to: "/inventory", label: "Inventory", icon: PackageIcon, activeColor: "bg-emerald-600 text-white" },
  { to: "/recipes", label: "Recipes", icon: UtensilsCrossedIcon, activeColor: "bg-orange-500 text-white" },
  { to: "/shopping", label: "Shopping", icon: ShoppingCartIcon, activeColor: "bg-sky-600 text-white" },
];

const FOOTER_LINKS = [
  { label: "Dashboard", to: "/" },
  { label: "Inventory", to: "/inventory" },
  { label: "Recipes", to: "/recipes" },
  { label: "Shopping", to: "/shopping" },
];

export default function Layout() {
  return (
    <div className="inventory-chat-shiftable min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <ChefHatIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">
              Smart Appetite Manager
            </span>
            <span className="font-bold text-lg tracking-tight sm:hidden">
              SAM
            </span>
          </Link>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="flex gap-1">
            {NAV_ITEMS.map(({ to, label, end, icon: Icon, activeColor }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? activeColor
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5 chat-hide-branding">
            <span className="text-xs text-muted-foreground hidden md:inline">Powered by</span>
            <img
              src="/SAM-Logo.png"
              alt="Solace Agent Mesh"
              className="h-5 w-5"
            />
            <span className="text-xs font-medium text-muted-foreground hidden md:inline">
              Solace Agent Mesh
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-b from-slate-50/80 to-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-[1.5fr,1fr,1fr]">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
                  <ChefHatIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-bold text-base tracking-tight">
                  Smart Appetite Manager
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Your AI-powered kitchen companion. Track inventory, discover
                recipes, find deals, and reduce food waste — all in one place.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <img src="/SAM-Logo.png" alt="SAM" className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">
                  Powered by Solace Agent Mesh
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Navigation
              </p>
              <div className="space-y-2">
                {FOOTER_LINKS.map(({ label, to }) => (
                  <Link
                    key={to}
                    to={to}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                About
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Built for the Solace Agent Mesh Hackathon 2026.
                </p>
                <p className="text-sm text-muted-foreground">
                  Multi-agent AI system for smart kitchen management.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Smart Appetite Manager. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Made with care for smarter kitchens
            </p>
          </div>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}
