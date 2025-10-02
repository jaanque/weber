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

            # Verify the sidebar is visible
            await expect(page.locator(".sidebar")).to_be_visible(timeout=15000)

            # Click the "+ New Project" button to open the modal
            await page.get_by_role("button", name="+ New Project").click()

            # Verify the modal is visible
            await expect(page.get_by_role("heading", name="New Project")).to_be_visible()

            # Create a new project
            project_name = f"Test Project {int(time.time())}"
            await page.get_by_placeholder("Enter project name").fill(project_name)
            await page.get_by_role("button", name="Create Project").click()

            # Verify the modal is closed and wait for the new project to appear in the list
            await expect(page.get_by_role("heading", name="New Project")).not_to_be_visible()
            new_project_link = page.locator(f'.project-item-link:has-text("{project_name}")')
            await expect(new_project_link).to_be_visible(timeout=10000)

            # Click on the new project link
            await new_project_link.click()

            # Wait for the canvas to load
            await expect(page.get_by_role("heading", name="Tools")).to_be_visible()

            # Define the source and target for drag-and-drop
            source = page.locator(".tool-item")
            target = page.locator(".canvas-area")

            # Perform the drag-and-drop operation
            await source.drag_to(target, target_position={"x": 150, "y": 150})

            # Verify that the dropped item is now on the canvas
            await expect(page.get_by_text("New Text Block")).to_be_visible()

            # Take a screenshot of the canvas with the dropped item
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())