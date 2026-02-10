const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Configuration
const BASE_URL = 'http://localhost/HomeService';
const TEST_EMAIL = 'test@example.com'; 
const TEST_PASSWORD = 'password123'; // Replace with a valid test password

(async function testLogin() {
  console.log('Starting Login Test...');
  
  // Initialize Driver
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    // 1. Navigate to Login Page
    console.log(`Navigating to ${BASE_URL}/frontend/login.html`);
    await driver.get(`${BASE_URL}/frontend/login.html`);

    // 2. Find and Fill Email
    await driver.findElement(By.id('email')).sendKeys(TEST_EMAIL);
    console.log('Entered email');

    // 3. Find and Fill Password
    await driver.findElement(By.id('password')).sendKeys(TEST_PASSWORD, Key.RETURN);
    console.log('Entered password and pressed Enter');

    // 4. Wait for Redirect to Dashboard
    // We wait until the URL contains 'dashboard' 
    await driver.wait(until.urlContains('dashboard'), 5000);
    
    // 5. Verify Success
    let currentUrl = await driver.getCurrentUrl();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('dashboard')) {
      console.log('✅ TEST PASSED: Successfully redirected to dashboard!');
    } else {
      console.log('❌ TEST FAILED: Did not redirect to dashboard.');
    }

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
  } finally {
    // Close the browser
    console.log('Closing browser...');
    await driver.quit();
  }
})();
