import type {GenericFilterConfig} from "./types";

export const livenessFilter: GenericFilterConfig = {
    type: "liveness",
    label: "Status",
    options: [
        {value: "online", label: "Online"},
        {value: "offline", label: "Offline"},
        {value: "never", label: "Never connected"},
    ],
};

export function getDbmsFilter(databases: { dbms: string }[]): GenericFilterConfig {
    const dbmsValues = [...new Set(databases.map((database) => database.dbms))].sort();
    return {
        type: "dbms",
        label: "DBMS",
        options: dbmsValues.map((dbms) => ({value: dbms, label: dbms})),
    };
}

export const projectStateFilter: GenericFilterConfig = {
    type: "projectState",
    label: "Project",
    options: [
        {value: "assigned", label: "Assigned"},
        {value: "unassigned", label: "Unassigned"},
    ],
};

export const lastBackupFilter: GenericFilterConfig = {
    type: "lastBackupStatus",
    label: "Last backup",
    options: [
        {value: "success", label: "Success"},
        {value: "failed", label: "Failed"},
        {value: "ongoing", label: "Ongoing"},
        {value: "waiting", label: "Waiting"},
        {value: "none", label: "No backup"},
    ],
};

export const jobStatusFilter: GenericFilterConfig = {
    type: "status",
    label: "Status",
    options: [
        {value: "success", label: "Success"},
        {value: "failed", label: "Failed"},
        {value: "ongoing", label: "Ongoing"},
        {value: "waiting", label: "Waiting"},
    ],
};

export const releaseStateFilter: GenericFilterConfig = {
    type: "releaseState",
    label: "Version",
    options: [
        {value: "outdated", label: "Outdated"},
        {value: "current", label: "Up to date"},
    ],
};
