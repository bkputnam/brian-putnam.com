export interface AppConfig {
    runtime: string;
    handlers: Handler[];
}

export interface Handler {
    url: string;
    secure?: 'always';
    static_files: string;
    upload: string;
    http_headers?: { [key: string]: string }
}
