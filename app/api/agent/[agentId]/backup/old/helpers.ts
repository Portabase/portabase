import fs from "node:fs";
import forge from "node-forge";


export async function decryptedDump(file: File, aesKeyHex: string, ivHex: string, fileExtension: string): Promise<File> {
    const privateKeyPem = fs.readFileSync("private/keys/server_private.pem", "utf8");
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    // Decrypt AES key with RSA-OAEP
    const encryptedAesKey = forge.util.hexToBytes(aesKeyHex);
    const aesKey = privateKey.decrypt(encryptedAesKey, "RSA-OAEP", {
        md: forge.md.sha256.create(),
        mgf1: {md: forge.md.sha256.create()},
    });

    // Read encrypted file content
    const encryptedBuffer = Buffer.from(await file.arrayBuffer());
    const iv = forge.util.hexToBytes(ivHex);

    // AES decryption
    const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
    decipher.start({iv});
    decipher.update(forge.util.createBuffer(encryptedBuffer.toString("binary")));
    const success = decipher.finish();

    if (!success) {
        throw new Error("Decryption failed");
    }

    const decryptedBytes = decipher.output.getBytes();
    const decryptedBuffer = Buffer.from(decryptedBytes, "binary");

    // Return a File so you can use file.arrayBuffer() later
    return new File(
        [decryptedBuffer],
        file.name.replace(/\.enc$/, fileExtension),
        {type: "application/octet-stream"}
    );
}


export function getFileExtension(dbType: string) {
    switch (dbType) {
        case "postgresql":
            return ".dump";
        case "mysql":
            return ".sql";
        default:
            return ".dump";
    }
}


