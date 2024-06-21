import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import mime from 'mime';
import * as http from 'http';

import { AppConfig } from './app-types.js';
import { getProjectRoot } from './root-folder.js';

const PORT = 8080;
const APP_CONFIG_FILE = path.join(getProjectRoot(), 'app.yaml');
const ROOT_DIR = getProjectRoot();

const appConfig =
    yaml.load(fs.readFileSync(APP_CONFIG_FILE, 'utf8')) as AppConfig;
const cachedRegexes = new Map<string, Map<string, RegExp>>();

function getOrCreateRegex(regexStr: string, options: string): RegExp {
    if (!cachedRegexes.has(regexStr)) {
        cachedRegexes.set(regexStr, new Map<string, RegExp>());
    }
    const optionsMap = cachedRegexes.get(regexStr)!;
    if (!optionsMap.has(options)) {
        const regex = new RegExp(regexStr, options);
        optionsMap.set(regexStr, regex);
        return regex;
    }
    return optionsMap.get(regexStr)!;
}

const server = http.createServer((req, res) => {
    let requestedPath = req.url!;
    let fsPath: string | null = null;

    for (const handler of appConfig.handlers) {
        const handlerPathRegex = getOrCreateRegex(`^${handler.url}$`, 'i');
        const match = requestedPath.match(handlerPathRegex);
        if (!match) {
            continue;
        }
        fsPath = handler.static_files;
        for (const [i, group] of match.entries()) {
            const replaceStr = getOrCreateRegex(`\\\\${i}`, 'ig');
            fsPath = fsPath.replaceAll(replaceStr, group);
        }
        break;
    }

    if (fsPath === null) {
        res.writeHead(404);
        res.end('Failed to find handler');
        return;
    }

    if (fsPath.includes('/../') || fsPath.includes('/./')) {
        res.writeHead(403);
        res.end('Using `..` and `.` is forbidden.');
        return;
    }

    const fullFsPath = path.join(ROOT_DIR, fsPath);
    const mimeType = mime.getType(path.extname(fsPath));
    const encoding = mimeType?.startsWith('text/') ? 'utf8' : 'binary';
    let fileText: string;
    try {
        fileText = fs.readFileSync(fullFsPath, encoding);
    } catch (reason: unknown) {
        res.writeHead(404);
        res.end('Failed to find file');
        return;
    }

    if (mimeType) {
        res.setHeader('Content-Type', mimeType);
    }
    res.end(Buffer.from(fileText, encoding));
});
server.listen(PORT, 'localhost', () => {
    const thisFile = path.basename(import.meta.filename);
    console.log(`${thisFile} serving on :${PORT}`);
});
