import * as path from 'path';

export function getProjectRoot(): string {
    const dirname = import.meta.dirname;
    const index = dirname.lastIndexOf('local/devserver');
    return dirname.substring(0, index);
}

export function getClientRoot(): string {
    return path.join(getProjectRoot(), 'client');
}