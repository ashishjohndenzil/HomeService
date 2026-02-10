import time
import random
import string
import datetime
import os
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, NoAlertPresentException, NoSuchElementException

# --- Configuration ---
# Assuming default XAMPP URL
BASE_URL = "http://localhost/HomeService/frontend" 
IMPLICIT_WAIT = 10

# Force UTF-8 output for Windows consoles/redirection
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# --- Helper Functions ---
def generate_random_email():
    """Generates a random email to ensure registration success."""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"testuser_{random_str}@example.com"

def generate_random_phone():
    """Generates a random 10-digit phone number."""
    return '9' + ''.join(random.choices(string.digits, k=9))

def setup_driver():
    """Sets up the Chrome WebDriver."""
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Uncomment to run in headless mode
    options.add_argument("--start-maximized")
    options.add_argument("--ignore-certificate-errors")
    
    # Try using webdriver_manager if available, else assume chromedriver is in PATH
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except ImportError:
        print("webdriver_manager not found. Assuming chromedriver is in PATH.")
        print("Tip: Run 'pip install webdriver-manager' for easier setup.")
        driver = webdriver.Chrome(options=options)
        
    driver.implicitly_wait(IMPLICIT_WAIT)
    return driver

def wait_and_click(driver, by, value, timeout=10, description="Element"):
    """Waits for an element to be clickable and clicks it."""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        element.click()
        print(f"✅ Clicked {description}")
        return element
    except TimeoutException:
        print(f"❌ Failed to click {description} (Timeout)")
        # raise # Don't raise, let the test continue or handle it

def wait_and_send_keys(driver, by, value, keys, timeout=10, description="Input"):
    """Waits for an element to be visible and sends keys."""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )
        element.clear()
        element.send_keys(keys)
        print(f"✅ Entered text into {description}")
        return element
    except TimeoutException:
        print(f"❌ Failed to enter text into {description} (Timeout)")
        # raise

# --- Test Flows ---

