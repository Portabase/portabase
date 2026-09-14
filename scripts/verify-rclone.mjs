#!/usr/bin/env node
import assert from "node:assert";
import path from "node:path";
import {spawnSync} from "node:child_process";

if (!process.execArgv.includes("--experimental-strip-types") && !process.env.VERIFY_RCLONE_RESPAWNED) {
    const result = spawnSync(
        process.execPath,
        ["--experimental-strip-types", "--no-warnings", process.argv[1], ...process.argv.slice(2)],
        {stdio: "inherit", env: {...process.env, VERIFY_RCLONE_RESPAWNED: "1"}},
    );
    process.exit(result.status ?? 1);
}

const {parseRemoteNames, findBlockedBackend} = await import(
    "../src/features/channel/components/storages/rclone/rclone.parse.ts"
);


function target(config, filePath) {
    const base = (config.remotePath ?? "").trim().replace(/^\/+|\/+$/g, "");
    return base
        ? `${config.remoteName}:${base}/${filePath}`
        : `${config.remoteName}:${filePath}`;
}

function statFound(stat, remotePath) {
    if (stat.code !== 0) return false;

    let parsed;
    try {
        parsed = JSON.parse(stat.stdout.toString());
    } catch {
        return false;
    }

    if (typeof parsed !== "object" || parsed === null) return false;
    const {IsDir, Name} = parsed;
    const expected = path.basename(remotePath.split(":").pop() ?? remotePath);
    return IsDir === false && Name === expected;
}


const checks = [];
function check(name, fn) {
    checks.push({name, fn});
}

const S3_SECTION = "[minio]\ntype = s3\nprovider = Minio\naccess_key_id = x\nsecret_access_key = y\n";

check("parseRemoteNames: single-section config", () => {
    assert.deepStrictEqual(parseRemoteNames(S3_SECTION), ["minio"]);
});

check("parseRemoteNames: chained crypt-over-s3 config", () => {
    const cfg = `[secret]\ntype = crypt\nremote = minio:bucket\n\n${S3_SECTION}`;
    assert.deepStrictEqual(parseRemoteNames(cfg), ["secret", "minio"]);
});

check("findBlockedBackend: catches local", () => {
    const cfg = "[disk]\ntype = local\n";
    assert.deepStrictEqual(findBlockedBackend(cfg), {remote: "disk", type: "local"});
});

check("findBlockedBackend: catches alias", () => {
    const cfg = "[shortcut]\ntype = alias\nremote = other:path\n";
    assert.deepStrictEqual(findBlockedBackend(cfg), {remote: "shortcut", type: "alias"});
});

check("findBlockedBackend: catches a blocked backend in a section that is not the named one", () => {
    const cfg = `${S3_SECTION}\n[disk]\ntype = local\n`;
    assert.deepStrictEqual(findBlockedBackend(cfg), {remote: "disk", type: "local"});
});

check("findBlockedBackend: catches a wrapping backend pointing at a bare local path", () => {
    for (const backend of ["crypt", "chunker", "compress", "union", "combine", "hasher"]) {
        const cfg = `[sneaky]\ntype = ${backend}\nremote = /etc\n`;
        assert.deepStrictEqual(
            findBlockedBackend(cfg),
            {remote: "sneaky", type: backend},
            `${backend} must be rejected`,
        );
    }
});

check("findBlockedBackend: catches backends that cannot hold a backup", () => {
    for (const backend of ["memory", "http", "googlephotos"]) {
        const cfg = `[nope]\ntype = ${backend}\n`;
        assert.deepStrictEqual(
            findBlockedBackend(cfg),
            {remote: "nope", type: backend},
            `${backend} must be rejected`,
        );
    }
});

check("findBlockedBackend: null for a clean s3 config", () => {
    assert.strictEqual(findBlockedBackend(S3_SECTION), null);
});

check("target(): empty remotePath", () => {
    assert.strictEqual(target({remoteName: "r", remotePath: ""}, "a/b.bin"), "r:a/b.bin");
});

check("target(): one-segment prefix", () => {
    assert.strictEqual(target({remoteName: "r", remotePath: "my-bucket"}, "a/b.bin"), "r:my-bucket/a/b.bin");
});

check("target(): slash-padded prefix", () => {
    assert.strictEqual(target({remoteName: "r", remotePath: "/my-bucket/"}, "a/b.bin"), "r:my-bucket/a/b.bin");
});

check("statFound(): real hit payload -> true", () => {
    const stat = {
        code: 0,
        stdout: Buffer.from(JSON.stringify({Path: "portabase-ping.txt", Name: "portabase-ping.txt", Size: 4, IsDir: false})),
        stderr: "",
    };
    assert.strictEqual(statFound(stat, "minio:backups/portabase-ping.txt"), true);
});

check("statFound(): real miss payload -> false", () => {
    const stat = {
        code: 0,
        stdout: Buffer.from(JSON.stringify({Path: "", Name: "", Size: -1, IsDir: true})),
        stderr: "",
    };
    assert.strictEqual(statFound(stat, "minio:backups/portabase-ping.txt"), false);
});

let failures = 0;
for (const {name, fn} of checks) {
    try {
        fn();
        console.log(`ok - ${name}`);
    } catch (err) {
        failures++;
        console.error(`FAIL - ${name}`);
        console.error(err);
    }
}

if (failures > 0) {
    console.error(`\n${failures}/${checks.length} checks failed`);
    process.exit(1);
}

console.log(`\nAll rclone verification checks passed (${checks.length}/${checks.length})`);
