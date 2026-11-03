import type {ReactNode} from "react";

export type FilterOperator = "is" | "is_not";

export type GenericFilterOption = {
    value: string;
    label?: string;
    icon?: ReactNode;
};

export type GenericFilterConfig = {
    type: string;
    label: string;
    icon?: ReactNode;
    options?: GenericFilterOption[];
    operators?: FilterOperator[];
};

export type GenericFilter = {
    type: string;
    operator: FilterOperator;
    value: string[];
};

export type FilterParams = Record<string, string | string[]>;