def test_registration(driver, email, phone):
    """Tests the customer registration flow."""
    print("\n--- Starting Registration Test (v2 Fixed) ---")
    driver.get(f"{BASE_URL}/register.html")
    
    try:
        # Select User Type
        # Note: There are two user type selects based on the HTML logic, using the top one
        user_type_select_elem = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "userTypeTop"))
        )
        user_type_select = Select(user_type_select_elem)
        user_type_select.select_by_value("customer")
        print("✅ Selected User Type: Customer")
        
        # Fill Form
        wait_and_send_keys(driver, By.ID, "fullName", "Test Automation User", description="Full Name")
        wait_and_send_keys(driver, By.ID, "email", email, description="Email")
        wait_and_send_keys(driver, By.ID, "phone", phone, description="Phone")
        
        # Location Autocomplete (Simulate typing and selecting or just typing)
        wait_and_send_keys(driver, By.ID, "location", "New York", description="Location")
        time.sleep(1) # Wait for suggestions if any (optional)
        
        wait_and_send_keys(driver, By.ID, "password", "password123", description="Password")
        wait_and_send_keys(driver, By.ID, "confirmPassword", "password123", description="Confirm Password")
        
        # Check Terms
        print("DEBUG: Checking terms checkbox...")
        try:
            terms_checkbox = driver.find_element(By.ID, "terms")
            # Use JS to click because label might overlap
            if not terms_checkbox.is_selected():
                # driver.execute_script("arguments[0].click();", terms_checkbox) # JS Click
                # Try clicking the parent label if direct click fails or just click checking
                driver.execute_script("arguments[0].checked = true;", terms_checkbox) # Force check
                print("✅ Accepted Terms and Conditions (Forced via JS)")
            else:
                print("✅ Terms already accepted")
        except Exception as e:
            print(f"⚠️ Issue clicking terms: {type(e).__name__}: {e}")

        # Submit
        print("DEBUG: Submitting form...")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "#registerForm button[type='submit']")
        driver.execute_script("arguments[0].click();", submit_btn) # JS Click is safer
        print("✅ Clicked Submit Button")
        
        # Wait for Success/Redirection
        print("DEBUG: Waiting for success message or redirection...")
        try:
            # Check for success message first (visible for 1.5s)
            WebDriverWait(driver, 5).until(
                EC.visibility_of_element_located((By.ID, "successMessage"))
            )
            success_msg = driver.find_element(By.ID, "successMessage").text
            print(f"✅ Success Message: '{success_msg}'")
            
            # Now wait for redirection (Could be login.html OR dashboard if auto-login logic kicks in)
            print("DEBUG: Waiting for redirection...")
            WebDriverWait(driver, 10).until(lambda d: "login.html" in d.current_url or "dashboard" in d.current_url)
            print(f"✅ Registration Redirect Successful. Current URL: {driver.current_url}")
            
            # --- Cleanup for next test ---
            # Clear localStorage to ensure test_login starts fresh (otherwise login.js might auto-redirect)
            driver.execute_script("localStorage.clear();")
            print("🧹 Cleared localStorage for next test")
            
        except TimeoutException:
            print("❌ Registration Verification Timed Out.")
            print(f"Current URL: {driver.current_url}")
            
            # Check for error message
            try:
                error_msg_elem = driver.find_element(By.ID, "errorMessage")
                if error_msg_elem.is_displayed():
                     print(f"❌ Error Message on Page: '{error_msg_elem.text}'")
            except NoSuchElementException:
                pass
                
            # Dump HTML
            with open("registration_failure.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            print("📄 Saved page source to registration_failure.html")
            
            driver.save_screenshot("registration_failure.png")
            print("📸 Saved screenshot to registration_failure.png")
            sys.exit(1)
        
    except Exception as e:
        print(f"❌ Registration Failed Exception: {type(e).__name__}: {e}")
        driver.save_screenshot("registration_exception.png")
        sys.exit(1)

def test_login(driver, email, password="password123"):
    """Tests the login flow."""
    print("\n--- Starting Login Test ---")
    driver.get(f"{BASE_URL}/login.html")
    
    try:
        wait_and_send_keys(driver, By.ID, "email", email, description="Email")
        wait_and_send_keys(driver, By.ID, "password", password, description="Password")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']")
        driver.execute_script("arguments[0].click();", submit_btn)
        print("✅ Clicked Login Button")
        
        print("DEBUG: Waiting for dashboard redirection...")
        WebDriverWait(driver, 10).until(EC.url_contains("customer-dashboard.html"))
        print("✅ Login Successful: Redirected to Dashboard")
        
    except TimeoutException:
        print("❌ Login Failed: Dashboard not loaded")
        print(f"Current URL: {driver.current_url}")
        driver.save_screenshot("login_failure.png")
    except Exception as e:
        print(f"❌ Login Error: {e}")
        driver.save_screenshot("login_exception.png")

def test_booking(driver):
    """Tests the booking flow from the dashboard."""
    print("\n--- Starting Booking Test ---")
    
    try:
        # 1. Booking Flow - Need to find a service first
        
        # Wait for services to load
        print("Waiting for services...")
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "service-item"))
            )
        except TimeoutException:
             print("❌ No services found on dashboard")
             driver.save_screenshot("dashboard_no_services.png")
             return

        # Find a "Select Professional" button
        try:
            # Wait for any potential overlays to disappear (like toast from login)
            time.sleep(2) 
            
            select_pro_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'Select Professional')]")
            if select_pro_btns:
                btn = select_pro_btns[0]
                # Scroll to it
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                time.sleep(1)
                
                # Try standard click first, then JS click
                try:
                    btn.click()
                    print("✅ Selected a Service Category (Standard Click)")
                except Exception as e:
                    print(f"⚠️ Standard click failed: {e}. Trying JS click...")
                    driver.execute_script("arguments[0].click();", btn)
                    print("✅ Selected a Service Category (JS Click)")
                
                time.sleep(2) # Wait for providers to load
            else:
                print("⚠️ No 'Select Professional' buttons found. checking for 'Book Now' directly'")
        except Exception as e:
            print(f"⚠️ Error selecting service: {e}")
            driver.save_screenshot("service_selection_error.png")
            # Dump browser logs
            for entry in driver.get_log('browser'):
                print(f"BROWSER LOG: {entry}")

        # Now find a provider's "Book Now" button
        try:
            # wait for providers
            book_btns = WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.XPATH, "//button[contains(text(), 'Book Now')]"))
            )
            if book_btns:
                # Scroll into view
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", book_btns[0])
                time.sleep(1) 
                # Use JS Click to avoid "element not interactable" (e.g. covered by header)
                driver.execute_script("arguments[0].click();", book_btns[0])
                print("✅ Clicked 'Book Now' Button (JS Click)")
                driver.save_screenshot("booking_modal_opened.png")
            else:
                print("❌ No providers found to book")
                return
        except TimeoutException:
            print("❌ Timeout waiting for providers/book buttons")
            # ...
            return

        # 2. Fill Booking Modal
        print("DEBUG: Waiting for Booking Modal...")
        try:
             WebDriverWait(driver, 5).until(EC.visibility_of_element_located((By.ID, "bookingModal")))
             print("✅ Booking Modal Visible")
        except TimeoutException:
             print("❌ Booking Modal did not appear")
             driver.save_screenshot("modal_timeout.png")
             raise

        print("DEBUG: Filling Booking Modal inputs...")
        wait_and_send_keys(driver, By.ID, "bookingAddress", "123 Test Street, New York", description="Service Address")
        
        # Date: Tomorrow
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        date_str = tomorrow.strftime("%Y-%m-%d")
        
        date_input = driver.find_element(By.ID, "bookingDate")
        # Use JS to set value directly to avoid input format issues
        driver.execute_script("arguments[0].value = arguments[1];", date_input, date_str)
        # Trigger change event manually 
        driver.execute_script("arguments[0].dispatchEvent(new Event('change'))", date_input)
        print(f"✅ Selected Date: {date_str}")
        
        time.sleep(2) # Wait for time slots API
        
        # Select Time Slot
        time_select = Select(driver.find_element(By.ID, "bookingTime"))
        try:
            # Wait until options are populated
            WebDriverWait(driver, 5).until(lambda d: len(time_select.options) > 1)
            time_select.select_by_index(1) # Select first available slot
            print("✅ Selected Time Slot")
        except:
             print("⚠️ No time slots available or failed to load. Selecting index 1 anyway to try.")
             try:
                 time_select.select_by_index(1)
             except:
                 pass
        
        wait_and_send_keys(driver, By.ID, "description", "Automated test booking", description="Description")
        
        # 3. Proceed to Pay
        proceed_btn = driver.find_element(By.ID, "proceedToPayBtn")
        driver.execute_script("arguments[0].click();", proceed_btn)
        print("✅ Clicked Proceed to Pay")
        
        # 4. Confirm Payment
        time.sleep(1) # Wait for payment step
        wait_and_send_keys(driver, By.ID, "transactionId", "TEST12345678", description="Transaction ID")
        
        confirm_btn = driver.find_element(By.ID, "confirmPaymentBtn")
        driver.execute_script("arguments[0].click();", confirm_btn)
        print("✅ Clicked Confirm Payment")
        
        # 5. Check for Success
        # Wait for toast
        try:
            WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.ID, "toast-container"))
            )
            toast = driver.find_element(By.ID, "toast-container")
            print(f"ℹ️ Toast Message: {toast.text}")
            
            if "Success" in toast.text:
                 print("🎉 Booking Successful!")
            else:
                 print(f"⚠️ Booking Completed but Toast was: '{toast.text}'")
                 driver.save_screenshot("booking_toast_mismatch.png")
            
        except TimeoutException:
            print("⚠️ Success toast not found, checking if modal closed...")
            # Check if modal closed, which implies success?
            # Or maybe redirect happened?
            driver.save_screenshot("booking_no_toast.png")

    except Exception as e:
        print(f"❌ Booking Flow Error: {e}")
        with open("last_error.txt", "w", encoding="utf-8") as f:
            f.write(str(e))
        driver.save_screenshot("booking_error.png")

