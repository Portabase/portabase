export interface GitHubRelease {
    tag_name: string;
    html_url: string;
    prerelease: boolean;
    name: string;
    body: string;
}

type ParsedVersion = {
    major: number;
    minor: number;
    patch: number;
    rc?: number;
};

function parseVersion(version: string): ParsedVersion {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$/);
    if (!match) return {
        major: 0,
        minor: 0,
        patch: 0,
        rc: undefined,
    };

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        rc: match[4] ? Number(match[4]) : undefined,
    };
}

export const getNewRelease = async (currentVersion: string): Promise<GitHubRelease | null> => {
    try {
        const response = await fetch("https://api.github.com/repos/Portabase/portabase/releases");
        if (!response.ok) {
            return null;
        }

        const releases: GitHubRelease[] = await response.json();

        const isStable = /^\d+\.\d+\.\d+$/.test(currentVersion);
        const isRc = /^\d+\.\d+\.\d+-rc\.\d+$/.test(currentVersion);

        console.log("isStable", isStable)
        console.log("isRc", isRc)


        const currentParsedVersion = parseVersion(currentVersion)

        const latestStableVersion = releases.find(r => !r.prerelease)
        const latestRcVersion = releases.find(r => r.name.includes("rc"))!

        if (isRc) {
            if (!latestRcVersion) return null
            const latestRcParsedVersion = parseVersion(latestRcVersion.name)
            if (currentParsedVersion.major < latestRcParsedVersion.major) return latestRcVersion;
            if (currentParsedVersion.minor < latestRcParsedVersion.minor) return latestRcVersion;
            if (currentParsedVersion.patch < latestRcParsedVersion.patch) return latestRcVersion;
            if (currentParsedVersion.rc! < latestRcParsedVersion.rc!) return latestRcVersion;

            if (!latestStableVersion) return null
            const latestStableParsedVersion = parseVersion(latestStableVersion.name)
            if (currentParsedVersion.major < latestStableParsedVersion.major) return latestStableVersion;
            if (currentParsedVersion.minor < latestStableParsedVersion.minor) return latestStableVersion;
            if (currentParsedVersion.patch < latestStableParsedVersion.patch) return latestStableVersion;

            return null;

        } else if (isStable) {
            if (!latestStableVersion) return null
            const latestStableParsedVersion = parseVersion(latestStableVersion.name)
            if (currentParsedVersion.major < latestStableParsedVersion.major) return latestStableVersion;
            if (currentParsedVersion.minor < latestStableParsedVersion.minor) return latestStableVersion;
            if (currentParsedVersion.patch < latestStableParsedVersion.patch) return latestStableVersion;

            return null;
        }

        return null;

    } catch (error) {
        console.error("Failed to fetch latest release", error);
        return null;
    }
};
