export type LogFunc = (log:string) => Promise<string>;

export function logWrapper(text:string, options: { starting?:string }){
    let log = text;

    if(options.starting){
        log = options.starting + "\n" + text;
    }

    return log;
}