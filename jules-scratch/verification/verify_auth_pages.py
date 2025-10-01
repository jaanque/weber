from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Verify Login Page
    page.goto("http://localhost:3000/login")
    expect(page.get_by_role("heading", name="Login")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/login-page.png")

    # Verify Sign Up Page
    page.get_by_role("link", name="Sign Up").click()
    expect(page.get_by_role("heading", name="Sign Up")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/signup-page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)