import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import {Database, Ruler} from "lucide-react";
import {DatabaseWith as DbSchema, RetentionPolicy} from "@/db/schema/07_database";
import {
    BackupRetentionSettingsForm
} from "@/features/database/retention-policy-form";

type RetentionPolicySheetProps = {
    database: DbSchema
}

export const RetentionPolicySheet = ({database}: RetentionPolicySheetProps) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Ruler />
                </Button>
            </SheetTrigger>
            <SheetContent
                className="flex gap-4 p-4 w-full md:w-[800px] max-w-[800px] max-h-screen overflow-y-scroll"
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-balance">
                        <Database className="h-5 w-5"/>
                        Backup Retention Policy
                    </SheetTitle>
                    <SheetDescription className="text-pretty">
                        Configure how long to keep your .dump backup files. Choose from simple count-based, time-based,
                        or
                        enterprise GFS rotation strategies.
                    </SheetDescription>
                </SheetHeader>
                {database.backupPolicy !== null ?
                    <BackupRetentionSettingsForm database={database}
                                                 defaultValues={database.retentionPolicy as RetentionPolicy}/>
                    :
                    <div
                        className="flex flex-col items-center justify-center text-center py-12 gap-4 border  rounded-lg">
                        <p className="text-muted-foreground">
                            No backup policy configured yet. Please configure one !
                        </p>
                    </div>
                }
            </SheetContent>
        </Sheet>
    )
}