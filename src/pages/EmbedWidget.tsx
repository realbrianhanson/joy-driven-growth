import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WidgetTestimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  author_company: string | null;
  author_avatar: string | null;
  display_preference: "full" | "first_initial" | "anonymous" | null;
  content: string | null;
  rating: number | null;
  type: "text" | "video" | "audio";
}

interface WidgetData {
  id: string;
  name: string;
  type: string;
  theme: string;
  show_rating: boolean | null;
  show_date: boolean | null;
  auto_rotate: boolean | null;
  testimonials: WidgetTestimonial[];
}

export default function EmbedWidget() {
  const { id } = useParams<{ id: string }>();
  const [index, setIndex] = useState(0);

  // Auto-resize handshake with parent
  useEffect(() => {
    const send = () =>
      window.parent?.postMessage({ hcHeight: document.documentElement.scrollHeight }, "*");
    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  const { data: widget, isLoading } = useQuery({
    queryKey: ["embed-widget", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_widget_public", { p_widget_id: id! });
      if (error) throw error;
      return data as unknown as WidgetData | null;
    },
  });

  useEffect(() => {
    if (widget && id) {
      supabase.rpc("increment_widget_impressions", { p_widget_id: id }).then(() => {});
    }
  }, [widget, id]);

  useEffect(() => {
    if (widget?.type === "carousel" && widget.auto_rotate && widget.testimonials.length > 1) {
      const t = setInterval(() => setIndex((i) => (i + 1) % widget.testimonials.length), 5000);
      return () => clearInterval(t);
    }
  }, [widget]);

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  if (!widget || widget.testimonials.length === 0)
    return <div className="p-4 text-sm text-muted-foreground">No testimonials.</div>;

  const showRating = widget.show_rating !== false;
  const renderCard = (t: WidgetTestimonial) => (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
      {showRating && t.rating != null && (
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < (t.rating ?? 0) ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
            />
          ))}
        </div>
      )}
      <p className="text-sm text-foreground leading-relaxed mb-4 flex-1">"{t.content}"</p>
      <div className="flex items-center gap-3">
        {t.author_avatar ? (
          <img src={t.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
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
    </div>
  );

  if (widget.type === "carousel" || widget.type === "single") {
    const t = widget.testimonials[Math.min(index, widget.testimonials.length - 1)];
    return (
      <div className="p-2">
        {renderCard(t)}
        {widget.type === "carousel" && widget.testimonials.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {widget.testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full ${i === index ? "bg-primary" : "bg-muted"}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (widget.type === "grid" || widget.type === "inline") {
    return (
      <div className="p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {widget.testimonials.slice(0, 6).map((t) => (
          <div key={t.id}>{renderCard(t)}</div>
        ))}
      </div>
    );
  }

  const t = widget.testimonials[0];
  return <div className="p-2">{renderCard(t)}</div>;
}