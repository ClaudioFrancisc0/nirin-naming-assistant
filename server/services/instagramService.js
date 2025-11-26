const puppeteer = require('puppeteer');

async function checkSingleVariation(browser, username) {
    const url = `https://www.instagram.com/${username}/`;
    console.log(`Checking Instagram for: ${username}`);

    const page = await browser.newPage();
    try {
        // Set a realistic User Agent (Updated to Chrome 123)
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const status = response.status();

        // Check for specific 404 text
        const pageTitle = await page.title();
        const pageContent = await page.content();
        const currentUrl = page.url();

        console.log(`[Instagram] ${username} - Status: ${status}, Title: ${pageTitle}`);
        console.log(`[Instagram] ${username} - URL after load: ${currentUrl}`);
        console.log(`[Instagram] ${username} - Content includes "Profile isn't available": ${pageContent.includes("Profile isn't available")}`);
        console.log(`[Instagram] ${username} - Content includes "isn't available": ${pageContent.includes("isn't available")}`);

        const isBrokenOrBanned =
            pageContent.includes("Sorry, this page isn't available") ||
            pageContent.includes("A página não está disponível") ||
            pageContent.includes("Esta página não está disponível") ||
            pageContent.includes("Profile isn't available") ||
            pageContent.includes("isn't available");

        if (status === 404 || pageTitle.includes("Page Not Found") || pageTitle.includes("Página não encontrada")) {
            console.log(`[Instagram] ${username} - Detected as 404/Not Found`);
            return { variant: username, status: 'available', message: 'Disponível', link: url };
        }

        if (isBrokenOrBanned) {
            console.log(`[Instagram] ${username} - Detected as Broken/Banned`);
            return {
                variant: username,
                status: 'unavailable',
                message: 'Indisponível (Link Quebrado/Banido)',
                link: url,
                // Add a minimal foundProfile so the VER button shows
                foundProfile: {
                    username: username,
                    name: 'Perfil Indisponível',
                    details: 'Este perfil foi removido, banido ou está temporariamente indisponível.',
                    image: ''
                }
            };
        }

        // If 200, try to scrape details
        const metaData = await page.evaluate(() => {
            const title = document.querySelector('meta[property="og:title"]')?.content || '';
            const description = document.querySelector('meta[property="og:description"]')?.content || '';
            const image = document.querySelector('meta[property="og:image"]')?.content || '';
            return { title, description, image };
        });

        // STRICT CHECK
        const isProfilePage = metaData.title && (
            metaData.title.includes(`(@${username})`) ||
            metaData.title.includes(`@${username}`) ||
            (metaData.title.includes("(") && metaData.title.includes(")"))
        );

        if (isProfilePage) {
            return {
                variant: username,
                status: 'unavailable',
                message: 'Perfil encontrado',
                link: url,
                foundProfile: {
                    username: username,
                    name: metaData.title.split('(')[0].trim(),
                    details: metaData.description.split('-')[0].trim(),
                    image: metaData.image
                }
            };
        }

        if (currentUrl.includes("login")) {
            return { variant: username, status: 'unknown', message: 'Exige Login', link: url };
        }

        return {
            variant: username,
            status: 'available',
            message: 'Provavelmente disponível',
            link: url
        };

    } catch (error) {
        console.error(`Instagram check failed for ${username}: ${error.message}`);
        if (error.message.includes('404')) {
            return { variant: username, status: 'available', message: 'Disponível', link: url };
        }
        return { variant: username, status: 'unknown', message: 'Erro', link: url };
    } finally {
        await page.close();
    }
}

async function checkAvailability(name) {
    // Check if name has spaces or special chars that suggest compound name
    const cleanName = name.trim();
    const hasSpaces = cleanName.includes(' ') || cleanName.includes('-');

    let variations = [];

    if (hasSpaces) {
        // Variation 1: Concatenated (nirinone)
        variations.push(cleanName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
        // Variation 2: Underscore (nirin_one)
        variations.push(cleanName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase());
    } else {
        // Single variation
        variations.push(cleanName.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase());
    }

    // Remove duplicates
    variations = [...new Set(variations)];

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Run checks
        // If single variation, return standard format for backward compatibility
        if (variations.length === 1) {
            const result = await checkSingleVariation(browser, variations[0]);
            // Map back to standard format (without 'variant' key if not needed, but it's fine to keep)
            return result;
        }

        // If multiple, run all
        const results = [];
        for (const variant of variations) {
            results.push(await checkSingleVariation(browser, variant));
        }

        return {
            status: 'multiple',
            variations: results
        };

    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { checkAvailability };
