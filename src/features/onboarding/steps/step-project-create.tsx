"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { mockDatabases } from "@/features/onboarding/onboarding.mock";

export const StepProjectCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [databaseIds, setDatabaseIds] = useState<string[]>([]);

    const toggleDb = (id: string) => {
        setDatabaseIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, project: { name, description, databaseIds } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Create a project</h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — group databases under a project.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My project" />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
                <Label>Databases</Label>
                <div className="flex flex-col gap-2">
                    {mockDatabases.map((db) => (
                        <button
                            key={db.id}
                            type="button"
                            onClick={() => toggleDb(db.id)}
                            className={`text-left rounded-md border p-2 text-sm ${databaseIds.includes(db.id) ? "border-primary bg-primary/10" : "border-white/10"}`}
                        >
                            {db.name} <span className="text-muted-foreground">({db.engine})</span>
                        </button>
                    ))}
                </div>
            </div>
            <Button type="button" onClick={onContinue} disabled={!name.trim()}>
                Continue
            </Button>
        </div>
    );
};
