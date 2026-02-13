export const PORTABASE_DEFAULT_SETTINGS = {
    SECURITY: {
        CSP: {
            DEFAULT_SRC: ["'self'"],
            SCRIPT_SRC: [
                "'self'",
                "'unsafe-eval'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://www.googletagmanager.com",
                "https://code.iconify.design",
                "https://code.iconify.com",
                "https://cdn.iconify.design",
                "https://api.iconify.design",

            ],
            STYLE_SRC: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://code.iconify.design",
                "https://cdn.iconify.design",
                "https://code.iconify.com",
            ],
            IMG_SRC: [
                "'self'",
                "blob:",
                "data:",
                "https:",
                "https://code.iconify.design",
                "https://cdn.iconify.design",
                "https://code.iconify.com",
                "https://api.iconify.design",
                "http://localhost:9000",
            ],
            FONT_SRC: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdn.iconify.design",
            ],
            CONNECT_SRC: [
                "'self'",
                "https://api.iconify.design",
                "https://code.iconify.design",
                "https://api.github.com",

            ],
            OBJECT_SRC: ["'none'"],
            BASE_URI: ["'self'"],
            FORM_ACTION: ["'self'"],
            FRAME_ANCESTORS: ["'none'"],
            BLOCK_ALL_MIXED_CONTENT: false,
            UPGRADE_INSECURE_REQUESTS: true,
        },
        PERMISSIONS_POLICY: {
            CAMERA: ["()"],
            MICROPHONE: ["()"],
            GEOLOCATION: ["()"],
            FULLSCREEN: ["(self)"],
            // ...other features
        },
    },
};
