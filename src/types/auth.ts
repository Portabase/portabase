
export type SignUpUser = {
    name: string
    email: string
    password: string
    callbackURL?: string
    theme: string
    isDefaultPassword: boolean
}


export type BetterAuthError = {
    code?: string;
    message?: string;
    status: number;
    statusText: string;
};