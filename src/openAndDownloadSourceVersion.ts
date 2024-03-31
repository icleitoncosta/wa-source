import * as waversion from '@wppconnect/wa-version';
import * as puppeteer from "puppeteer";
import * as fs from 'fs';
import * as url from 'url';
import path from 'path';


export async function openAndDownloadSourceVersion(browser: puppeteer.Browser, version: string, WA_DIR_SOURCE: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
    const page = await browser.newPage();
    await unregisterServiceWorker(page);

    await setWhatsappVersion(page, version);
    setTimeout(() => {
        console.info(`Loading WhatsApp WEB version ${version}`);
    
        const timeout = 10 * 1000;
        page
          .goto(`https://web.whatsapp.com`, {
            timeout,
            waitUntil: 'domcontentloaded',
          })
          .catch(() => {});
          
        console.info(`Loaded WhatsApp WEB version ${version}`);
      }, 1000);
      page.on('request', async (request) => {
        if(request.url().match(/^https:\/\/(web\.whatsapp\.com|static\.whatsapp\.net)\//)) {
            const fileName = path.basename(url.parse(request.url()).pathname!);

            const filePathSource = path.join(WA_DIR_SOURCE, `${fileName}`);
            const response = await request.response();
    
            if (fileName.endsWith('.js')) {
                const body = await response?.buffer();
                console.log(response);
                if(typeof body !== 'undefined') {
                    fs.writeFileSync(filePathSource, body);
                    console.info(`Downloading file ${fileName} from version ${version}`);
                }
            }
        }
      })
    });
    
}


export async function unregisterServiceWorker(page: puppeteer.Page) {
    await page.evaluateOnNewDocument(() => {
      // Remove existent service worker
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
          }
        })
        .catch((err) => null);
  
      // Disable service worker registration
      // @ts-ignore
      navigator.serviceWorker.register = new Promise(() => {});
  
      setInterval(() => {
        window.onerror = console.error;
        window.onunhandledrejection = console.error;
      }, 500);
    });
  }

export async function setWhatsappVersion(
    page: puppeteer.Page,
    version: string,
  ) {
    let body: string | null = null;
    try {
      body = waversion.getPageContent(version);
    } catch (error) {}
  
    if (!body) {
      console.error(`Version not available for ${version}, using latest as fallback`);
      return;
    }
  
    await page.setRequestInterception(true);
  
    page.on('request', (req) => {
      if (req.url().startsWith('https://web.whatsapp.com/check-update')) {
        req.abort();
        return;
      }
      else if (req.url() !== 'https://web.whatsapp.com/') {
        req.continue();
        return;
      }
        req.respond({
          status: 200,
          contentType: 'text/html',
          body: body,
        });
    });
  }
