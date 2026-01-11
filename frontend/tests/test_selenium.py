from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import unittest
import os

class GoogleSearchTest(unittest.TestCase):
    def setUp(self):
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        self.driver = webdriver.Chrome(options=options)

    def test_google_homepage_title(self):
        self.driver.get("https://www.google.com")
        title = self.driver.title
        # Save screenshot
        os.makedirs("screenshots", exist_ok=True)
        self.driver.save_screenshot("screenshots/google_home.png")
        self.assertIn("Google", title)

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()