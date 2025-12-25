import React from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

export function Lightbox({ src, onClose }: LightboxProps) {
  if (!src) return null;

  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black/90 border-none flex items-center justify-center overflow-hidden">
        <VisuallyHidden.Root>
            <DialogTitle>Image View</DialogTitle>
        </VisuallyHidden.Root>
        
        <DialogClose className="absolute top-4 right-4 text-white hover:text-gray-300 z-50">
          <X className="w-6 h-6" />
        </DialogClose>
        
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img 
            src={src} 
            alt="Fullscreen" 
            className="max-w-full max-h-full object-contain" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
