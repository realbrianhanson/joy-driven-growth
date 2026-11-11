import { GalleryHorizontal, LayoutGrid, Quote, type LucideIcon } from "lucide-react";
import type { WidgetLayout } from "@/components/shared/WidgetRenderer";
import { PUBLIC_APP_URL } from "@/lib/config";

export const WIDGET_LAYOUTS: Record<WidgetLayout, { label: string; hint: string; icon: LucideIcon }> = {
  carousel: { label: "Carousel", hint: "One at a time, with arrows", icon: GalleryHorizontal },
  grid: { label: "Grid", hint: "Several side by side", icon: LayoutGrid },
  single: { label: "Single quote", hint: "One featured testimonial", icon: Quote },
};

/** The one line a customer pastes into their website. */
export function widgetEmbedCode(widgetId: string): string {
  return `<script src="${PUBLIC_APP_URL}/widget.js" data-widget-id="${widgetId}" async></script>`;
}
