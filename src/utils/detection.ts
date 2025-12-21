import { Smartphone, Laptop, type LucideIcon } from "lucide-react";

interface DeviceDetails {
    os: string;
    browser: string;
    isMobile: boolean;
    Icon: LucideIcon;
    deviceType: "Mobile" | "Desktop";
}

export const getDeviceDetails = (userAgent: string | undefined | null): DeviceDetails => {
    const ua = (userAgent || "").toLowerCase();

    const isMobile = /mobile|iphone|android/.test(ua);

    const os = /mac os/.test(ua)
        ? "macOS"
        : /windows/.test(ua)
          ? "Windows"
          : /linux/.test(ua)
            ? "Linux"
            : /android/.test(ua)
              ? "Android"
              : /ios/.test(ua)
                ? "iOS"
                : "Unknown OS";

    const browser = /chrome/.test(ua) ? "Chrome" : /firefox/.test(ua) ? "Firefox" : /safari/.test(ua) ? "Safari" : /edg/.test(ua) ? "Edge" : "Browser";

    return {
        os,
        browser,
        isMobile,
        deviceType: isMobile ? "Mobile" : "Desktop",
        Icon: isMobile ? Smartphone : Laptop,
    };
};
