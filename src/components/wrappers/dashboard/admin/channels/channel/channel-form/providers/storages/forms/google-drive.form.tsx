// import {UseFormReturn} from "react-hook-form";
// import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
// import {Input} from "@/components/ui/input";
// import {Separator} from "@/components/ui/separator";
//
//
// type StorageGoogleDriveFormProps = {
//     form: UseFormReturn<any, any, any>
// }
//
//
// export const StorageGoogleDriveForm = ({form}: StorageGoogleDriveFormProps) => {
//     return (
//         <>
//             <Separator className="my-1"/>
//             <FormField
//                 control={form.control}
//                 name="config.clientEmail"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Client Email</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="xxx@xxx.iam.gserviceaccount.com"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//             <FormField
//                 control={form.control}
//                 name="config.privateKey"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Private Key</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="xxxxxxxxxxxx"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//             <FormField
//                 control={form.control}
//                 name="config.folderId"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Folder Id</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="xxxxxxxxxxxx"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//
//         </>
//     )
// }

// "use client";
//
// import {UseFormReturn} from "react-hook-form";
// import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
// import {Input} from "@/components/ui/input";
// import {Separator} from "@/components/ui/separator";
// import {Button} from "@/components/ui/button";
// import {getServerUrl} from "@/utils/get-server-url";
//
// type StorageGoogleDriveFormProps = {
//     form: UseFormReturn<any, any, any>
// };
//
// export const StorageGoogleDriveForm = ({form}: StorageGoogleDriveFormProps) => {
//     const handleConnect = async () => {
//         const clientId = form.getValues("config.clientId");
//         // const baseUrl = getServerUrl();
//         // const redirectUri = form.getValues("config.redirectUri") || "http://localhost:3000/oauth2callback";
//         const redirectUri = "http://localhost:8887/dashboard/storages/channels";
//
//         if (!clientId) {
//             alert("Please fill in Client ID first");
//             return;
//         }
//
//         // Construct Google OAuth URL
//         const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
//         const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
//
//         // Open consent screen in a new tab
//         window.open(url, "_blank");
//     };
//
//     return (
//         <>
//             <Separator className="my-1"/>
//
//             {/* Client ID */}
//             <FormField
//                 control={form.control}
//                 name="config.clientId"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Client ID</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="XXXX.apps.googleusercontent.com"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//
//             {/* Client Secret */}
//             <FormField
//                 control={form.control}
//                 name="config.clientSecret"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Client Secret</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="XXXXXXXXXXXX"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//
//             {/* Redirect URI */}
//             <FormField
//                 control={form.control}
//                 name="config.redirectUri"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Redirect URI</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="http://localhost:3000/oauth2callback"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//
//             {/* Refresh Token */}
//             <FormField
//                 control={form.control}
//                 name="config.refreshToken"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Refresh Token</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="Paste refresh token here"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//
//             {/* Folder ID */}
//             <FormField
//                 control={form.control}
//                 name="config.folderId"
//                 render={({field}) => (
//                     <FormItem>
//                         <FormLabel>Folder ID</FormLabel>
//                         <FormControl>
//                             <Input {...field} placeholder="XXXXXXXXXXXXXXXXXXXX"/>
//                         </FormControl>
//                         <FormMessage/>
//                     </FormItem>
//                 )}
//             />
//
//             <FormField
//                 control={form.control}
//                 name="oauth.connect"
//                 render={() => (
//                     <FormItem>
//                         <FormLabel>OAuth2 Connect</FormLabel>
//                         <FormControl>
//                             <Button type="button" onClick={handleConnect}>
//                                 Connect Google Drive
//                             </Button>
//                         </FormControl>
//                         <FormMessage>
//                             Clicking this will open Google’s consent screen. After granting access, copy the authorization code and exchange it for a refresh token in your backend.
//                         </FormMessage>
//                     </FormItem>
//                 )}
//             />
//         </>
//     );
// };
//
"use client";

import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import {
    googleDriveRefreshTokenAction
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/storages/forms/google-drive/helpers";

type StorageGoogleDriveFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const StorageGoogleDriveForm = ({form}: StorageGoogleDriveFormProps) => {
    const handleConnect = () => {
        const clientId = form.getValues("config.clientId");
        const redirectUri = form.getValues("config.redirectUri") || `${window.location.origin}/api/google/drive/callback`;

        if (!clientId) {
            alert("Please fill in Client ID first");
            return;
        }

        const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

        // Open OAuth in a new tab
        const oauthWindow = window.open(oauthUrl, "_blank", "width=500,height=600");

        // Poll the window for the refresh token (after the redirect)
        const interval = setInterval(async () => {
            try {
                if (!oauthWindow || oauthWindow.closed) {
                    clearInterval(interval);
                    return;
                }

                // Check if redirected to your server callback
                if (oauthWindow.location.href.startsWith(`${window.location.origin}/api/google/drive/callback`)) {
                    const params = new URL(oauthWindow.location.href).searchParams;
                    const code = params.get("code");
                    console.log(code)
                    if (code) {

                        const clientId = form.getValues("config.clientId");
                        const clientSecret = form.getValues("config.clientSecret");
                        const redirectUri =
                            form.getValues("config.redirectUri") ||
                            `${window.location.origin}/api/google/drive/callback`;

                        // Exchange code for refresh token
                        const data = await googleDriveRefreshTokenAction({
                            code: code,
                            clientId: clientId,
                            clientSecret: clientSecret,
                            redirectUri: redirectUri,
                        })

                        if (data.data.refreshToken) {
                            console.log(data.data.refreshToken)
                            form.setValue("config.refreshToken", data.data.refreshToken); // auto-update the field
                        }

                        oauthWindow.close();
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                // ignore cross-origin errors until redirect happens
            }
        }, 500);
    };


    return (
        <>
            <Separator className="my-1"/>

            {/* Client ID */}
            <FormField
                control={form.control}
                name="config.clientId"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="XXXX.apps.googleusercontent.com"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            {/* Client Secret */}
            <FormField
                control={form.control}
                name="config.clientSecret"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="XXXXXXXXXXXX"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            {/* Redirect URI */}
            <FormField
                control={form.control}
                name="config.redirectUri"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Redirect URI</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="http://localhost:3000/api/google-drive/callback"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            {/* Refresh Token */}

            {/*<FormField*/}
            {/*    control={form.control}*/}
            {/*    name="config.refreshToken"*/}
            {/*    render={({field}) => (*/}
            {/*        <FormItem>*/}
            {/*            <FormLabel>Refresh Token</FormLabel>*/}
            {/*            <FormControl>*/}
            {/*                <Input {...field} placeholder="Will be filled after OAuth flow"/>*/}
            {/*            </FormControl>*/}
            {/*            <FormMessage/>*/}
            {/*        </FormItem>*/}
            {/*    )}*/}
            {/*/>*/}

            {/* Folder ID */}
            <FormField
                control={form.control}
                name="config.folderId"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Folder ID</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="XXXXXXXXXXXXXXXXXXXX"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.refreshToken"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Refresh Token</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Will be filled after OAuth flow" readOnly />
                        </FormControl>
                        <FormMessage>
                            The refresh token will automatically appear here after connecting.
                        </FormMessage>
                    </FormItem>
                )}
            />

            <Button type="button" onClick={handleConnect}> Connect Google Drive </Button>
        </>
    );
};
