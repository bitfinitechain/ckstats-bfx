"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Numbered pages with ellipses: 1 … c-1 c c+1 … N
    const pages: (number | "ellipsis")[] = [];
    const w = 1;
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage - w > 2) pages.push("ellipsis");
        const start = Math.max(2, currentPage - w);
        const end = Math.min(totalPages - 1, currentPage + w);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage + w < totalPages - 1) pages.push("ellipsis");
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-center gap-1.5 py-4 flex-wrap">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            {pages.map((p, i) =>
                p === "ellipsis" ? (
                    <span key={`e${i}`} className="w-9 text-center text-muted-foreground select-none">…</span>
                ) : (
                    <Button
                        key={p}
                        variant={p === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(p)}
                        className="min-w-9 font-mono tabular-nums"
                        aria-current={p === currentPage ? "page" : undefined}
                    >
                        {p}
                    </Button>
                )
            )}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
