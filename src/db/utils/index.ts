import {inArray, isNull, notInArray, or, type Column, type SQL} from "drizzle-orm";
import type {FilterOperator} from "@/components/common/filters/types";

export function withUpdatedAt<T extends object>(data: T): T & { updatedAt: Date } {
    return {...data, updatedAt: new Date()};
}

export function filterCondition(
    column: Column,
    values: readonly unknown[] | undefined,
    operator: FilterOperator | undefined,
): SQL | undefined {
    if (!values || values.length === 0) return undefined;
    if (operator === "is_not") return or(isNull(column), notInArray(column, [...values]));
    return inArray(column, [...values]);
}
