import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface WarmSkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export const WarmSkeleton = ({ className, style }: WarmSkeletonProps) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-100/50 via-amber-100/50 to-orange-100/50 bg-[length:200%_100%] animate-shimmer",
        className
      )} 
      style={style}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
      <div className="flex items-center gap-3">
        <WarmSkeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <WarmSkeleton className="h-4 w-24" />
          <WarmSkeleton className="h-3 w-32" />
        </div>
      </div>
      <WarmSkeleton className="h-4 w-full" />
      <WarmSkeleton className="h-4 w-3/4" />
      <WarmSkeleton className="h-4 w-1/2" />
    </div>
  );
};

export const SkeletonStat = () => {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
      <WarmSkeleton className="h-4 w-20" />
      <WarmSkeleton className="h-8 w-32" />
      <WarmSkeleton className="h-3 w-24" />
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <WarmSkeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border last:border-0 flex items-center gap-4">
          <WarmSkeleton className="w-8 h-8 rounded-full" />
          <WarmSkeleton className="h-4 flex-1 max-w-xs" />
          <WarmSkeleton className="h-4 w-20" />
          <WarmSkeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart = () => {
  const heights = [60, 45, 75, 50, 80, 65, 40, 85, 55, 70, 45, 60];
  
  return (
    <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <WarmSkeleton className="h-5 w-32" />
        <WarmSkeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="h-64 flex items-end gap-2 pt-4">
        {heights.map((height, i) => (
          <WarmSkeleton 
            key={i} 
            className="flex-1 rounded-t-lg"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
};
