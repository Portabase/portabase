"use client"

import {useState} from "react"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Input} from "@/components/ui/input"
import {Separator} from "@/components/ui/separator"
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import {Clock, Database, Save, Settings, Calendar, RotateCcw} from "lucide-react"
import {toast} from "sonner";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {
    updateOrCreateBackupRetentionPolicyAction
} from "@/components/wrappers/dashboard/database/retention-policy/backup-retention-settings.action";
import {Database as DbSchema} from "@/db/schema/07_database";

type RetentionPolicyType = "count" | "days" | "gfs"

interface GFSSettings {
    daily: number
    weekly: number
    monthly: number
    yearly: number
}

export interface RetentionSettings {
    type: RetentionPolicyType
    count: number
    days: number
    gfs: GFSSettings
}

type BackupRetentionSettingsProps = {
    database: DbSchema,
}


export function BackupRetentionSettings({database}: BackupRetentionSettingsProps) {
    const [settings, setSettings] = useState<RetentionSettings>({
        type: "gfs",
        count: 7,
        days: 30,
        gfs: {
            daily: 7,
            weekly: 4,
            monthly: 12,
            yearly: 3,
        },
    })
    const queryClient = useQueryClient()

    const updateRetentionPolicy = useMutation({
        mutationFn: async (payload: RetentionSettings) => await updateOrCreateBackupRetentionPolicyAction({
            databaseId: database.id,
            settings: payload
        }),
        onSuccess: () => {
            toast.success("Retention policy updated successfully.")
            queryClient.invalidateQueries({queryKey: ["database-data", database.id]})
        },
        onError: () => {
            toast.error("An error occurred while updating retention policy.")
        },
    })

    const handleSave = () => {
        updateRetentionPolicy.mutate(settings)
    }
    const calculateTotalFiles = () => {
        if (settings.type === "gfs") {
            return settings.gfs.daily + settings.gfs.weekly + settings.gfs.monthly + settings.gfs.yearly
        }
        return settings.type === "count" ? settings.count : Math.ceil(settings.days / 1) // Assuming daily backups
    }

    const getStorageEstimate = () => {
        const totalFiles = calculateTotalFiles()
        if (totalFiles <= 10) return "Low"
        if (totalFiles <= 30) return "Medium"
        return "High"
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col">

                <div className="px-3 space-y-6">
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Retention Policy Type</Label>
                        <RadioGroup
                            value={settings.type}
                            onValueChange={(value: RetentionPolicyType) => setSettings((prev) => ({
                                ...prev,
                                type: value
                            }))}
                            className="grid grid-cols-1 gap-4"
                        >
                            <div
                                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="count" id="count"/>
                                <div className="flex-1">
                                    <Label htmlFor="count" className="font-medium cursor-pointer">
                                        Keep last N backups
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Simple count-based retention (e.g., keep last 10 backups)
                                    </p>
                                </div>
                            </div>

                            <div
                                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="days" id="days"/>
                                <div className="flex-1">
                                    <Label htmlFor="days" className="font-medium cursor-pointer">
                                        Keep backups for X days
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Time-based retention (e.g., keep
                                        backups for 30 days)</p>
                                </div>
                            </div>

                            <div
                                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors bg-accent/5">
                                <RadioGroupItem value="gfs" id="gfs"/>
                                <div className="flex-1">
                                    <Label htmlFor="gfs" className="font-medium cursor-pointer flex items-center gap-2">
                                        GFS Rotation
                                        <Badge variant="secondary" className="text-xs">
                                            Recommended
                                        </Badge>
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Grandfather-Father-Son rotation for enterprise/critical systems
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator/>

                    {settings.type === "count" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-muted-foreground"/>
                                <Label className="font-medium">Count-Based Configuration</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="backup-count">Number of backups to keep</Label>
                                <Input
                                    id="backup-count"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={settings.count}
                                    onChange={(e) => setSettings((prev) => ({
                                        ...prev,
                                        count: Number.parseInt(e.target.value) || 1
                                    }))}
                                    className="w-32"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Older backups beyond this count will be automatically deleted
                                </p>
                            </div>
                        </div>
                    )}

                    {settings.type === "days" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground"/>
                                <Label className="font-medium">Time-Based Configuration</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="retention-days">Retention period (days)</Label>
                                <Input
                                    id="retention-days"
                                    type="number"
                                    min="1"
                                    max="3650"
                                    value={settings.days}
                                    onChange={(e) => setSettings((prev) => ({
                                        ...prev,
                                        days: Number.parseInt(e.target.value) || 1
                                    }))}
                                    className="w-32"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Backups older than {settings.days} days will be automatically deleted
                                </p>
                            </div>
                        </div>
                    )}

                    {settings.type === "gfs" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-muted-foreground"/>
                                <Label className="font-medium">GFS Rotation Configuration</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="daily-backups">Daily backups</Label>
                                    <Input
                                        id="daily-backups"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={settings.gfs.daily}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                gfs: {...prev.gfs, daily: Number.parseInt(e.target.value) || 1},
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">Keep last N daily backups</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="weekly-backups">Weekly backups</Label>
                                    <Input
                                        id="weekly-backups"
                                        type="number"
                                        min="0"
                                        max="52"
                                        value={settings.gfs.weekly}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                gfs: {...prev.gfs, weekly: Number.parseInt(e.target.value) || 0},
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">Keep N weekly backups</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="monthly-backups">Monthly backups</Label>
                                    <Input
                                        id="monthly-backups"
                                        type="number"
                                        min="0"
                                        max="120"
                                        value={settings.gfs.monthly}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                gfs: {...prev.gfs, monthly: Number.parseInt(e.target.value) || 0},
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">Keep N monthly backups</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="yearly-backups">Yearly backups</Label>
                                    <Input
                                        id="yearly-backups"
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={settings.gfs.yearly}
                                        onChange={(e) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                gfs: {...prev.gfs, yearly: Number.parseInt(e.target.value) || 0},
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">Keep N yearly backups</p>
                                </div>
                            </div>

                            <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-sm font-medium mb-1">GFS Strategy Benefits:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Balanced storage usage with long-term retention</li>
                                    <li>• Automatic promotion of backups (daily → weekly → monthly → yearly)</li>
                                    <li>• Industry standard for enterprise backup systems</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <Separator/>

                    <div className="rounded-lg border p-4 space-y-3 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                <span className="font-medium">Storage Impact Summary</span>
                            </div>
                            <Badge
                                variant={
                                    getStorageEstimate() === "Low"
                                        ? "default"
                                        : getStorageEstimate() === "Medium"
                                            ? "secondary"
                                            : "destructive"
                                }
                            >
                                {getStorageEstimate()} Usage
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Estimated files per database:</span>
                                <p className="font-medium">{calculateTotalFiles()} backup files</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Policy type:</span>
                                <p className="font-medium capitalize">
                                    {settings.type === "gfs" ? "GFS Rotation" : settings.type === "count" ? "Count-based" : "Time-based"}
                                </p>
                            </div>
                        </div>

                        {settings.type === "gfs" && (
                            <div
                                className="text-xs text-muted-foreground bg-accent/10 p-2 rounded border border-accent/20">
                                <strong>Note:</strong> With GFS rotation, you'll have
                                approximately {calculateTotalFiles()} files per
                                database per year, providing excellent long-term retention with optimized storage usage.
                            </div>
                        )}
                    </div>

                    <Button onClick={handleSave} disabled={updateRetentionPolicy.isPending} className="w-full">
                        <Save className="h-4 w-4 mr-2"/>
                        {updateRetentionPolicy.isPending ? "Saving Policy..." : "Save Retention Policy"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
