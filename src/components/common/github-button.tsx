'use client';

import {GithubButton} from "@/components/ui/github-button";
import * as React from "react";
import {useEffect} from "react";

export const GitHubStarsButtonCustom = () => {

    const [stars, setStars] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);

    const username = "Portabase"
    const repo = "portabase"


    useEffect(() => {
        fetch(`https://api.github.com/repos/${username}/${repo}`)
            .then((response) => response.json())
            .then((data) => {
                if (data && typeof data.stargazers_count === 'number') {
                    setStars(data.stargazers_count);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [username, repo]);

    if (isLoading) return null;



    return (
        <div className=" gap-4 flex-wrap hidden md:block">
            <GithubButton
                initialStars={0}
                targetStars={stars}
                label=""
                size="sm"
                separator={true}
                roundStars={true}
                repoUrl={`https://github.com/${username}/${repo}`}
                variant="outline"
            />
        </div>
    );
};
export default GitHubStarsButtonCustom;