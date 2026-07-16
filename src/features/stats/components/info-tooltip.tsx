"use client";

import { type ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  content: ReactNode;
};

export function InfoTooltip({ content }: Props) {
  const isMobile = useIsMobile();


  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
          type="button"
          aria-label="More information"
          className="inline-flex items-center justify-center shrink-0 cursor-help"
        >
          <Info
            size={13}
            className="text-muted-foreground/50 hover:text-muted-foreground"
          />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className={"max-w-64 bg-black dark:bg-primary text-white text-xs"}>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
          type="button"
          aria-label="More information"
          className="inline-flex items-center justify-center shrink-0 cursor-help"
        >
          <Info
            size={13}
            className="text-muted-foreground/50 hover:text-muted-foreground"
          />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className={"max-w-64 bg-black dark:bg-primary text-white text-xs"}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
