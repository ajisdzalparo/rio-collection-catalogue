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
        
        # -> Click the 'Catalogue' link in the header to open the catalogue page.
        # Catalogue link
        elem = page.get_by_text('Archive', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='Catalogue', exact=True)
        await elem.click(timeout=10000)
        
        # -> Scroll the product listing to reveal more products (scroll down the Catalogue page).
        await page.mouse.wheel(0, 300)
        
        # -> Click the 'Graphic Edition 01' product tile to open its product detail page.
        # Graphic Edition 01 Putih Rp 550.000 Tersedia link
        elem = page.get_by_role('link', name='View Graphic Edition 01 — Rp 550.000', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Product detail page for 'Graphic Edition 01' is displayed.
        # Assert-outcome: passed
        # Assert: The browser URL contains the product detail path.
        await expect(page).to_have_url(re.compile("/products/graphic\\-edition\\-01"), timeout=15000), "The browser URL contains the product detail path."
        
        # --> Product variants and ordering controls (size selection and quantity) are available on the product page.
        await page.locator("xpath=/html/body/div[2]/div[4]/main/section[1]/div/div[2]/div[3]/div[2]/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: A size option (button 'M') is visible on the page.
        await expect(page.locator("xpath=/html/body/div[2]/div[4]/main/section[1]/div/div[2]/div[3]/div[2]/button[1]").nth(0)).to_be_visible(timeout=15000), "A size option (button 'M') is visible on the page."
        await page.locator("xpath=/html/body/div[2]/div[4]/main/section[1]/div/div[2]/div[4]/div/span").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: The quantity control showing the current quantity is visible.
        await expect(page.locator("xpath=/html/body/div[2]/div[4]/main/section[1]/div/div[2]/div[4]/div/span").nth(0)).to_be_visible(timeout=15000), "The quantity control showing the current quantity is visible."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    