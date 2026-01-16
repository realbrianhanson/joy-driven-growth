import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
        <div className="text-6xl mb-6 animate-sparkle">💛</div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
          Turn Happy Clients Into{" "}
          <span className="text-gradient-sunny">Revenue</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Collect stunning testimonials, showcase them everywhere, and prove the ROI 
          of your client relationships. Built for teams who celebrate success.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            size="lg"
            className="gradient-sunny text-white border-0 shadow-warm hover:shadow-warm-lg transition-all text-lg px-8 h-12"
          >
            <Link to="/dashboard">
              View Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mt-16 flex items-center gap-8 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <span className="font-medium">4.9/5 rating</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="font-medium">$2M+ influenced</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
