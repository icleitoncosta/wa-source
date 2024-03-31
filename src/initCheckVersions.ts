import * as waversion from '@wppconnect/wa-version';
import * as puppeteer from 'puppeteer';
import { folderExists } from './folderExists';
import { openAndDownloadSourceVersion } from './openAndDownloadSourceVersion';
import * as path from 'path';
import * as fs from "fs/promises";

export async function initCheckVersions() {
    
    const versions = waversion.getAvailableVersions();
    const browser = await puppeteer.launch({
        headless: false,
    });
    // Check and download 
    for (const version of versions) {
        const pathFolder = path.resolve(__dirname, `../sources/${version}`);
        if(folderExists(pathFolder)) {
            console.info(`Already exists source for version ${version}`);
            continue;
        }
        await fs.mkdir(pathFolder);
        await openAndDownloadSourceVersion(browser, version, pathFolder);
    }
}

