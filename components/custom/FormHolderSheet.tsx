// components/custom/FormHolderSheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FormHolderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export default function FormHolderSheet({ open, onOpenChange, title, children }: FormHolderSheetProps) {
    const isDesktop = useMediaQuery("(min-width: 640px)");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="p-0 flex flex-col w-full sm:max-w-[50%] sm:h-screen h-[75vh] shadow-[0_0_40px_rgba(0,0,0,0.35)] sm:shadow-[-40px_0_60px_-10px_rgba(0,0,0,0.35)] "
        side={isDesktop ? "right" : "bottom"}
        style={{
          width: isDesktop ? "50%" : "100%",
          maxWidth:  isDesktop ? "50%" : "100%",
          height:  isDesktop ? "100%" : "85%",
        }}
      >
        <div
          className="relative flex items-center justify-between px-4 py-3 border-b bg-white"
          style={{
            height: "56px",
          }}
        >
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-black"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="overflow-y-auto px-4 pt-4 pb-6"
          style={{
            height: "calc(100% - 56px)",
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
