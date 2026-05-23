import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Toggle} from "@/components/ui/toggle";
import {CheckIcon, Filter, RefreshCcw} from "lucide-react";
import {Badge} from "@/components/ui/badge";

export type FilterItem = {
    label: string,
    value: string
}

type FiltersDropdownProps = {
    items: FilterItem[];
    selectedItems: FilterItem[];
    onSelect: (item: FilterItem) => void;
    clearFilters: () => void;
}

export const FiltersDropdown = ({items, selectedItems, onSelect, clearFilters}: FiltersDropdownProps) => {

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>

                <div className="relative">
                    <Toggle variant="outline" size="sm" className="cursor-pointer w-fit">
                        <Filter className="h-4 w-4"/>
                    </Toggle>
                    {selectedItems.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                            {selectedItems.length}
                        </Badge>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                {items.map((item, index) => {
                    const isSelected = selectedItems.some(f => f.value === item.value);
                    return (
                        <DropdownMenuItem
                            key={index}
                            className="flex items-center justify-between cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                onSelect(item);
                            }}
                        >
                            <span>{item.label}</span>
                            {isSelected && <CheckIcon className="h-4 w-4 text-blue-500"/>}
                        </DropdownMenuItem>
                    )
                })}
                <DropdownMenuItem
                    disabled={selectedItems.length === 0}
                    className="flex gap-2 cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        clearFilters();
                    }}
                >
                    <RefreshCcw className='h-4 w-4'/>
                    Clear filters
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}