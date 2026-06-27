import path from 'path';
import { Browser, Page } from 'puppeteer';
import { LogFunc } from "../common/utils";
import { IPage } from "../core/pages";
import { Puppeteer, PuppeteerManager } from "../integrations/puppeteer";

class AternosPage implements IPage {
    url: string = "https://aternos.org/go/";

    async tryToLogIn(browser: Browser, username:string, password: string, logFun:LogFunc  = t => Promise.resolve(t)){
        await logFun("Trying to connect to aternos.org");
        const page = await Puppeteer.getPage(browser, 'https://aternos.org/go/');

        const currentUrl = page.url();

        if (currentUrl.includes('/go/')) {
            await logFun("Logging in");
            await page.type('.username', username);
            await page.type('.password', password);
            await page.click('.login-button');
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 });
        }else{
          await logFun("Logged in");
        }

        return { page }
    }

    async isOnline(page: Page, logFun:LogFunc  = t => Promise.resolve(t)){
            await logFun("Looking for MCconAll");
            await page.waitForSelector('.servercard', { visible: true, timeout: 15000 });
    
            const isAlreadyOnline = await page.evaluate(() => {
                const serverCard = document.querySelector<HTMLAnchorElement>('.servercard');

                if (!serverCard) {
                    throw new Error("No server card.");
                }

                if (serverCard.classList.contains('online')) {
                    return true;
                }

                serverCard.click();
                return false;
            });

            return isAlreadyOnline;
    }

    async checkServerStatus(username:string, password: string, logFun:LogFunc  = t => Promise.resolve(t), whenDone:() => Promise<void>){
       let browser = await PuppeteerManager.getBrowser();
       let finalLog = "There was a problem during the process.";
    
        try {
            const { page } = await this.tryToLogIn(browser, username, password, logFun);
    
            const isAlreadyOnline = await this.isOnline(page);
    
            if (isAlreadyOnline) {
                finalLog = await logFun("Server is already online.") as string;
            } else {
                finalLog = await logFun("Server is offline.") as string;
            }
        } catch (e) {
            console.log(e)
        } finally {
            if (browser) {
                await logFun(finalLog +"\nClosing browser");
                await browser.close();
            }

            await whenDone();
        }
    }

    async startAternosServer(username:string, password: string, logFun:LogFunc  = t => Promise.resolve(t), whenDone:() => Promise<void>) {
        let browser = await PuppeteerManager.getBrowser();
        let finalLog = "There was a problem during the process.";

        try {
            const { page } = await this.tryToLogIn(browser, username, password, logFun);
    
            const isAlreadyOnline = await this.isOnline(page);

            if (isAlreadyOnline) {
                finalLog = await logFun("Server is already online. Aborting start sequence.") as string;
                return;
            }

            await logFun("Trying to start");
            await page.waitForSelector('#start', { visible: true, timeout: 10000 });
            await page.click('#start');

            try {
                const modalButtonSelector = '.btn';
                await logFun("Ads request. Waiting");

                await page.waitForFunction(
                    (selector) => {
                        const elements = document.querySelectorAll(selector);

                        for (const el of elements) {
                            if (el.textContent.includes('Start') && el.id !== 'start') {
                                const rect = el.getBoundingClientRect();
                                return rect.width > 0 && rect.height > 0;
                            }
                        }
                        return false;
                    },
                    { timeout: 15000 },
                    modalButtonSelector
                );

                await page.evaluate((selector) => {
                    const elements = document.querySelectorAll<HTMLButtonElement>(selector);

                    for (const el of elements) {
                        if (el.textContent.includes('Start') && el.id !== 'start') {
                            el.click();
                            return;
                        }
                    }
                    throw new Error();
                }, modalButtonSelector);

                await new Promise(resolve => setTimeout(resolve, 32000));

            } catch (error:any) {
                await logFun("No ads found");
                console.error(error.message);
                const screenshotPath = path.join(__dirname, '..', '..', 'ATERNOS_SESSION', 'ads_error.png');
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log('screenshot ads.png');
            }

            try {
                await logFun("Looking for captcha question. Processing");
                await page.waitForSelector('dialog.alert.alert-danger', { visible: true, timeout: 5000 });
                
                await page.evaluate(() => {
                    const acceptButton = document.querySelector<HTMLButtonElement>('dialog.alert.alert-danger .btn-success');
                    if (acceptButton) {
                        acceptButton.click();
                    }
                });
            } catch (error:any) {
                await logFun("No captcha found");
                console.error(error.message);
            }

            try {
                await logFun("Trying to initialize server.");

                await page.waitForFunction(() => {
                    const statusLabel = document.querySelector('.statuslabel-label');
                    
                    if (statusLabel) {
                        const text = statusLabel.textContent.toLowerCase();
                        return text.includes('online') || text.includes('línea') || text.includes('linea');
                    }
                    return false;
                }, { timeout: 300000 });

                finalLog = await logFun("Server is now completely online.") as string;
            } catch (error:any) {
                finalLog = await logFun("Error waiting for status. Try later or ask Spirit.") as string;
                console.error(error.message);
            }
        } catch (error:any) {
            console.log(error.message);
        } finally {
            if (browser) {
                logFun(finalLog + "\nClosing browser");
                await browser.close();
            }

            await whenDone();
        }
    }
}

export const AternosManager = new AternosPage();