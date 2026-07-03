import fs from 'fs';
import path from 'path';

export type LogFunc = (log:string) => Promise<string>;

export function logWrapper(text:string, options: { starting?:string }){
    let log = text;

    if(options.starting){
        log = options.starting + "\n" + text;
    }

    return log;
}

const logDir = path.join(process.cwd(), 'data', 'sessions', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

export const internalLog = (message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO', username: string) => {
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const filePath = path.join(logDir, `system_${date}.log`);
    
    const logEntry = `[${timestamp}] [${level}] [${username}] ${message}\n`;
    
    fs.appendFileSync(filePath, logEntry);

    if (level === 'ERROR') console.error(logEntry.trim());
    else console.log(logEntry.trim());
};