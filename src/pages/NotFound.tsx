import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Home, Search, ArrowRight, LayoutDashboard, FileText, BarChart3 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/30 flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* Fun Illustration */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl opacity-30">
            <div className="w-48 h-48 mx-auto bg-gradient-to-br from-orange-300 via-amber-300 to-rose-300 rounded-full" />
          </div>
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative"
          >
            <div className="text-8xl mb-4">🔍</div>
            <div className="absolute -top-2 -right-4 text-4xl animate-bounce" style={{ animationDelay: "200ms" }}>
              💛
            </div>
          </motion.div>
        </div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-3">
            We can't find that page
          </h1>
          <p className="text-muted-foreground mb-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-8">
            Path: <code className="px-2 py-1 bg-muted rounded text-xs">{location.pathname}</code>
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="relative max-w-sm mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for something..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl h-12"
            />
          </div>
        </motion.div>

        {/* Popular Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <p className="text-sm text-muted-foreground mb-3">Popular pages</p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-full text-sm transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Home Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            asChild
            size="lg"
            className="gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all"
          >
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Take me home
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>

        {/* Fun footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-sm text-muted-foreground/60"
        >
          Lost? Don't worry, even the best testimonials sometimes need directions 😊
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
