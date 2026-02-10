import type {NextConfig} from "next";
import {PORTABASE_DEFAULT_SETTINGS} from "./portabase.config";


function buildCSPHeader(): string {
    const {CSP} = PORTABASE_DEFAULT_SETTINGS.SECURITY;

    const directives = [
        `default-src ${CSP.DEFAULT_SRC.join(" ")}`,
        `script-src ${CSP.SCRIPT_SRC.join(" ")}`,
        `style-src ${CSP.STYLE_SRC.join(" ")}`,
        `img-src ${CSP.IMG_SRC.join(" ")}`,
        `font-src ${CSP.FONT_SRC.join(" ")}`,
        `object-src ${CSP.OBJECT_SRC.join(" ")}`,
        `connect-src ${CSP.CONNECT_SRC.join(" ")}`,
        `base-uri ${CSP.BASE_URI.join(" ")}`,
        `form-action ${CSP.FORM_ACTION.join(" ")}`,
        `frame-ancestors ${CSP.FRAME_ANCESTORS.join(" ")}`,
    ];

    if (CSP.BLOCK_ALL_MIXED_CONTENT) {
        directives.push("block-all-mixed-content");
    }

    if (CSP.UPGRADE_INSECURE_REQUESTS) {
        directives.push("upgrade-insecure-requests");
    }

    return directives.join("; ");
}

function buildPermissionsPolicy(): string {
    return Object.entries(PORTABASE_DEFAULT_SETTINGS.SECURITY.PERMISSIONS_POLICY)
        .map(([feature, values]) => `${feature.toLowerCase()}=${values.join(", ")}`)
        .join(", ");
}


const nextConfig: NextConfig = {
    output: "standalone",
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "10gb",
        },
        proxyClientMaxBodySize: '10gb',
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: buildCSPHeader(),
                    },
                    {
                        key: "Permissions-Policy",
                        value: buildPermissionsPolicy(),
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    }
                    // ...other security headers
                ],
            },
        ];
    },
};

export default nextConfig;
