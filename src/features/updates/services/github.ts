export interface GitHubRelease {
    tag_name: string;
    html_url: string;
    prerelease: boolean;
    name: string;
    body: string;
}

export const getLatestRelease = async (channel: "stable" | "beta" | "rc" = "stable"): Promise<GitHubRelease | null> => {
    try {
        const response = await fetch("https://api.github.com/repos/Portabase/portabase/releases");
        if (!response.ok) {
            return null;
        }
        const releases: GitHubRelease[] = await response.json();

        if (channel === "stable") {
            return releases.find(r => !r.prerelease) || null;
        }

        if (channel === "beta") {
            return releases.find(r => r.tag_name.includes("beta") || !r.prerelease) || null;
        }

        if (channel === "rc") {
            return releases.find(r => r.tag_name.includes("rc") || !r.prerelease) || null;
        }

        return releases[0] || null;
    } catch (error) {
        console.error("Failed to fetch latest release", error);
        return null;
    }
};
