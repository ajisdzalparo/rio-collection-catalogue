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
        
        # -> Click the 'AVAILABLE' tab to filter the catalogue to available products.
        # AVAILABLE button
        elem = page.get_by_role('tab', name='AVAILABLE', exact=True)
        await elem.click(timeout=10000)
        
        # -> Scroll down to reveal the category filter and product grid (if present) so category controls can be located.
        await page.mouse.wheel(0, 300)
        
        # --> Assertions to verify final state
        
        # --> A category filter control is not present on the Catalogue page, so the catalogue cannot be filtered by category.
        # Assert-outcome: failed
        # Assert: Expected the page URL to contain '/catalogue'.
        await expect(page).to_have_url(re.compile("/catalogue"), timeout=15000), "Expected the page URL to contain '/catalogue'."
        await page.locator("xpath=/html/body/div[2]/div[4]/main/section[3]/div/a").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: failed
        # Assert: Expected the catalogue to show at least one product card so a filter could be applied.
        await expect(page.locator("xpath=/html/body/div[2]/div[4]/main/section[3]/div/a").nth(0)).to_be_visible(timeout=15000), "Expected the catalogue to show at least one product card so a filter could be applied."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    