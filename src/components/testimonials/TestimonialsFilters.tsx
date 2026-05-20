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
import { Search, ArrowUpDown, LayoutGrid, List, Check, Download, Trash2 } from "lucide-react";

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

const filterConfig: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "featured", label: "Featured" },
  { key: "video", label: "Video" },
  { key: "text", label: "Text" },
  { key: "audio", label: "Audio" },
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 bg-card border-border focus:border-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <ArrowUpDown className="w-3.5 h-3.5" />
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
                Highest rated
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "revenue"}
                onCheckedChange={() => onSortChange("revenue")}
              >
                Most revenue
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
          <div className="inline-flex items-center h-9 rounded-md border border-border bg-card p-0.5">
            <button
              onClick={() => onViewChange("grid")}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-[5px] transition-colors ${
                viewType === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-[5px] transition-colors ${
                viewType === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {filterConfig.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`relative inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeFilter === filter.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
            <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded ${
              activeFilter === filter.key ? "bg-primary-light text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {counts[filter.key]}
            </span>
            {activeFilter === filter.key && (
              <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 h-12 bg-card border border-border rounded-lg animate-fade-in-up">
          <span className="text-sm text-foreground">
            <span className="font-semibold tabular-nums">{selectedCount}</span>
            <span className="text-muted-foreground"> selected</span>
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onBulkApprove}>
              <Check className="w-3.5 h-3.5" />
              Approve
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onBulkExport}>
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onBulkDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
