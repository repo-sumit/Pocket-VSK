import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DataColumn<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
  render: (row: T, index: number) => ReactNode;
}

const alignCls = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

/**
 * One shared table grammar: consistent header style, row height, dividers, hover
 * affordance, empty state and horizontal-scroll on narrow screens. Column-driven
 * so every tabular surface (export report, drill lists) reads the same.
 */
export function ResponsiveDataTable<T>({
  columns, rows, getRowKey, onRowClick, rowClassName, footer, empty, size = "sm", className,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  footer?: ReactNode;
  empty?: ReactNode;
  size?: "xs" | "sm";
  className?: string;
}) {
  if (!rows.length && empty) return <>{empty}</>;
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className={cn("w-full", size === "xs" ? "text-xs" : "text-sm")}>
        <thead>
          <tr className="border-b border-line text-2xs uppercase tracking-wide text-neutral-400">
            {columns.map((c) => (
              <th key={c.key} className={cn("py-2 font-semibold", alignCls(c.align), c.headerClassName)}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((row, i) => (
            <tr
              key={getRowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && "cursor-pointer hover:bg-neutral-50", rowClassName?.(row))}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("py-2.5", alignCls(c.align), c.className)}>{c.render(row, i)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}
