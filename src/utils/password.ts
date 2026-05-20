export function generateValidPassword(length = 12) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '#?!@$%^&*-';
    const all = upper + lower + numbers + special;

    const getRandomChar = (set: string) => set[Math.floor(Math.random() * set.length)];

    const passwordChars = [
        getRandomChar(upper),
        getRandomChar(lower),
        getRandomChar(numbers),
        getRandomChar(special),
    ];

    for (let i = passwordChars.length; i < length; i++) {
        passwordChars.push(getRandomChar(all));
    }

    for (let i = passwordChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    return passwordChars.join('');
}


export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
    score: number;
}

const PASSWORD_RULES = [
    {
        key: "minLength",
        regex: /.{8,}/,
        message: "Password must contain at least 8 characters",
    },
    {
        key: "number",
        regex: /[0-9]/,
        message: "Password must contain at least 1 number",
    },
    {
        key: "lowercase",
        regex: /[a-z]/,
        message: "Password must contain at least 1 lowercase letter",
    },
    {
        key: "uppercase",
        regex: /[A-Z]/,
        message: "Password must contain at least 1 uppercase letter",
    },
    {
        key: "specialChar",
        regex: /[^a-zA-Z0-9]/,
        message: "Password must contain at least 1 special character",
    },
];

export function validatePassword(
    password: string,
): PasswordValidationResult {
    const failedRules = PASSWORD_RULES.filter(
        (rule) => !rule.regex.test(password),
    );

    return {
        valid: failedRules.length === 0,
        errors: failedRules.map((r) => r.message),
        score: PASSWORD_RULES.length - failedRules.length,
    };
}

export function assertValidPassword(password: string) {
    const result = validatePassword(password);

    if (!result.valid) {
        throw new Error(result.errors.join(", "));
    }
}