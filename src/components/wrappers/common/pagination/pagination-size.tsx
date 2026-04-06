import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PaginationSizeProps = {
    className?: string;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
};

export const PaginationSize = (props: PaginationSizeProps) => {
    const { className, onPageSizeChange, pageSizeOptions = [10, 20, 30, 40, 50] } = props;
    const effectivePageSize = pageSizeOptions.includes(props.pageSize) ? props.pageSize : pageSizeOptions[0];

    return (
        <div className={cn("flex items-center justify-end sm:justify-center space-x-2", className)}>
            <p className="whitespace-nowrap text-sm font-medium hidden md:block">Cards per page</p>
            <Select
                value={`${effectivePageSize}`}
                onValueChange={(value) => onPageSizeChange(Number(value))}
            >
                <SelectTrigger className="h-8 w-[4.5rem]" aria-label="Cards per page">
                    <SelectValue placeholder={effectivePageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                    {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                            {size}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
