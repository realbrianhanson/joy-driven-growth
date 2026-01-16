import { useCallback } from "react";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";

// Warm celebration colors matching our design system
const WARM_COLORS = ["#F97316", "#F59E0B", "#FBBF24", "#FB7185", "#10B981"];

export const useCelebration = () => {
  const fireConfetti = useCallback((options?: confetti.Options) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: WARM_COLORS,
      ...options,
    });
  }, []);

  const fireSuccess = useCallback(() => {
    // Quick burst for general success
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: WARM_COLORS,
      startVelocity: 30,
    });
  }, []);

  const fireMilestone = useCallback(() => {
    // Big celebration for milestones
    const end = Date.now() + 2000;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: WARM_COLORS,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: WARM_COLORS,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const fireRevenue = useCallback((amount: number) => {
    // Gold-focused for revenue events
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 },
      colors: ["#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"],
      startVelocity: 35,
    });

    toast({
      title: "💰 New Revenue!",
      description: `+$${amount.toLocaleString()} attributed to testimonials`,
      className: "border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100",
    });
  }, []);

  const celebrateTestimonial = useCallback(() => {
    fireSuccess();
    toast({
      title: "🎉 Testimonial Approved!",
      description: "Your testimonial is now ready to shine",
    });
  }, [fireSuccess]);

  const celebrateForm = useCallback(() => {
    fireSuccess();
    toast({
      title: "🚀 Form Published!",
      description: "Start collecting testimonials now",
    });
  }, [fireSuccess]);

  const celebrateWidget = useCallback(() => {
    fireSuccess();
    toast({
      title: "✨ Widget is Live!",
      description: "Your social proof is now displayed",
    });
  }, [fireSuccess]);

  const celebrateCampaign = useCallback(() => {
    fireSuccess();
    toast({
      title: "📱 Campaign Sent!",
      description: "Messages are on their way",
    });
  }, [fireSuccess]);

  const celebrateMilestone = useCallback((milestone: string) => {
    fireMilestone();
    toast({
      title: "🎉 Milestone Reached!",
      description: milestone,
      className: "border-primary bg-gradient-to-r from-orange-50 to-amber-50",
    });
  }, [fireMilestone]);

  return {
    fireConfetti,
    fireSuccess,
    fireMilestone,
    fireRevenue,
    celebrateTestimonial,
    celebrateForm,
    celebrateWidget,
    celebrateCampaign,
    celebrateMilestone,
  };
};

// Micro-celebration toasts
export const microToast = {
  copied: () => toast({
    title: "📋 Copied!",
    description: "Ready to paste",
    duration: 2000,
  }),
  saved: () => toast({
    title: "💾 Saved!",
    description: "Changes saved successfully",
    duration: 2000,
  }),
  deleted: () => toast({
    title: "🗑️ Deleted",
    description: "Item removed",
    duration: 2000,
  }),
  error: (message: string) => toast({
    title: "😅 Oops!",
    description: message,
    variant: "destructive",
  }),
  info: (message: string) => toast({
    title: "💡 Tip",
    description: message,
    duration: 4000,
  }),
};
