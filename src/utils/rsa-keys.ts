import {promises as fs} from 'fs';
import path from 'path';
import {generateKeyPair} from 'crypto';
import {promisify} from 'util';
import {randomBytes} from 'crypto';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Generate RSA keypair into a directory (default: ./private).
 * - Skips generation if both files already exist.
 * - Private key mode 0o600. Public key mode 0o644.
 * @param {string} [dir] path to directory
 * @returns {Promise<{privateKeyPath:string, publicKeyPath:string}>}
 */
export async function generateRSAKeys(dir = path.join(process.cwd(), 'private/keys')) {
    await fs.mkdir(dir, {recursive: true});

    const privateKeyPath = path.join(dir, 'server_private.pem');
    const publicKeyPath = path.join(dir, 'server_public.pem');

    try {
        await fs.access(privateKeyPath);
        await fs.access(publicKeyPath);
        console.log('RSA keys already exist. Skipping generation.');
        return {privateKeyPath, publicKeyPath};
    } catch {
    }

    const {publicKey, privateKey} = await generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {type: 'pkcs1', format: 'pem'},
        privateKeyEncoding: {type: 'pkcs1', format: 'pem'},
    });

    await fs.writeFile(privateKeyPath, privateKey, {mode: 0o600});
    await fs.writeFile(publicKeyPath, publicKey, {mode: 0o644});

    return {privateKeyPath, publicKeyPath};
}


/**
 * Generate a 256-bit AES master key for AES-256-GCM.
 * - Skips generation if the file already exists.
 * - File mode 0o600 for private key.
 * @param {string} [filePath] Path to store the key
 * @returns {Promise<Buffer>} The master key
 */
export async function getOrCreateMasterKey(filePath = path.join(process.cwd(), 'private/keys', 'master_key.bin')) {

    await fs.mkdir(path.dirname(filePath), {recursive: true});

    try {
        const existing = await fs.readFile(filePath);
        console.log('Master key already exists. Skipping generation.');
        return existing;
    } catch {
        // File does not exist, generate
    }

    const key = randomBytes(32); // 256-bit key

    console.log(key)

    await fs.writeFile(filePath, key, {mode: 0o600});
    console.log(`Master key generated at ${filePath}`);

    return key;
}