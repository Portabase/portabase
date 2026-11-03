"use client";

import {type FC, useRef, useState} from "react";
import {ListFilter} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Input} from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {FilterItem} from "./filter-item";
import {DEFAULT_OPERATORS} from "./list-filters";
import type {GenericFilter, GenericFilterConfig} from "./types";

export type FiltersWrapperProps = {
    availableFilters: GenericFilterConfig[];
    filters: GenericFilter[];
    setFilters: (filters: GenericFilter[]) => void;
    search: string;
    setSearch: (search: string) => void;
    searchPlaceholder?: string;
};

export const FiltersWrapper: FC<FiltersWrapperProps> = ({availableFilters, filters, setFilters, search, setSearch, searchPlaceholder}) => {
    const [open, setOpen] = useState(false);
    const [selectedView, setSelectedView] = useState<GenericFilterConfig | null>(null);
    const [commandInput, setCommandInput] = useState("");
    const [searchInput, setSearchInput] = useState(search);
    const commandInputRef = useRef<HTMLInputElement>(null);

    const addFilter = (config: GenericFilterConfig, value: string[]) => {
        const operators = config.operators ?? DEFAULT_OPERATORS;
        setFilters([...filters, {type: config.type, operator: operators[0], value}]);
        setSelectedView(null);
        setCommandInput("");
        setOpen(false);
    };

    const updateFilter = (updatedFilter: GenericFilter) => {
        setFilters(filters.map((filter) => (filter.type === updatedFilter.type ? updatedFilter : filter)));
    };

    const removeFilter = (type: string) => {
        setFilters(filters.filter((filter) => filter.type !== type));
    };

    const selectedTypes = filters.map((filter) => filter.type);
    const remainingFilters = availableFilters.filter((config) => !selectedTypes.includes(config.type) && config.options?.length);

    return (
        <div className="flex w-full flex-wrap items-center gap-2">
            {searchPlaceholder && (
                <Input
                    type="text"
                    value={searchInput}
                    placeholder={searchPlaceholder}
                    onChange={(event) => {
                        setSearchInput(event.target.value);
                        setSearch(event.target.value);
                    }}
                    className="w-full sm:w-auto sm:min-w-[30%]"
                />
            )}

            {availableFilters.length > 0 && (
                <Popover
                    open={open}
                    onOpenChange={(nextOpen) => {
                        setOpen(nextOpen);
                        if (!nextOpen) {
                            setTimeout(() => {
                                setSelectedView(null);
                                setCommandInput("");
                            }, 200);
                        }
                    }}
                >
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" aria-label="Filter">
                            <ListFilter className="shrink-0"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" align="start">
                        <Command>
                            <CommandInput
                                ref={commandInputRef}
                                placeholder={selectedView ? selectedView.label : "Filter..."}
                                value={commandInput}
                                onValueChange={setCommandInput}
                            />
                            <CommandList>
                                <CommandEmpty>No filters</CommandEmpty>
                                {selectedView ? (
                                    <CommandGroup>
                                        {selectedView.options?.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label || option.value}
                                                onSelect={() => addFilter(selectedView, [option.value])}
                                                className="flex items-center gap-2"
                                            >
                                                {option.icon}
                                                {option.label || option.value}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                ) : (
                                    <CommandGroup>
                                        {remainingFilters.map((config) => (
                                            <CommandItem
                                                key={config.type}
                                                value={config.label}
                                                onSelect={() => {
                                                    setSelectedView(config);
                                                    setCommandInput("");
                                                    setTimeout(() => commandInputRef.current?.focus(), 50);
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                {config.icon}
                                                {config.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}

            {filters.map((filter) => {
                const config = availableFilters.find((availableFilter) => availableFilter.type === filter.type);
                if (!config) return null;
                return (
                    <FilterItem
                        key={filter.type}
                        filter={filter}
                        config={config}
                        onChange={updateFilter}
                        onRemove={() => removeFilter(filter.type)}
                    />
                );
            })}

            {(filters.length > 0 || searchInput) && (
                <Button
                    variant="outline"
                    onClick={() => {
                        setFilters([]);
                        setSearchInput("");
                        setSearch("");
                    }}
                >
                    Clear
                </Button>
            )}
        </div>
    );
};
