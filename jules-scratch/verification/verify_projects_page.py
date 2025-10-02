import asyncio
import re
import time
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Auto-accept any dialogs (like alerts)
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            # Navigate to the login page
            await page.goto("http://localhost:3000/login")

            # Wait for the login page to load
            await expect(page.get_by_role("heading", name=re.compile("login", re.IGNORECASE))).to_be_visible(timeout=10000)

            # Use the provided credentials
            email = "jan@ilerda.com"
            password = "Resclo.sa1"

            # Fill in the login form
            await page.get_by_label("Email").fill(email)
            await page.get_by_label("Password").fill(password)

            # Click the login button
            await page.get_by_role("button", name="Login").click()

            # Wait for the projects to load
            await page.wait_for_selector(".project-item-link")

            # Click on the first project link
            await page.locator(".project-item-link").first.click()

            # Wait for the canvas to load
            await expect(page.locator(".canvas-area")).to_be_visible(timeout=10000)

            # Take a screenshot of the canvas
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())