export type SignUpUser = {
    name: string
    email: string
    password: string
    callbackURL?: string
    role?: string
    theme: string
    emailVerified?: boolean
}


export type BetterAuthError = {
    code?: string;
    message?: string;
    status: number;
    statusText: string;
};