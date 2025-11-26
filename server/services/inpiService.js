const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function checkAvailability(name, nclClass) {
    console.log(`[INPI] Starting check for: ${name} (Class ${nclClass})`);
    let browser = null;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            ignoreHTTPSErrors: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1280,800',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const searchUrl = 'https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_classe_basica.jsp';

        console.log("[INPI] Navigating to search page...");

        // Strategy: Go to URL. If Login appears, handle it, then Go to URL again.
        // Avoid clicking menus if possible.

        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            console.log("[INPI] Initial navigation timed out. Checking content...");
        }

        // Check state
        const checkState = async () => {
            const content = await page.content();
            if (content.includes("Acesso ao sistema") || content.includes("Login") || content.includes("Usuário")) return 'LOGIN';
            if (content.includes("Pesquisa básica") && (content.includes("marca") || content.includes("expressaoPesquisa"))) return 'SEARCH';
            return 'UNKNOWN';
        };

        let state = await checkState();
        console.log(`[INPI] Initial State: ${state}`);

        if (state === 'LOGIN') {
            console.log("[INPI] Handling Authenticated Login...");

            // Use credentials from .env
            const username = process.env.INPI_USER;
            const password = process.env.INPI_PASS;

            if (!username || !password) {
                throw new Error("INPI credentials not found in .env (INPI_USER, INPI_PASS)");
            }

            // Find inputs. Usually generic names or we can find by type.
            // INPI Legacy: often j_username / j_password or similar.
            // We'll try to find the password field and the text field before it.

            const passwordInput = await page.$('input[type="password"]');
            if (!passwordInput) {
                // Try finding by name if type is hidden or weird
                throw new Error("Login page found but password input is missing.");
            }

            // Assuming username is the text input before password or specifically named
            // Let's try standard selectors first
            let usernameInput = await page.$('input[name*="user"], input[name*="login"], input[type="text"]');

            // If we have specific IDs/Names for INPI (often generic in JSP)
            // Let's try to fill them.

            if (usernameInput) {
                await usernameInput.type(username);
                await passwordInput.type(password);

                console.log("[INPI] Credentials filled. Submitting...");

                const loginButton = await page.$('input[type="submit"], button[type="submit"], button:not([type])');
                if (loginButton) {
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { }),
                        loginButton.click()
                    ]);
                } else {
                    // Try pressing Enter
                    await passwordInput.press('Enter');
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
                }

            } else {
                throw new Error("Could not find username input.");
            }

            // After login, force go to search URL again.
            console.log("[INPI] Login submitted. Force navigating to search URL...");
            try {
                await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            } catch (e) {
                console.log("[INPI] Second navigation timed out. Checking content...");
            }
        }

        // 3. Find Input
        console.log("[INPI] Looking for search input...");
        let targetFrame = null;
        const searchInputSelector = 'input[name="marca"], input[name="expressaoPesquisa"]';

        // Quick poll for input
        for (let i = 0; i < 5; i++) {
            if (await page.$(searchInputSelector)) {
                targetFrame = page;
                break;
            }
            for (const frame of page.frames()) {
                if (await frame.$(searchInputSelector)) {
                    targetFrame = frame;
                    break;
                }
            }
            if (targetFrame) break;
            await new Promise(r => setTimeout(r, 1000));
        }

        if (!targetFrame) {
            // Debug: Save screenshot
            const debugPath = path.join(__dirname, '../../inpi_error.png');
            await page.screenshot({ path: debugPath });
            console.log(`[INPI] Error: Input not found. Screenshot saved to ${debugPath}`);

            // Check if we are still on login (auth failed)
            const content = await page.content();
            if (content.includes("Acesso ao sistema") || content.includes("Login")) {
                throw new Error("Login failed. Check credentials.");
            }

            throw new Error("Search input not found. Site might be down or changed.");
        }

        console.log(`[INPI] Found input in ${targetFrame === page ? 'main page' : 'frame'}. Filling form...`);
        await targetFrame.type(searchInputSelector, name);

        if (nclClass) {
            const classInput = await targetFrame.$('input[name="classe"], input[name="classificacao"]');
            if (classInput) await classInput.type(nclClass.toString());
        }

        // 5. Submit
        console.log("[INPI] Submitting...");
        const searchButton = await targetFrame.$('input[type="submit"], button[type="submit"], a[href*="pesquisar"]');
        if (!searchButton) throw new Error("Search button not found");

        const clickPromise = searchButton.click();

        // Wait for results indicator
        try {
            console.log("[INPI] Waiting for results...");
            await Promise.race([
                targetFrame.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
                targetFrame.waitForSelector('table', { timeout: 20000 }),
                targetFrame.waitForSelector('font.normal[color="#000000"]', { timeout: 20000 }),
                new Promise(r => setTimeout(r, 8000)) // Increased fallback wait
            ]);
        } catch (e) {
            console.log("[INPI] Wait for results timed out or navigation failed:", e.message);
        }

        await clickPromise;
        await new Promise(r => setTimeout(r, 3000)); // Increased safety wait

        // 6. Scrape Results
        console.log("[INPI] Scraping results...");

        // Find the frame with results again
        let resultsFrame = null;

        // Helper to check for results table
        const hasResults = async (frame) => {
            try {
                // Look for the specific font tag or table class often used in INPI results
                return await frame.$('font.normal[color="#000000"]') || await frame.$('a.visitado');
            } catch (e) { return false; }
        };

        // Check all frames
        for (const frame of page.frames()) {
            try {
                const content = await frame.content();
                if (content.includes("tabela_resultados") || content.includes("Nenhum registro") || content.includes("brandName") || (await hasResults(frame))) {
                    resultsFrame = frame;
                    break;
                }
            } catch (e) { }
        }

        if (!resultsFrame) resultsFrame = page; // Fallback

        // Check for "No results" message using innerText (more reliable than raw HTML)
        let noResults = false;
        try {
            noResults = await resultsFrame.evaluate(() => {
                if (!document.body) return false;
                const text = document.body.innerText;
                return text.includes("Nenhum registro encontrado") ||
                    text.includes("Não foram encontrados") ||
                    text.includes("Nenhum resultado foi encontrado");
            });
        } catch (e) {
            console.log("[INPI] Error checking for no results text:", e.message);
        }

        if (noResults) {
            console.log("[INPI] No results found (detected via innerText).");
            return {
                status: 'available',
                details: 'Nenhum registro exato encontrado no INPI.'
            };
        }

        // Extract Data
        let results = [];
        let debugInfo = {};
        try {
            console.log("[INPI] Attempting to extract table data...");
            const extractResult = await resultsFrame.evaluate((searchName) => {
                const rows = Array.from(document.querySelectorAll('tr'));
                const data = [];
                const debug = {
                    totalRows: rows.length,
                    headerFound: false,
                    rowsProcessed: 0,
                    rowsWithEnoughCells: 0,
                    rowsAdded: 0
                };

                // Strategy: Look for ANY row that contains the brand name we're searching for
                // This is more flexible than trying to parse the table structure
                for (let i = 0; i < rows.length; i++) {
                    debug.rowsProcessed++;
                    const cells = rows[i].querySelectorAll('td');

                    if (cells.length >= 3) {
                        debug.rowsWithEnoughCells++;

                        // Get all cell text
                        const cellTexts = Array.from(cells).map(cell =>
                            cell.innerText ? cell.innerText.trim() : ''
                        );

                        // Check if any cell contains the brand name (case insensitive)
                        const brandNameLower = searchName.toLowerCase();
                        const hasBrandName = cellTexts.some(text =>
                            text.toLowerCase().includes(brandNameLower)
                        );

                        if (hasBrandName) {
                            // Try to extract: process number, brand, situation
                            // Process number is usually all digits
                            let processNumber = '';
                            let brandName = '';
                            let situation = '';

                            // Find process number (column with just digits)
                            for (const text of cellTexts) {
                                if (/^\d+$/.test(text.replace(/[^\d]/g, '')) && text.length >= 8) {
                                    processNumber = text;
                                    break;
                                }
                            }

                            // Find brand name (look for the search term)
                            for (const text of cellTexts) {
                                if (text.toLowerCase().includes(brandNameLower)) {
                                    brandName = text;
                                    break;
                                }
                            }

                            // Situation is often the last meaningful cell or contains keywords
                            for (const text of cellTexts) {
                                const lower = text.toLowerCase();
                                if (lower.includes('arquivad') || lower.includes('vigor') ||
                                    lower.includes('extint') || lower.includes('conferid') ||
                                    lower.includes('pedido') || lower.includes('registro')) {
                                    situation = text;
                                    break;
                                }
                            }

                            // If no situation found, use last non-empty cell
                            if (!situation) {
                                for (let j = cellTexts.length - 1; j >= 0; j--) {
                                    if (cellTexts[j] && cellTexts[j].length > 2) {
                                        situation = cellTexts[j];
                                        break;
                                    }
                                }
                            }

                            if (processNumber) {
                                data.push({
                                    brandName: brandName || searchName,
                                    processNumber,
                                    situation: situation || 'Status não identificado'
                                });
                                debug.rowsAdded++;
                            }
                        }
                    }

                    if (data.length >= 20) break;
                }

                return { data, debug };
            }, name);

            results = extractResult.data;
            debugInfo = extractResult.debug;

            console.log(`[INPI] Debug info:`, debugInfo);
            console.log(`[INPI] Extracted ${results.length} results from table`);
        } catch (evaluateError) {
            console.error("[INPI] Error during table extraction:", evaluateError.message);
            console.error("[INPI] Stack:", evaluateError.stack);
            results = [];
        }

        if (results.length > 0) {
            console.log(`[INPI] Found ${results.length} results.`);
            return {
                status: 'unavailable', // Changed from manual_check to unavailable (Occupied)
                details: `${results.length} processos encontrados.`,
                foundProcesses: results
            };
        }

        console.log("[INPI] No structured results found (Fallback).");

        // If we didn't find "No results" text but also didn't scrape rows, 
        // it's safer to return available (no matches found) than to error
        return {
            status: 'available',
            details: 'Nenhum registro exato encontrado.'
        };

    } catch (error) {
        console.error('[INPI] Scrape Error:', error);
        return {
            status: 'error',
            details: `Erro: ${error.message}`, // Show specific error
            link: `https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_classe_basica.jsp`
        };
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { checkAvailability };
