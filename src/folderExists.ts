import * as fs from 'fs';

/**
 * Verifica se uma pasta existe.
 * @param {string} folderPath - O caminho da pasta a ser verificada.
 * @returns {boolean} true se a pasta existe, false caso contrário.
 */
export function folderExists(folderPath: string): boolean {
    try {
        // Verifica se o caminho existe e se é uma pasta
        return fs.statSync(folderPath).isDirectory();
    } catch (error) {
        // Se ocorrer um erro ao acessar o caminho, a pasta não existe
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}
