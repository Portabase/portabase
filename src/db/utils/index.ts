import {inArray, isNotNull, isNull, notInArray, or, sql, type Column, type SQL} from "drizzle-orm";
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

export function deletionStateCondition(
    deletedAtColumn: Column,
    states: readonly ("available" | "deleted")[] | undefined,
    operator: FilterOperator | undefined,
): SQL | undefined {
    if (!states || states.length === 0) return undefined;
    const selectedStates = operator === "is_not"
        ? (["available", "deleted"] as const).filter((state) => !states.includes(state))
        : [...new Set(states)];
    if (selectedStates.length === 0) return sql`false`;
    if (selectedStates.length > 1) return undefined;
    return selectedStates[0] === "available" ? isNull(deletedAtColumn) : isNotNull(deletedAtColumn);
}
