"use client";

import {type FC, useState} from "react";
import {Checkbox} from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import type {GenericFilterOption} from "./types";

type FilterValueComboboxProps = {
    filterValues: string[];
    availableValues: GenericFilterOption[];
    setFilterValues: (values: string[]) => void;
    onRemove: () => void;
};

export const FilterValueCombobox: FC<FilterValueComboboxProps> = ({filterValues, availableValues, setFilterValues, onRemove}) => {
    const [open, setOpen] = useState(false);
    const [commandInput, setCommandInput] = useState("");

    const nonSelectedValues = availableValues.filter((option) => !filterValues.includes(option.value));

    const getLabel = (value: string) => availableValues.find((option) => option.value === value)?.label || value;

    const handleUnselect = (value: string) => {
        const remainingValues = filterValues.filter((filterValue) => filterValue !== value);
        if (remainingValues.length === 0) {
            onRemove();
        } else {
            setFilterValues(remainingValues);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="shrink-0 rounded-none bg-muted px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-primary">
                {filterValues.length === 1 ? getLabel(filterValues[0]) : `${filterValues.length} selected`}
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Select value..." value={commandInput} onValueChange={setCommandInput}/>
                    <CommandList>
                        <CommandEmpty>No results found</CommandEmpty>
                        <CommandGroup>
                            {filterValues.map((value) => (
                                <CommandItem key={value} value={getLabel(value)} onSelect={() => handleUnselect(value)}>
                                    <Checkbox checked/>
                                    {getLabel(value)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        {nonSelectedValues.length > 0 && (
                            <>
                                <CommandSeparator/>
                                <CommandGroup>
                                    {nonSelectedValues.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label || option.value}
                                            onSelect={() => setFilterValues([...filterValues, option.value])}
                                        >
                                            <Checkbox checked={false}/>
                                            {option.icon}
                                            {option.label || option.value}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
