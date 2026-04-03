import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, SkeletonTable } from "./StateComponents";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: string[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, searchable, searchKeys = [], onRowClick, isLoading, emptyTitle, emptyDescription, pageSize = 10, className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search || !searchKeys.length) return data;
    const q = search.toLowerCase();
    return data.filter(item => searchKeys.some(k => String(item[k] ?? "").toLowerCase().includes(q)));
  }, [data, search, searchKeys]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) return <SkeletonTable />;

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
        </div>
      )}
      {paged.length === 0 ? (
        <EmptyState title={emptyTitle || "No results found"} description={emptyDescription || "Try adjusting your search or filters."} />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map(col => (
                  <TableHead key={col.key} className={cn("text-xs font-medium uppercase tracking-wide", col.className)}>{col.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item, i) => (
                <TableRow key={i} className={cn(onRowClick && "cursor-pointer")} onClick={() => onRowClick?.(item)}>
                  {columns.map(col => (
                    <TableCell key={col.key} className={cn("py-3", col.className)}>
                      {col.render ? col.render(item) : String(item[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
