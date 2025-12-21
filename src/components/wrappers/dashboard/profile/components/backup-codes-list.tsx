"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { humanReadableDate } from "@/utils/date-formatting";

type BackupCodesListProps = {
    codes: string[];
    className?: string;
};

export function BackupCodesList({ codes, className }: BackupCodesListProps) {

    const handleCopyBackupCodes = () => {
        navigator.clipboard.writeText(codes.join("\n"));
        toast.success("Backup codes copied to clipboard");
    };

    if (!codes.length) return null;

    const handleDownload = () => {
        const header ="Your Backup Codes" + "\n\n";
        const content = `Backup Code: ${codes.join("\n")}`;
        const footer = "\n\n" + `Keep these codes in a safe place. They can be used to access your account if you lose access to your authentication device. Generated on ${humanReadableDate(new Date())}.`;
        const text = header + content + footer;

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-codes.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Backup codes downloaded");
    };



    return (
        <div className={`space-y-4 ${className}`}>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Your Backup Codes</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={handleCopyBackupCodes} className="h-8 text-xs">
                        <Copy className="h-3 w-3 mr-2" />
                        Copy All Codes
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm border">
                    {codes.map((code, i) => (
                        <div key={i} className="text-center tracking-wider">
                            {code}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                    <span>
                        These codes can only be used once. After using a code, make sure to generate new backup codes to maintain account security.
                    </span>
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={handleDownload} className="h-8 text-xs">
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup Codes
                </Button>
            </div>
        </div>
    );
}
