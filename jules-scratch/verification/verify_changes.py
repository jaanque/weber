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
        project_list = page.locator(".project-list")
        expect(project_list).to_be_visible()
        page.locator('.project-item-link').first.click()

        # 3. Wait for canvas to load and select a text box
        expect(page.locator(".canvas-area")).to_be_visible()
        textbox = page.locator(".dropped-item").first
        expect(textbox).to_be_visible()
        textbox.click()

        # 4. Resize the textbox to test dynamic font size
        handle = page.locator(".resizable-handle-bottomRight").first
        handle_box = handle.bounding_box()
        page.mouse.move(handle_box['x'] + handle_box['width'] / 2, handle_box['y'] + handle_box['height'] / 2)
        page.mouse.down()
        page.mouse.move(handle_box['x'] + 100, handle_box['y'] + 100)
        page.mouse.up()

        # 5. Drag the item to show the custom drag preview
        textbox_box = textbox.bounding_box()
        page.mouse.move(textbox_box['x'] + textbox_box['width'] / 2, textbox_box['y'] + textbox_box['height'] / 2)
        page.mouse.down()
        trash_area = page.locator(".trash-area")
        expect(trash_area).to_be_visible()
        trash_box = trash_area.bounding_box()
        page.mouse.move(trash_box['x'] + trash_box['width'] / 2, trash_box['y'] + trash_box['height'] / 2)
        page.mouse.up()

        # 6. Show the styling toolbar to verify font upload and accessibility
        textbox.click() # re-select the item
        expect(page.locator(".styling-toolbar")).to_be_visible()

        # 7. Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        # 8. Clean up
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)