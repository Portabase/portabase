import * as pty from "node-pty";

type InteractiveStep = {
    match: RegExp;
    reply: string;
};

function normalizeOutput(output: string) {
    return output.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "");
}

/**
 * Run an interactive CLI command and answer prompts in sequence.
 * Entry point:
 * - `command` is the full CLI command executed in the PTY.
 * - `cwd` is the local workspace where the command is launched.
 * - `steps` defines which prompt text is matched and which reply is sent.
 * - `timeoutMs` controls when the command is aborted if it stalls.
 * Executes from: not page-bound; runs from a local test workspace on the Node.js side.
 */
export async function runInteractiveCommand(
    command: string,
    cwd: string,
    steps: InteractiveStep[],
    timeoutMs: number = 120_000,
) {
    await new Promise<void>((resolve, reject) => {
        const child = pty.spawn("sh", ["-lc", command], {
            cwd,
            env: {
                ...process.env,
                TERM: "xterm-256color",
            },
            cols: 120,
            rows: 30,
        });

        let currentStep = 0;
        let output = "";
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error(`Interactive command timed out.\n\nCommand: ${command}\n\nOutput:\n${normalizeOutput(output)}`));
        }, timeoutMs);

        const handleChunk = (chunk: string) => {
            output += chunk;
            const normalizedOutput = normalizeOutput(output);

            while (currentStep < steps.length && steps[currentStep].match.test(normalizedOutput)) {
                child.write(steps[currentStep].reply);
                currentStep += 1;
            }
        };

        child.onData(handleChunk);
        child.onExit(({exitCode}) => {
            clearTimeout(timer);
            if (exitCode === 0) {
                resolve();
                return;
            }

            reject(new Error(`Interactive command failed with exit code ${exitCode}.\n\nCommand: ${command}\n\nOutput:\n${normalizeOutput(output)}`));
        });
    });
}

/**
 * Create and configure a Portabase agent with two Docker-backed databases.
 * Entry point:
 * - `command` is the CLI setup command copied from the agent details page.
 * - `cwd` is the local workspace where the agent is installed.
 * - this helper answers the wizard for PostgreSQL first, then MariaDB.
 * Executes from: not page-bound; runs from a local test workspace on the Node.js side.
 */
export async function createAgentWithDockerDatabases(command: string, cwd: string) {
    await runInteractiveCommand(command, cwd, [
        {
            match: /configure.*database|add.*database/i,
            reply: "y\n",
        },
        {
            match: /docker.*new local container|manual.*external|external.*existing/i,
            reply: "\r",
        },
        {
            match: /postgresql|mariadb/i,
            reply: "\r",
        },
        {
            match: /another.*database|add.*another|configure.*another/i,
            reply: "y\n",
        },
        {
            match: /docker.*new local container|manual.*external|external.*existing/i,
            reply: "\r",
        },
        {
            match: /postgresql|mariadb/i,
            reply: "\u001B[B\r",
        },
        {
            match: /another.*database|add.*another|configure.*another/i,
            reply: "n\n",
        },
    ]);
}
