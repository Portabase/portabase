"use server"
import {db} from "@/db";
import {DatabaseWith} from "@/db/schema/07_database";
import {AgentWith} from "@/db/schema/08_agent";

export async function getOrganizationAvailableDatabases(organizationId: string, projectId: string) {

    const availableDatabases = (
        await db.query.database.findMany({
            where: (db, {or, eq, isNull}) => or(isNull(db.projectId), eq(db.projectId, projectId)),
            with: {
                agent: {
                    with: {
                        organizations: true
                    }
                },
                project: true,
                backups: true,
                restorations: true,
            },
            orderBy: (db, {desc}) => [desc(db.createdAt)],
        })
    ) as DatabaseWith[];

    return availableDatabases.filter(db => {
        const agent = db.agent as AgentWith;
        return (
            agent?.organizationId === organizationId ||
            agent?.organizations?.some(org => org.organizationId === organizationId)
        );
    })
}
