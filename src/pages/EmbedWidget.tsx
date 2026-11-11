import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicTestimonial } from "@/components/shared/QuoteCard";
import { normalizeWidgetLayout, useWidgetTheme, WidgetRenderer } from "@/components/shared/WidgetRenderer";
import { PUBLIC_APP_URL } from "@/lib/config";

interface WidgetData {
  id: string;
  name: string;
  type: string;
  theme: string | null;
  show_rating: boolean | null;
  show_date: boolean | null;
  auto_rotate: boolean | null;
  testimonials: PublicTestimonial[];
}

/**
 * The page that loads inside the iframe on a customer's website.
 * It has a transparent background, reports its height to the host page, and
 * shows nothing at all when there is nothing approved to show.
 */
export default function EmbedWidget() {
  const { id } = useParams<{ id: string }>();
  const counted = useRef(false);

  const { data: widget, isLoading } = useQuery({
    queryKey: ["embed-widget", id],
    enabled: !!id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_widget_public", { p_widget_id: id! });
      if (error) throw error;
      return data as unknown as WidgetData | null;
    },
  });

  const theme = useWidgetTheme(widget?.theme);

  // Blend into the host page: no background, and a colour scheme that matches the widget theme.
  useEffect(() => {
    const root = document.documentElement;
    const previous = { rootBg: root.style.background, bodyBg: document.body.style.background, scheme: root.style.colorScheme };
    root.style.background = "transparent";
    document.body.style.background = "transparent";
    root.style.colorScheme = widget?.theme === "dark" ? "dark" : widget?.theme === "auto" ? "light dark" : "light";
    return () => {
      root.style.background = previous.rootBg;
      document.body.style.background = previous.bodyBg;
      root.style.colorScheme = previous.scheme;
    };
  }, [widget?.theme]);

  // Tell the host page how tall we are so the iframe never shows a scrollbar.
  useEffect(() => {
    const send = () => window.parent?.postMessage({ hcHeight: Math.ceil(document.documentElement.scrollHeight) }, "*");
    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const hasTestimonials = !!widget && widget.testimonials.length > 0;

  useEffect(() => {
    if (!hasTestimonials || !id || counted.current) return;
    counted.current = true;
    void supabase.rpc("increment_widget_impressions", { p_widget_id: id });
  }, [hasTestimonials, id]);

  if (isLoading || !hasTestimonials || !widget) return <div aria-hidden="true" />;

  return (
    <div className="p-1">
      <WidgetRenderer
        layout={normalizeWidgetLayout(widget.type)}
        testimonials={widget.testimonials}
        theme={widget.theme}
        showRating={widget.show_rating !== false}
        showDate={widget.show_date === true}
        autoRotate={widget.auto_rotate !== false}
      />
      <p className="mt-3 text-center text-[11px]" style={{ color: theme.muted }}>
        <a href={PUBLIC_APP_URL || "/"} target="_blank" rel="noopener" style={{ color: "inherit" }}>
          Collected with Happy Client
        </a>
      </p>
    </div>
  );
}
