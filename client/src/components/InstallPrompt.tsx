import { useState, useEffect } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detect iOS Safari
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = isIOS();
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Check if already installed (standalone mode)
    if (isInStandaloneMode()) {
      return;
    }

    // iOS Safari doesn't support beforeinstallprompt, show manual instructions
    if (isIOSSafari()) {
      setShowIOSInstructions(true);
      setIsVisible(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't render if not visible, dismissed, or neither prompt available nor iOS
  if (!isVisible || isDismissed) {
    return null;
  }

  if (!deferredPrompt && !showIOSInstructions) {
    return null;
  }

  // iOS Safari instructions
  if (showIOSInstructions) {
    return (
      <div 
        className="fixed bottom-20 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:max-w-sm"
        data-testid="install-prompt-ios"
      >
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
              <Download className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Install DRD Fitness</p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-muted-foreground -mr-2 -mt-1"
                  data-testid="button-dismiss-install"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Add to your home screen for the full app experience
              </p>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                    <Share className="h-3 w-3" />
                  </div>
                  <span>Tap the <strong className="text-foreground">Share</strong> button in Safari</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                    <Plus className="h-3 w-3" />
                  </div>
                  <span>Select <strong className="text-foreground">Add to Home Screen</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome install prompt
  return (
    <div 
      className="fixed bottom-20 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:max-w-sm"
      data-testid="install-prompt"
    >
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
          <Download className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Install DRD Fitness</p>
          <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-muted-foreground"
            data-testid="button-dismiss-install"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            data-testid="button-install-app"
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
