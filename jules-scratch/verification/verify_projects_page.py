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
            # Navigate to the signup page
            await page.goto("http://localhost:3000/signup")

            # Wait for the signup page to load
            await expect(page.get_by_role("heading", name=re.compile("sign up", re.IGNORECASE))).to_be_visible(timeout=10000)

            # Generate a unique email for the new user
            email = f"testuser_{int(time.time())}@example.com"
            password = "password123"

            # Fill in the signup form
            await page.get_by_label("Email").fill(email)
            await page.get_by_label("Password").fill(password)

            # Click the signup button
            await page.get_by_role("button", name="Sign Up").click()

            # After signup, the user should be redirected to the projects page
            await expect(page.get_by_role("heading", name="Your Projects")).to_be_visible(timeout=15000)

            # Take a screenshot of the projects page
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())