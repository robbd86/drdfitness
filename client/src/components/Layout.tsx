import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Dumbbell, Home, TrendingUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { InstallPrompt } from "./InstallPrompt";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  coming?: boolean;
}

const navItems: NavItem[] = [
  { path: "/", label: "Workouts", icon: Home },
  { path: "/progress", label: "Progress", icon: TrendingUp },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="relative min-h-[100dvh] bg-black text-foreground flex flex-col">
      <header className="border-b border-orange-500/20 sticky top-0 z-50 bg-black/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-90 transition-opacity duration-200">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-orange-500/40 transition-all duration-200">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight hidden sm:inline">
              DRD<span className="text-orange-500">Fitness</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) =>
              item.coming ? (
                <span key={item.path} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground opacity-50">
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </span>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === item.path
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-orange-500/5"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            )}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 overflow-x-hidden">
        {children}
      </main>

      <footer className="border-t border-orange-500/20 py-6 text-center text-sm text-muted-foreground">
        <p>DRD Fitness - Train Hard, Track Smart</p>
      </footer>

      <InstallPrompt />
    </div>
  );
}

