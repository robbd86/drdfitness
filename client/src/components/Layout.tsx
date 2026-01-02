export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight hidden sm:inline">
              DRD<span className="text-primary">Fitness</span>
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
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 overflow-x-hidden">
        {children}
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        <p>DRD Fitness - Train Hard, Track Smart</p>
      </footer>
    </div>
  );
}

