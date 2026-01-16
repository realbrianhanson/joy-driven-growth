import { useEffect, useState } from "react";

interface WelcomeHeaderProps {
  name: string;
  weeklyRevenue?: number;
  hasTestimonials?: boolean;
  isNewUser?: boolean;
}

export function WelcomeHeader({ 
  name, 
  weeklyRevenue = 0, 
  hasTestimonials = true,
  isNewUser = false 
}: WelcomeHeaderProps) {
  const [greeting, setGreeting] = useState("Good morning");
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getSubtitle = () => {
    if (isNewUser || !hasTestimonials) {
      return "Let's collect your first testimonial! 🚀";
    }
    if (weeklyRevenue > 0) {
      return `Your testimonials made ${formatCurrency(weeklyRevenue)} this week! 🎉`;
    }
    return "Your clients are saying great things ✨";
  };

  return (
    <div className="mb-8 animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        {greeting}, {name}! 👋
      </h1>
      <p className="text-lg text-muted-foreground">
        {getSubtitle()}
      </p>
    </div>
  );
}
