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
    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$/);
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

const findLatestVersion = (currentVersion: string, releases: GitHubRelease[]): GitHubRelease | null => {
    const cleanCurrentVersion = currentVersion.replace(/^v/, "");
    const isStable = /^\d+\.\d+\.\d+$/.test(cleanCurrentVersion);
    const isRc = /^\d+\.\d+\.\d+-rc\.\d+$/.test(cleanCurrentVersion);

    const currentParsedVersion = parseVersion(cleanCurrentVersion);
    
    if (isRc) {
        const latestStableVersion = releases.find(r => !r.prerelease);
        const latestRcVersion = releases.find(r => r.prerelease && (r.tag_name.includes("rc") || (r.name && r.name.includes("rc"))));

        if (latestStableVersion) {
            const versionStr = latestStableVersion.tag_name || latestStableVersion.name;
            const latestStableParsedVersion = parseVersion(versionStr);
            if (latestStableParsedVersion.major > currentParsedVersion.major) return latestStableVersion;
            if (latestStableParsedVersion.major === currentParsedVersion.major && latestStableParsedVersion.minor > currentParsedVersion.minor) return latestStableVersion;
            if (latestStableParsedVersion.major === currentParsedVersion.major && latestStableParsedVersion.minor === currentParsedVersion.minor && latestStableParsedVersion.patch >= currentParsedVersion.patch) return latestStableVersion;
        }

        if (latestRcVersion) {
            const versionStr = latestRcVersion.tag_name || latestRcVersion.name;
            const latestRcParsedVersion = parseVersion(versionStr);
            if (latestRcParsedVersion.major > currentParsedVersion.major) return latestRcVersion;
            if (latestRcParsedVersion.major === currentParsedVersion.major && latestRcParsedVersion.minor > currentParsedVersion.minor) return latestRcVersion;
            if (latestRcParsedVersion.major === currentParsedVersion.major && latestRcParsedVersion.minor === currentParsedVersion.minor && latestRcParsedVersion.patch > currentParsedVersion.patch) return latestRcVersion;
            if (latestRcParsedVersion.major === currentParsedVersion.major && latestRcParsedVersion.minor === currentParsedVersion.minor && latestRcParsedVersion.patch === currentParsedVersion.patch && 
                latestRcParsedVersion.rc !== undefined && currentParsedVersion.rc !== undefined && latestRcParsedVersion.rc > currentParsedVersion.rc) return latestRcVersion;
        }
    } else if (isStable) {
        const latestStableVersion = releases.find(r => !r.prerelease);
        if (latestStableVersion) {
            const versionStr = latestStableVersion.tag_name || latestStableVersion.name;
            const latestStableParsedVersion = parseVersion(versionStr);
            
            if (latestStableParsedVersion.major > currentParsedVersion.major) return latestStableVersion;
            if (latestStableParsedVersion.major === currentParsedVersion.major && latestStableParsedVersion.minor > currentParsedVersion.minor) return latestStableVersion;
            if (latestStableParsedVersion.major === currentParsedVersion.major && latestStableParsedVersion.minor === currentParsedVersion.minor && latestStableParsedVersion.patch > currentParsedVersion.patch) return latestStableVersion;
        }
    }

    return null;
};

export const getNewRelease = async (currentVersion: string): Promise<GitHubRelease | null> => {
    try {
        const response = await fetch("https://api.github.com/repos/Portabase/portabase/releases");
        if (!response.ok) {
            return null;
        }

        const releases: GitHubRelease[] = await response.json();
        return findLatestVersion(currentVersion, releases);

    } catch (error) {
        console.error("Failed to fetch latest release", error);
        return null;
    }
};

export const getNewAgentRelease = async (currentVersion: string): Promise<GitHubRelease | null> => {
    try {
        const response = await fetch("https://api.github.com/repos/Portabase/agent-rust/releases", {
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            return null;
        }

        const releases: GitHubRelease[] = await response.json();
        return findLatestVersion(currentVersion, releases);

    } catch (error) {
        console.error("Failed to fetch latest agent release", error);
        return null;
    }
};