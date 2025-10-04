from playwright.sync_api import sync_playwright, Page, expect
import re

def verify_canvas_improvements(page: Page):
    """
    This script verifies the new canvas functionalities:
    - Panning
    - Animations (implicitly, by showing final state)
    """
    # Set a larger viewport to ensure all elements are visible
    page.set_viewport_size({"width": 1920, "height": 1080})

    # 1. Navigate to the login page
    page.goto("http://localhost:3000/login")

    # 2. Log in
    page.get_by_label("Email").fill("jan@ilerda.com")
    page.get_by_label("Password").fill("Resclo.sa1")
    page.get_by_role("button", name="Login").click()

    # 3. Wait for projects and click the first one
    page.wait_for_url("http://localhost:3000/")

    # Click the first available project link (now visible due to larger viewport)
    page.locator('.project-list a').first.click()

    # 4. Wait for canvas to load
    canvas_area = page.locator('[data-testid="canvas-area"]')
    expect(canvas_area).to_be_visible(timeout=10000) # Increased timeout for loading
    page.wait_for_timeout(2000) # Wait for items to animate in

    # 5. Simulate Panning
    # Press spacebar, move mouse, release spacebar
    canvas_area.hover() # Move mouse over the canvas to give it focus
    page.keyboard.down(' ')
    page.mouse.down()
    # Get the bounding box of the canvas to move relative to it
    box = canvas_area.bounding_box()
    if box:
        page.mouse.move(box['x'] + box['width'] / 2 + 100, box['y'] + box['height'] / 2 + 100)
    page.mouse.up()
    page.keyboard.up(' ')
    page.wait_for_timeout(500) # Wait for pan animation to settle

    # 6. Take a screenshot
    page.screenshot(path="jules-scratch/verification/canvas_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_canvas_improvements(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()