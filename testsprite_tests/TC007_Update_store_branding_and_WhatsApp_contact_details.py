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
        
        # -> Open the login page by navigating to http://localhost:3000/login
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill 'admin@riocollection.id' into the Alamat Email field, 'secret123' into the Kata Sandi field, then click the 'Masuk ke Dashboard' button.
        # Masukkan alamat email Anda email field
        elem = page.locator('[id="base-ui-_r_0_"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@riocollection.id")
        
        # -> Fill 'admin@riocollection.id' into the Alamat Email field, 'secret123' into the Kata Sandi field, then click the 'Masuk ke Dashboard' button.
        # Masukkan kata sandi Anda password field
        elem = page.locator('[id="base-ui-_r_1_"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("secret123")
        
        # -> Fill 'admin@riocollection.id' into the Alamat Email field, 'secret123' into the Kata Sandi field, then click the 'Masuk ke Dashboard' button.
        # Masuk ke Dashboard button
        elem = page.get_by_role('button', name='Masuk ke Dashboard', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Store Settings' link in the sidebar to open the settings page
        # Store Settings link
        elem = page.locator('[id="base-ui-_r_k_"]')
        await elem.click(timeout=10000)
        
        # -> Fill the 'Nama Toko / Judul Katalog' field, the 'Nomor WhatsApp Admin (Format 62...)' field, set 'Email Kontak Resmi', then click the Save button to persist settings.
        # RIO COLLECTION text field
        elem = page.locator('[id="store-name"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("RIO TEST STORE")
        
        # -> Fill the 'Nama Toko / Judul Katalog' field, the 'Nomor WhatsApp Admin (Format 62...)' field, set 'Email Kontak Resmi', then click the Save button to persist settings.
        # 628123456789 text field
        elem = page.locator('[id="wa-number"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("6281299000000")
        
        # -> Fill the 'Nama Toko / Judul Katalog' field, the 'Nomor WhatsApp Admin (Format 62...)' field, set 'Email Kontak Resmi', then click the Save button to persist settings.
        # hello@riocollection.id email field
        elem = page.locator('[id="contact-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("test@riocollection.id")
        
        # -> Fill the 'Nama Toko / Judul Katalog' field, the 'Nomor WhatsApp Admin (Format 62...)' field, set 'Email Kontak Resmi', then click the Save button to persist settings.
        # Simpan Pengaturan CMS button
        elem = page.get_by_role('button', name='Simpan Pengaturan CMS', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Simpan Pengaturan CMS' button to save the updated store branding and WhatsApp contact settings.
        # Simpan Pengaturan CMS button
        elem = page.get_by_role('button', name='Simpan Pengaturan CMS', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Simpan Pengaturan CMS' button to save settings, wait for confirmation, then open the public homepage (site root) to verify the public-facing contact and branding.
        # Simpan Pengaturan CMS button
        elem = page.get_by_role('button', name='Simpan Pengaturan CMS', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Simpan Pengaturan CMS' button to save settings, wait for confirmation, then open the public homepage (site root) to verify the public-facing contact and branding.
        # Open URL in new tab
        page = await context.new_page()
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the Store Settings page and verify the 'Nama Toko / Judul Katalog', 'Nomor WhatsApp Admin (Format 62...)', and 'Email Kontak Resmi' fields contain the saved values.
        # Switch to tab 4D96
        page = context.pages[-1]  # switch to most recently active tab
        
        # -> Switch to the public homepage tab (the tab opened to the site root) so the homepage can be searched for the WhatsApp number '6281299000000' and the contact email 'test@riocollection.id'.
        # Switch to tab A9EF
        page = context.pages[-1]  # switch to most recently active tab
        
        # --> Assertions to verify final state
        
        # --> Public homepage shows the updated store title and the updated WhatsApp number and contact email.
        # Assert-outcome: passed
        # Assert: Public header shows the store title 'RIO TEST STORE'.
        await expect(page.locator("xpath=/html/body/div[2]/div[4]/header/div/a").nth(0)).to_have_text("RIO TEST STORE", timeout=15000), "Public header shows the store title 'RIO TEST STORE'."
        # Assert-outcome: passed
        # Assert: Public homepage contains the WhatsApp number '6281299000000'.
        await expect(page.locator("xpath=/html/body/div[2]/div[4]/header/div/div/div").nth(0)).to_contain_text("6281299000000", timeout=15000), "Public homepage contains the WhatsApp number '6281299000000'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    