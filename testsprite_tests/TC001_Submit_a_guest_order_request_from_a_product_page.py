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
        
        # -> Click the 'Catalogue' link in the top navigation to open the product listing.
        # Catalogue link
        elem = page.get_by_text('Archive', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='Catalogue', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Graphic Edition 01' product card from the catalogue to view its product detail page.
        # Graphic Edition 01 Putih Rp 550.000 Tersedia link
        elem = page.get_by_role('link', name='View Graphic Edition 01 — Rp 550.000', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'M' size option on the product page
        # M button
        elem = page.get_by_role('button', name='M', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Putih' color option, increase quantity to 2 using the '+' button, then click the 'Request to Order' button to open the order form.
        # Pilih warna Putih button
        elem = page.get_by_role('button', name='Pilih warna Putih', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Putih' color option, increase quantity to 2 using the '+' button, then click the 'Request to Order' button to open the order form.
        # Increase quantity button
        elem = page.get_by_role('button', name='Increase quantity', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Putih' color option, increase quantity to 2 using the '+' button, then click the 'Request to Order' button to open the order form.
        # Request to Order link
        elem = page.get_by_role('link', name='Request to Order', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Nama Lengkap', 'Nomor WhatsApp', and 'Detail Alamat Jalan & Nomor Rumah' fields with valid values, then scroll down to reveal the 'Konfirmasi & Buat Pesanan' submission button.
        # Nama penerima paket text field
        elem = page.locator('[id="fullName"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Budi Santoso")
        
        # -> Fill the 'Nama Lengkap', 'Nomor WhatsApp', and 'Detail Alamat Jalan & Nomor Rumah' fields with valid values, then scroll down to reveal the 'Konfirmasi & Buat Pesanan' submission button.
        # 08xxxxxxxxxx tel field
        elem = page.locator('[id="whatsapp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("081234567890")
        
        # -> Fill the 'Nama Lengkap', 'Nomor WhatsApp', and 'Detail Alamat Jalan & Nomor Rumah' fields with valid values, then scroll down to reveal the 'Konfirmasi & Buat Pesanan' submission button.
        # Nama jalan, nomor rumah, RT/RW, gedung, atau... text area
        elem = page.locator('[id="streetAddress"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Jalan Melati No.10 RT01/RW02, Kebayoran Baru, Jakarta Selatan")
        
        # -> Fill the 'Nama Lengkap', 'Nomor WhatsApp', and 'Detail Alamat Jalan & Nomor Rumah' fields with valid values, then scroll down to reveal the 'Konfirmasi & Buat Pesanan' submission button.
        await page.mouse.wheel(0, 300)
        
        # -> Click the 'Konfirmasi & Buat Pesanan' button to submit the order request and then verify the order confirmation and WhatsApp next-step information.
        # Konfirmasi & Buat Pesanan button
        elem = page.get_by_role('button', name='Konfirmasi & Buat Pesanan', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Order confirmation page for the submitted order is displayed.
        # Assert-outcome: passed
        # Assert: The page URL contains the order confirmation path.
        await expect(page).to_have_url(re.compile("order/confirmation"), timeout=15000), "The page URL contains the order confirmation path."
        
        # --> WhatsApp next-step information is shown via a visible "Chat via WhatsApp" link.
        # Assert-outcome: passed
        # Assert: The 'Chat via WhatsApp' link is visible on the confirmation page.
        await expect(page.locator("xpath=/html/body/div[2]/div[4]/main/section/div[3]/div/a[1]").nth(0)).to_have_text("Chat via WhatsApp", timeout=15000), "The 'Chat via WhatsApp' link is visible on the confirmation page."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    