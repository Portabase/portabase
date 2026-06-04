"use client";

import { type ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  content: ReactNode;
};

export function InfoTooltip({ content }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info
            size={13}
            className="text-muted-foreground/50 hover:text-muted-foreground cursor-help shrink-0"
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
