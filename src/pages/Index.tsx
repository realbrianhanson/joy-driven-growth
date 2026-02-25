import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, DollarSign } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl mx-auto animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-6">
          <span className="text-primary-foreground text-xl font-bold">T</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
          Turn client testimonials into{" "}
          <span className="text-primary">revenue</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Collect, showcase, and measure the impact of your client testimonials. 
          Built for teams that care about social proof.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/dashboard">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mt-14 flex items-center gap-6 text-muted-foreground animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">4.9/5 rating</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-success" />
          <span className="text-sm font-medium">$2M+ influenced</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
