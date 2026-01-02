import { ReactNode } from "react";
import { Dumbbell } from "lucide-react";
import { Link } from "wouter";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">
              DRD<span className="text-primary">Fitness</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} DRD Fitness. Train Hard.</p>
      </footer>
    </div>
  );
}
