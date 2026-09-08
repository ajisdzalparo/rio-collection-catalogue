import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Catalogue' link in the top navigation to open the catalogue page.
        # Catalogue link
        elem = page.get_by_text('Archive', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='Catalogue', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the search field by clicking the 'Search' button in the header.
        # Search button
        elem = page.get_by_role('button', name='Search', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type 'Midnight' into the search field (placeholder 'Cari produk, warna, edisi...') and verify that the product 'Midnight Structure' appears in the catalogue grid.
        # Cari produk, warna, edisi (misal: Boxy Tee... text field
        elem = page.get_by_placeholder('Cari produk, warna, edisi (misal: Boxy Tee, Hitam)...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Midnight")
        
        # --> Assertions to verify final state
        
        # --> The catalogue grid shows the product 'Midnight Structure'.
        # Assert-outcome: passed
        # Assert: Verify the catalogue grid contains an item titled 'Midnight Structure'.
        await expect(page.locator("xpath=/html/body/div[2]/div[4]/main/section[3]/div/a[2]").nth(0)).to_contain_text("Midnight Structure", timeout=15000), "Verify the catalogue grid contains an item titled 'Midnight Structure'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    