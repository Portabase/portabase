"use client";

import type {FC} from "react";
import {X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {FilterValueCombobox} from "./filter-value-combobox";
import {DEFAULT_OPERATORS} from "./list-filters";
import type {FilterOperator, GenericFilter, GenericFilterConfig} from "./types";

const OPERATOR_LABELS: Record<FilterOperator, string> = {
    is: "is",
    is_not: "is not",
};

type FilterItemProps = {
    filter: GenericFilter;
    config: GenericFilterConfig;
    onChange: (filter: GenericFilter) => void;
    onRemove: () => void;
};

export const FilterItem: FC<FilterItemProps> = ({filter, config, onChange, onRemove}) => {
    const operators = config.operators ?? DEFAULT_OPERATORS;

    return (
        <div className="flex items-center gap-0.5 text-sm">
            <div className="flex items-center gap-1.5 rounded-l-sm bg-muted px-2 py-1.5">
                {config.icon}
                {config.label}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="shrink-0 bg-muted px-2 py-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-primary">
                    {OPERATOR_LABELS[filter.operator]}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {operators.map((operator) => (
                        <DropdownMenuItem key={operator} onClick={() => onChange({...filter, operator})}>
                            {OPERATOR_LABELS[operator]}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <FilterValueCombobox
                filterValues={filter.value}
                availableValues={config.options ?? []}
                setFilterValues={(value) => onChange({...filter, value})}
                onRemove={onRemove}
            />
            <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                aria-label={`Remove ${config.label} filter`}
                className="h-8 w-8 shrink-0 rounded-l-none rounded-r-sm bg-muted text-muted-foreground transition hover:bg-muted/50 hover:text-primary"
            >
                <X/>
            </Button>
        </div>
    );
};
