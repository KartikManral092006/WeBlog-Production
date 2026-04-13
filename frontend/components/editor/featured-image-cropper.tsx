"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Move, ZoomIn } from "lucide-react";

const PREVIEW_BASE_WIDTH = 1000;

const ASPECT_PRESETS = [
  { value: "original", label: "Original" },
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
] as const;

type AspectPreset = (typeof ASPECT_PRESETS)[number]["value"];

type FeaturedImageCropperProps = {
  open: boolean;
  source: string | null;
  onCancel: () => void;
  onSave: (croppedDataUrl: string) => void;
};

function parseAspectRatio(value: AspectPreset, originalRatio: number) {
  if (value === "original") {
    return originalRatio || 16 / 9;
  }

  const [w, h] = value.split(":").map(Number);
  if (!w || !h) {
    return originalRatio || 16 / 9;
  }

  return w / h;
}

export function FeaturedImageCropper({ open, source, onCancel, onSave }: FeaturedImageCropperProps) {
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("16:9");
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!source) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      setImgWidth(image.width);
      setImgHeight(image.height);
      setImageElement(image);
    };
    image.src = source;
  }, [source]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  }, [open, source]);

  const originalAspect = useMemo(() => {
    if (!imgWidth || !imgHeight) {
      return 16 / 9;
    }
    return imgWidth / imgHeight;
  }, [imgWidth, imgHeight]);

  const activeAspect = useMemo(
    () => parseAspectRatio(aspectPreset, originalAspect),
    [aspectPreset, originalAspect]
  );

  const drawImageInFrame = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    frameWidth: number,
    frameHeight: number,
    offsetX: number,
    offsetY: number,
    zoom: number
  ) => {
    const scaleToFit = Math.min(frameWidth / image.width, frameHeight / image.height);
    const finalScale = scaleToFit * zoom;

    const drawWidth = image.width * finalScale;
    const drawHeight = image.height * finalScale;

    const centerX = frameWidth / 2 + offsetX;
    const centerY = frameHeight / 2 + offsetY;
    const drawX = centerX - drawWidth / 2;
    const drawY = centerY - drawHeight / 2;

    ctx.clearRect(0, 0, frameWidth, frameHeight);
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  };

  useEffect(() => {
    if (!open || !imageElement || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const frameWidth = PREVIEW_BASE_WIDTH;
    const frameHeight = Math.round(frameWidth / activeAspect);

    canvas.width = frameWidth;
    canvas.height = frameHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    drawImageInFrame(ctx, imageElement, frameWidth, frameHeight, cropX, cropY, cropZoom);
  }, [open, imageElement, activeAspect, cropX, cropY, cropZoom]);

  const handleSave = () => {
    if (!imageElement) {
      return;
    }

    const frameWidth = PREVIEW_BASE_WIDTH;
    const frameHeight = Math.round(frameWidth / activeAspect);
    const outputWidth = Math.min(2200, frameWidth * 2);
    const outputHeight = Math.min(2200, Math.round(outputWidth / activeAspect));

    const offsetScale = outputWidth / frameWidth;
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    drawImageInFrame(
      ctx,
      imageElement,
      outputWidth,
      outputHeight,
      cropX * offsetScale,
      cropY * offsetScale,
      cropZoom
    );

    let quality = 0.9;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    const maxBytes = 2.5 * 1024 * 1024;

    while (dataUrl.length * 0.75 > maxBytes && quality > 0.55) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    onSave(dataUrl);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adjust Featured Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              className="relative w-full max-w-2xl overflow-hidden rounded-xl border bg-muted"
              style={{ aspectRatio: String(activeAspect) }}
            >
              <canvas
                ref={previewCanvasRef}
                className="h-full w-full"
                aria-label="Featured crop preview"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-sm">Aspect Ratio</Label>
              <select
                value={aspectPreset}
                onChange={(e) => setAspectPreset(e.target.value as AspectPreset)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                {ASPECT_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-sm">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </Label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-sm">
                <Move className="h-4 w-4" />
                Horizontal Position
              </Label>
              <input
                type="range"
                min={-220}
                max={220}
                step={1}
                value={cropX}
                onChange={(e) => setCropX(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Vertical Position</Label>
              <input
                type="range"
                min={-220}
                max={220}
                step={1}
                value={cropY}
                onChange={(e) => setCropY(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!source}>
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
