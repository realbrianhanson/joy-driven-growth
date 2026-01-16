import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  emoji?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ 
  icon, 
  emoji,
  title, 
  description, 
  action,
  secondaryAction
}: EmptyStateProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      {/* Decorative Background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl opacity-50">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-200 via-amber-200 to-rose-200 rounded-full" />
        </div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center border border-orange-200/50 shadow-warm">
          {emoji ? (
            <span className="text-4xl animate-bounce">{emoji}</span>
          ) : (
            icon
          )}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Button 
          onClick={action.onClick}
          className="gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all"
        >
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}

      {secondaryAction && (
        <button 
          onClick={secondaryAction.onClick}
          className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {secondaryAction.label}
        </button>
      )}
    </motion.div>
  );
};

// Pre-configured empty states for common use cases
export const NoTestimonialsEmpty = ({ onAdd }: { onAdd: () => void }) => (
  <EmptyState
    emoji="💛"
    title="No testimonials yet"
    description="Your first happy client awaits! Start collecting testimonials to showcase your success."
    action={{
      label: "Collect Testimonials",
      onClick: onAdd,
    }}
  />
);

export const NoRevenueEmpty = ({ onConnect }: { onConnect: () => void }) => (
  <EmptyState
    emoji="💰"
    title="No revenue data yet"
    description="Connect Stripe to see the magic! Track how your testimonials drive sales."
    action={{
      label: "Connect Stripe",
      onClick: onConnect,
    }}
  />
);

export const NoWidgetsEmpty = ({ onCreate }: { onCreate: () => void }) => (
  <EmptyState
    emoji="🔔"
    title="No widgets yet"
    description="Let's show off your reviews! Create beautiful widgets to display on your site."
    action={{
      label: "Create Widget",
      onClick: onCreate,
    }}
  />
);

export const NoCampaignsEmpty = ({ onCreate }: { onCreate: () => void }) => (
  <EmptyState
    emoji="📱"
    title="No campaigns yet"
    description="Reach out to your happy clients! SMS campaigns have 68% completion rates."
    action={{
      label: "Create Campaign",
      onClick: onCreate,
    }}
  />
);

export const NoFormsEmpty = ({ onCreate }: { onCreate: () => void }) => (
  <EmptyState
    emoji="📝"
    title="No forms yet"
    description="Create your first testimonial collection form to start gathering social proof."
    action={{
      label: "Create Form",
      onClick: onCreate,
    }}
  />
);

export const NoContentEmpty = ({ onSelect }: { onSelect: () => void }) => (
  <EmptyState
    emoji="✨"
    title="Pick a testimonial and content type!"
    description="Select testimonials from the left and choose a content type to create marketing magic."
    action={{
      label: "Browse Testimonials",
      onClick: onSelect,
    }}
  />
);

export const SearchEmptyState = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <EmptyState
    emoji="🔍"
    title={`No results for "${query}"`}
    description="Try a different search term or clear your filters."
    action={{
      label: "Clear Search",
      onClick: onClear,
    }}
  />
);
