import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';

puppeteer.use(StealthPlugin());

export class Puppeteer {
    private _browser!: Browser;

    async getBrowser(): Promise<Browser>{
        if(!this._browser){
            return puppeteer.launch({
                headless: true,
                userDataDir: path.join(process.cwd(), 'ATERNOS_SESSION'),
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }

        return this._browser;
    }


    static async getPage(browser: Browser, url: string){
        const pages = await browser.pages();
        const page = pages[0] as Page;
    
        for (let i = 1; i < pages.length; i++) {
            await (pages[i] as Page).close().catch(() => {});
        }
    
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2' });
    
        return page;
    }
}

export const PuppeteerManager = new Puppeteer();