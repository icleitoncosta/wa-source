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
    const pathFolder = path.resolve(__dirname, `../sources/${version}`);
    let body: string | null = null;
    try {
      body = waversion.getPageContent(version);
    } catch (error) {}
  
    if (!body) {
      console.error(`Version not available for ${version}, using latest as fallback`);
      return;
    }
  
    await page.setRequestInterception(true);
  
    page.on('request', async (req) => {
      if (req.url().startsWith('https://web.whatsapp.com/check-update')) {
        req.abort();
        return;
      }
      else if (req.url() === 'https://web.whatsapp.com/') {
        req.respond({
          status: 200,
          contentType: 'text/html',
          body: body,
        });
      } 
      else if(req.resourceType() === 'script') {
        req.continue();
        const fileName = path.basename(url.parse(req.url()).pathname!);
        console.log(fileName);

        const filePathSource = path.join(pathFolder, `${fileName}`);
        const response = req.response();
        await response?.text().then((body) => {
            if(!body) return;
            if(typeof body !== 'undefined') {
                fs.writeFileSync(filePathSource, body);
                console.info(`Downloading file ${fileName} from version ${version}`);
            }

        }).catch((err) => 
        console.log(err));
    } else {
        req.continue();
        return;
      }
    });
  }
