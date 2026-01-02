import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-display">404 Page Not Found</h1>
          </div>
          
          <p className="mt-4 text-muted-foreground">
            The training session you're looking for doesn't exist. Maybe it was a rest day?
          </p>

          <div className="mt-6">
            <Link href="/">
              <Button className="w-full font-bold">Return to Gym</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
