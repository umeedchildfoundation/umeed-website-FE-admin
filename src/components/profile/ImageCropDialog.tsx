import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageCropDialogProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onCropComplete: (croppedImage: Blob) => Promise<void>;
}

export function ImageCropDialog({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropDialogProps) {
    const [loading, setLoading] = useState(false);
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const imageRef = useRef<HTMLImageElement>(null);

    const OUTPUT_SIZE = 300;

    const handleSave = async () => {
        try {
            setLoading(true);
            const img = imageRef.current;
            if (!img) return;

            const canvas = document.createElement('canvas');
            canvas.width = OUTPUT_SIZE;
            canvas.height = OUTPUT_SIZE;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

            // Calculate dimensions to cover the square width
            const scale = OUTPUT_SIZE / img.naturalWidth;
            const scaledWidth = OUTPUT_SIZE;
            const scaledHeight = img.naturalHeight * scale;

            // Apply the offset for centering
            const drawY = offsetY;

            ctx.drawImage(img, 0, drawY, scaledWidth, scaledHeight);

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    console.error("Failed to create blob");
                    setLoading(false);
                    return;
                }
                await onCropComplete(blob);
                onClose();
                setOffsetY(0);
            }, "image/jpeg", 0.9);
        } catch (e) {
            console.error("Save error:", e);
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOffsetY(0);
        onClose();
    };

    // Touch handlers for swipe up/down
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStartY(e.touches[0].clientY - offsetY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && e.touches.length === 1) {
            const newOffset = e.touches[0].clientY - dragStartY;
            // Limit the offset range
            const img = imageRef.current;
            if (img) {
                const scale = 256 / img.naturalWidth;
                const scaledHeight = img.naturalHeight * scale;
                const maxOffset = 0;
                const minOffset = Math.min(0, 256 - scaledHeight);
                setOffsetY(Math.max(minOffset, Math.min(maxOffset, newOffset)));
            }
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Mouse handlers for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartY(e.clientY - offsetY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const newOffset = e.clientY - dragStartY;
        const img = imageRef.current;
        if (img) {
            const scale = 256 / img.naturalWidth;
            const scaledHeight = img.naturalHeight * scale;
            const maxOffset = 0;
            const minOffset = Math.min(0, 256 - scaledHeight);
            setOffsetY(Math.max(minOffset, Math.min(maxOffset, newOffset)));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm p-4 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-center">Position Photo</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4">
                    <div
                        className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-muted bg-muted cursor-ns-resize touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Preview"
                            className="w-full h-auto select-none pointer-events-none"
                            style={{ transform: `translateY(${offsetY}px)` }}
                            draggable={false}
                        />
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Swipe up/down to position
                    </p>
                </div>

                <DialogFooter className="flex gap-2 mt-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="flex-1">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
