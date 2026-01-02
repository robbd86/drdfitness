import { ReactNode } from "react";
import { Dumbbell, Home, BarChart2, UtensilsCrossed, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Workouts", icon: Home },
  { path: "/progress", label: "Progress", icon: BarChart2, coming: true },
  { path: "/meals", label: "Meals", icon: UtensilsCrossed, coming: true },
  { path: "/profile", label: "Profile", icon: User, coming: true },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight hidden sm:inline">
              DRD<span className="text-primary">Fitness</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => 
              item.coming ? (
                <span
                  key={item.path}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="text-[10px] hidden lg:inline">(Soon)</span>
                </span>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        <p>DRD Fitness - Train Hard, Track Smart</p>
      </footer>
    </div>
  );
}
