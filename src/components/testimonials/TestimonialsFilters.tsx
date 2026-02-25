import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, Grid, List, Star } from "lucide-react";

export type FilterType = "all" | "pending" | "approved" | "featured" | "video" | "text" | "audio";
export type ViewType = "grid" | "list";
export type SortType = "newest" | "rating" | "revenue" | "converting";

interface FilterCounts {
  all: number;
  pending: number;
  approved: number;
  featured: number;
  video: number;
  text: number;
  audio: number;
}

interface TestimonialsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  viewType: ViewType;
  onViewChange: (view: ViewType) => void;
  sortBy: SortType;
  onSortChange: (sort: SortType) => void;
  counts: FilterCounts;
  selectedCount: number;
  onBulkApprove?: () => void;
  onBulkExport?: () => void;
  onBulkDelete?: () => void;
}

const filterConfig = [
  { key: "all" as FilterType, label: "All", icon: null },
  { key: "pending" as FilterType, label: "Pending", icon: "⏳" },
  { key: "approved" as FilterType, label: "Approved", icon: "✅" },
  { key: "featured" as FilterType, label: "Featured", icon: "⭐" },
  { key: "video" as FilterType, label: "Video", icon: "🎥" },
  { key: "text" as FilterType, label: "Text", icon: "📝" },
  { key: "audio" as FilterType, label: "Audio", icon: "🎤" },
];

export function TestimonialsFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewType,
  onViewChange,
  sortBy,
  onSortChange,
  counts,
  selectedCount,
  onBulkApprove,
  onBulkExport,
  onBulkDelete,
}: TestimonialsFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border focus:border-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortBy === "newest"}
                onCheckedChange={() => onSortChange("newest")}
              >
                Newest first
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "rating"}
                onCheckedChange={() => onSortChange("rating")}
              >
                <Star className="w-3 h-3 mr-2 fill-gold text-gold" />
                Highest rated
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "revenue"}
                onCheckedChange={() => onSortChange("revenue")}
              >
                💰 Most revenue
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "converting"}
                onCheckedChange={() => onSortChange("converting")}
              >
                Best converting
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewType === "grid" ? "default" : "ghost"}
              size="sm"
              className={`px-3 ${viewType === "grid" ? "bg-card shadow-sm" : ""}`}
              onClick={() => onViewChange("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewType === "list" ? "default" : "ghost"}
              size="sm"
              className={`px-3 ${viewType === "list" ? "bg-card shadow-sm" : ""}`}
              onClick={() => onViewChange("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {filterConfig.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`relative inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeFilter === filter.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
            <span className={`text-xs tabular-nums ${
              activeFilter === filter.key ? "text-primary" : "text-muted-foreground"
            }`}>
              {counts[filter.key]}
            </span>
            {activeFilter === filter.key && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in-up">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onBulkApprove}>
              ✅ Approve all
            </Button>
            <Button size="sm" variant="outline" onClick={onBulkExport}>
              📤 Export
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={onBulkDelete}>
              🗑️ Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
