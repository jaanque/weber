from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Log in
        page.goto("http://localhost:3000/login")
        page.wait_for_load_state('networkidle')
        page.locator("#email").fill("jan@ilerda.com")
        page.locator("#password").fill("Resclo.sa1")
        page.get_by_role("button", name="Login").click()

        # 2. Navigate to a project
        expect(page).to_have_url("http://localhost:3000/")
        # Click the first project link
        page.locator('.project-item a').first.click()

        # 3. Wait for canvas to load and select a text box
        expect(page.locator(".canvas-area")).to_be_visible()
        textbox = page.locator(".dropped-item").first
        expect(textbox).to_be_visible()
        textbox.click()

        # 4. Trigger autosave message by editing text
        textbox.dblclick()
        page.locator(".editable-textarea").first.press(" ")
        page.locator(".canvas-area").click() # Blur to save

        # Wait for the "Project saved" message to appear
        save_status = page.locator(".save-status.visible")
        expect(save_status).to_be_visible()
        expect(save_status).to_have_css("background-color", "rgba(0, 0, 0, 0)") # Transparent

        # 5. Show the trash can by dragging an item
        textbox.drag_to(page.locator(".trash-area"))

        # 6. Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        # 7. Clean up
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)