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

            # Verify the sidebar is visible and expanded on the home page
            await expect(page.locator(".sidebar:not(.collapsed)")).to_be_visible(timeout=15000)

            # Click the "+ New Project" button to open the modal
            await page.get_by_role("button", name="+ New Project").click()

            # Create a new project
            project_name = f"Test Project {int(time.time())}"
            await page.get_by_placeholder("Enter project name").fill(project_name)
            await page.get_by_role("button", name="Create Project").click()

            # Click on the new project link to navigate to the canvas
            await page.get_by_text(project_name).click()

            # Wait for the canvas to load and verify the sidebar is now collapsed
            await expect(page.locator(".sidebar.collapsed")).to_be_visible(timeout=10000)

            # Verify that the text is hidden in the collapsed sidebar
            await expect(page.locator(".sidebar.collapsed .text")).not_to_be_visible()

            # Take a screenshot of the collapsed sidebar on the canvas page
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())