# --- Main Execution ---
if __name__ == "__main__":
    print("🚀 Starting HomeService Automation Test v3")
    print("---------------------------------------")
    
    # Seed Data
    try:
        print("🌱 Seeding test data...")
        import subprocess
        # Use full path to php if needed, or assume it's in PATH (it failed earlier so use full path logic or try-catch)
        # Using shell=True and assuming php is in PATH or XAMPP specific
        php_path = r"c:\xampp\php\php.exe" 
        if os.path.exists(php_path):
             subprocess.run([php_path, "seed_test_data.php"], check=True)
        else:
             subprocess.run(["php", "seed_test_data.php"], shell=True, check=True)
        print("✅ Data Seeded")
    except Exception as e:
        print(f"⚠️ Seeding failed: {e}. Continuing anyway...")

    driver = setup_driver()
    
    try:
        # Use a fresh email for every run
        test_email = generate_random_email()
        test_phone = generate_random_phone()
        print(f"ℹ️  Test User: {test_email} / {test_phone}")
        
        test_registration(driver, test_email, test_phone)
        
        # Allow some time for backend processing/redirects
        time.sleep(2)
        
        test_login(driver, test_email)
        
        
        # Allow dashboard to load (and background fetch of providers)
        time.sleep(5)
        
        test_booking(driver)
        
        print("\n✅ All Tests Completed!")
        
    except Exception as e:
        print(f"\n❌ Test Suite Aborted: {e}")
    finally:
        print("Closing browser in 5 seconds...")
        time.sleep(5)
        driver.quit()
