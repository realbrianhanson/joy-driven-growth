import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface WallTestimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  author_company: string | null;
  author_avatar: string | null;
  display_preference: "full" | "first_initial" | "anonymous" | null;
  content: string | null;
  rating: number | null;
  type: "text" | "video" | "audio";
  video_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface WallData {
  id: string;
  name: string;
  slug: string;
  header_title: string | null;
  header_subtitle: string | null;
  logo_url: string | null;
  layout: string | null;
  columns: number | null;
  background_color: string | null;
  accent_color: string | null;
  testimonials: WallTestimonial[];
}

export default function PublicWall() {
  const { slug } = useParams<{ slug: string }>();

  const { data: wall, isLoading, error } = useQuery({
    queryKey: ["public-wall", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_wall_public", { p_slug: slug! });
      if (error) throw error;
      return data as unknown as WallData | null;
    },
  });

  useEffect(() => {
    if (wall && slug) {
      supabase.rpc("increment_wall_views", { p_slug: slug }).then(() => {});
    }
  }, [wall, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-1/3 mx-auto" />
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !wall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Wall not found</h1>
          <p className="text-sm text-muted-foreground">This wall doesn't exist or has been unpublished.</p>
        </div>
      </div>
    );
  }

  const bg = wall.background_color ?? "#FFFBF7";
  const accent = wall.accent_color ?? "#F97316";
  const cols = Math.max(1, Math.min(5, wall.columns ?? 3));

  const colClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        {wall.logo_url && (
          <img src={wall.logo_url} alt="" className="h-10 mx-auto mb-6" />
        )}
        <h1 className="text-3xl md:text-5xl font-bold text-foreground">
          {wall.header_title ?? "What our customers say"}
        </h1>
        {wall.header_subtitle && (
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {wall.header_subtitle}
          </p>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {wall.testimonials.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No testimonials to display yet.</p>
        ) : (
          <div className={`grid gap-6 grid-cols-1 ${colClass[cols] ?? "md:grid-cols-3"}`}>
            {wall.testimonials.map((t) => (
              <article
                key={t.id}
                className="bg-card rounded-xl border border-border p-6 shadow-sm break-inside-avoid"
              >
                {t.rating != null && (
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < (t.rating ?? 0) ? "fill-current" : "fill-none"}`}
                        style={{ color: i < (t.rating ?? 0) ? accent : "hsl(var(--muted-foreground))" }}
                      />
                    ))}
                  </div>
                )}
                {t.type === "video" && t.video_url ? (
                  <video src={t.video_url} controls poster={t.thumbnail_url ?? undefined} className="w-full rounded-lg mb-4" />
                ) : t.type === "audio" && t.audio_url ? (
                  <audio src={t.audio_url} controls className="w-full mb-4" />
                ) : (
                  <p className="text-foreground mb-4 leading-relaxed">"{t.content}"</p>
                )}
                <div className="flex items-center gap-3">
                  {t.author_avatar ? (
                    <img src={t.author_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: accent }}
                    >
                      {t.author_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-foreground text-sm">{t.author_name}</div>
                    {(t.author_title || t.author_company) && (
                      <div className="text-xs text-muted-foreground">
                        {t.author_title}{t.author_title && t.author_company ? " · " : ""}{t.author_company}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        Powered by <span className="font-semibold text-foreground">Happy Client</span>
      </footer>
    </div>
  );
}