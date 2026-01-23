
// export type GoogleDriveConfig = {
//     clientEmail: string;
//     privateKey: string;
//     folderId: string;
// };


export type GoogleDriveConfig = {
    clientId: string;
    clientSecret: string;
    refreshToken: string; // from OAuth flow
    // redirectUri: string;   // e.g., http://localhost:3000/oauth2callback
    folderId: string;      // target folder in your Drive
};