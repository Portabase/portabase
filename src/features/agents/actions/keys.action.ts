"use server"
import {superAdminAction} from "@/lib/safe-actions/actions";
import {getMasterServerKeyContent} from "@/features/agents/utils/keys.server";

export const downloadMasterKeyAction = superAdminAction.action(async () => {
    try {
        const fileBuffer = await getMasterServerKeyContent();
        return {
            success: true,
            data: fileBuffer.toString("base64"),
        };
    } catch (error) {
        return {
            success: false,
            message: "Unable to download master key",
        };
    }
});
