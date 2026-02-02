import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#f8fafc" }}>
      <Card className="w-full max-w-md" style={{
        background: "#ffffff",
        borderColor: "rgba(97, 150, 254, 0.3)",
        boxShadow: "none"
      }}>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2" style={{ color: "#6196FE" }}>
            404
          </CardTitle>
          <CardDescription className="text-xl" style={{ color: 'rgba(48, 27, 137, 0.8)' }}>
            Oops! Page not found
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#6196FE',
              borderColor: '#A9B5FF',
              color: 'white'
            }}
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
