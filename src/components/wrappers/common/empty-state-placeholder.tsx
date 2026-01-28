import Link from "next/link";
import {cn} from "@/lib/utils";
import {Plus} from "lucide-react";
import {forwardRef} from "react";

type EmptyStatePlaceholderProps = {
    url?: string;
    onClick?: () => void;
    text: string;
    className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const EmptyStatePlaceholder = forwardRef<HTMLDivElement, EmptyStatePlaceholderProps>(({
                                          url,
                                          onClick,
                                          text,
                                          className,
                                          ...props
                                      }, ref) => {
    const Container = (
        <div
            className={cn(
                "flex h-full flex-col items-center justify-center w-full rounded-2xl border border-dashed border-muted p-6 lg:p-10",
                "hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary text-center space-y-4",
                (onClick || url) && "cursor-pointer"
            )}
            onClick={onClick}
        >
            <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
            <p className="text-sm">{text}</p>
        </div>
    );

    if (url) {
        return (
            <div className={cn(className)}>
                <Link href={url}>{Container}</Link>
            </div>
        );
    }

    return <div className={cn(className)} ref={ref} {...props}>{Container}</div>;
});

EmptyStatePlaceholder.displayName = "EmptyStatePlaceholder";