import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PaginationSizeProps = {
    className?: string;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
};

export const PaginationSize = (props: PaginationSizeProps) => {
    const { className, pageSize, onPageSizeChange, pageSizeOptions = [10, 20, 30, 40, 50] } = props;

    return (
        <div className={cn("flex items-center justify-end sm:justify-center space-x-2", className)}>
            <p className="whitespace-nowrap text-sm font-medium hidden md:block">Cards per page</p>
            <Select
                value={`${pageSize}`}
                onValueChange={(value) => onPageSizeChange(Number(value))}
            >
                <SelectTrigger className="h-8 w-[4.5rem]" aria-label="Cards per page">
                    <SelectValue placeholder={pageSize} />
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
