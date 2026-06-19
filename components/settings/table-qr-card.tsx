"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tableQrUrl } from "@/lib/app-url";
import type { Table } from "@/lib/types";

interface TableQrCardProps {
  table: Table;
  onRemove?: () => void;
}

export function TableQrCard({ table, onRemove }: TableQrCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = tableQrUrl(table.qrToken);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `table-${table.label}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center p-4 text-center">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={140}
          level="M"
          marginSize={2}
          className="rounded-lg"
        />
        <p className="mt-3 font-display font-semibold text-ink">Table {table.label}</p>
        <p className="text-xs text-muted-foreground">{table.floor ?? "Main"}</p>
        {table.seats && (
          <p className="text-xs text-muted-foreground">{table.seats} seats</p>
        )}
        <div className="mt-3 flex w-full gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={download}>
            <Download className="size-3.5" />
            Download
          </Button>
          {onRemove && (
            <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={onRemove}>
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
