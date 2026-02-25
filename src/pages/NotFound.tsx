import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Home, Search, LayoutDashboard, FileText, BarChart3 } from "lucide-react";
import { useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const popularLinks = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Testimonials", path: "/dashboard/testimonials", icon: FileText },
    { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          <code className="px-2 py-1 bg-muted rounded text-xs">{location.pathname}</code>
        </p>

        <div className="relative max-w-sm mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for something..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <p className="text-xs text-muted-foreground mb-3">Popular pages</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {popularLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm transition-colors duration-150"
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
        </div>

        <Button asChild>
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Take me home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
