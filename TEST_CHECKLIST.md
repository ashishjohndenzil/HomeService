# Google Sign-In Integration - Complete Test Checklist

## Test Environment Setup
- URL: http://localhost/HomeService/
- Backend: Apache (XAMPP running)
- Database: MySQL (home_service_booking)
- Browser: Chrome or Firefox with DevTools available

## Pre-Test Verification

### Backend Files ✅
- [x] `backend/api/google-login.php` - Returns `id` instead of `user_id`
- [x] `backend/api/google-register.php` - Returns `id` instead of `user_id`
- [x] `backend/config.php` - Contains Google OAuth credentials
- [x] Database users table has `auth_provider`, `id`, `user_type` columns

### Frontend Files ✅
- [x] `frontend/login.html` - Has Google Sign-In meta tag and button
- [x] `frontend/register.html` - Has Google Sign-In meta tag and button
- [x] `frontend/js/login.js` - `handleGoogleLogin()` has console.log statements
- [x] `frontend/js/register.js` - `handleGoogleRegister()` has console.log statements
- [x] Both JS files check for `data.user.user_type` (not `user_id`)

## Test Case 1: New Google User - Login Path

### Steps:
1. Open http://localhost/HomeService/frontend/login.html
2. Click "Sign in with Google" button
3. Complete Google authentication
4. Check browser console (F12 → Console)

### Expected Console Output (in order):
```
Google login credential received
Decoded user info: {email: "...", name: "...", picture: "...", ...}
Sending to backend...
Backend response status: 200
Backend response: {success: true, user: {...}, token: "..."}
Storing user data...
Redirecting to dashboard...
```

### Expected Result:
- ✅ No errors in console
- ✅ localStorage contains 'user' and 'token' keys
- ✅ Redirected to customer-dashboard.html
- ✅ New row created in users table with auth_provider='google'

## Test Case 2: New Google User - Registration Path

### Steps:
1. Open http://localhost/HomeService/frontend/register.html
2. Click "Sign up with Google" button
3. Complete Google authentication
4. Select user type (1 for Customer, 2 for Provider)
5. Check browser console (F12 → Console)

### Expected Console Output:
```
Google register credential received
Decoded user info: {email: "...", name: "...", picture: "...", ...}
Sending registration to backend with type: customer
Backend response status: 200
Backend response: {success: true, user: {...}, token: "..."}
Storing user data...
Redirecting...
```

### Expected Result:
- ✅ No errors in console
- ✅ User prompted for user type
- ✅ localStorage contains 'user' with correct user_type
- ✅ Redirected to customer-dashboard.html or provider-dashboard.html based on selection
- ✅ New row created in users table with correct auth_provider and user_type

## Test Case 3: Existing Google User - Second Login

### Steps:
1. Use same Google account as Test Case 1
2. Open http://localhost/HomeService/frontend/login.html
3. Click "Sign in with Google"
4. Check console and database

### Expected Result:
- ✅ Same console output as Test Case 1
- ✅ No new row created in database
- ✅ last_login timestamp updated for existing user
- ✅ Successful redirect to dashboard

## Test Case 4: Error Handling - Invalid Credentials

### Steps:
1. Open browser console and run:
   ```javascript
   window.handleGoogleLogin({credential: "invalid.token.here"})
   ```
2. Watch console

### Expected Result:
- ✅ Console shows error handling
- ✅ Error message displayed: "Failed to decode Google credentials"
- ✅ No redirect occurs

## Test Case 5: Network Error Handling

### Steps:
1. Simulate offline: DevTools → Network → Offline
2. Open http://localhost/HomeService/frontend/login.html
3. Click "Sign in with Google"
4. Check console

### Expected Result:
- ✅ Console shows: "Google login error: [network error]"
- ✅ User-friendly error message displayed
- ✅ Error message includes "Check browser console for details"
- ✅ No redirect occurs

## Test Case 6: Backend Error Response

### Steps:
1. Open browser DevTools → Network tab
2. Click "Sign in with Google" on login page
3. Watch network request to google-login.php
4. Check response data

### Expected Result (for existing user):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 123,
    "full_name": "John Doe",
    "email": "john@example.com",
    "user_type": "customer",
    "profile_picture": "https://..."
  },
  "token": "abc123..."
}
```

### Expected Result (for new user):
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 124,
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "user_type": "customer",
    "profile_picture": "https://..."
  },
  "token": "def456..."
}
```

## Test Case 7: Dashboard Redirect Verification

### Steps:
1. Complete Google Sign-In on login page
2. Check localStorage in DevTools → Application → Storage → Local Storage
3. Verify user data structure

### Expected localStorage Contents:
```javascript
// Key: 'user'
{
  "id": 123,
  "full_name": "John Doe",
  "email": "john@example.com",
  "user_type": "customer",
  "profile_picture": "https://..."
}

// Key: 'token'
"abc123def456..."
```

## Test Case 8: Customer vs Provider Dashboard

### Steps:
1. Register as Customer - Click 1
2. Verify redirect to customer-dashboard.html
3. Check that navbar shows correct user data
4. Log out and register as Provider - Click 2
5. Verify redirect to provider-dashboard.html

### Expected Result:
- ✅ Customer → customer-dashboard.html
- ✅ Provider → provider-dashboard.html
- ✅ Dashboard displays user's profile picture and name
- ✅ Correct user type shown in navigation

## Debugging Commands

If issues occur, run these in browser console:

```javascript
// Check stored user data
console.log(JSON.parse(localStorage.getItem('user')));

// Check stored token
console.log(localStorage.getItem('token'));

// Parse JWT token manually (for debugging)
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
}

// Use it:
// parseJwt(yourCredentialToken)
```

## Database Verification

After each test, verify data in MySQL:

```sql
-- Check Google users
SELECT id, full_name, email, auth_provider, user_type, created_at FROM users 
WHERE auth_provider = 'google' 
ORDER BY created_at DESC;

-- Check specific user
SELECT * FROM users WHERE email = 'john@example.com';

-- Count total Google users
SELECT COUNT(*) FROM users WHERE auth_provider = 'google';
```

## Success Criteria - All Must Pass ✅

1. **Authentication Flow**
   - [ ] Google login completes without errors
   - [ ] Google registration completes with user type selection
   - [ ] Existing users can log in repeatedly

2. **Data Integrity**
   - [ ] User data stored correctly in localStorage
   - [ ] Backend returns correct JSON structure
   - [ ] Database records created/updated correctly
   - [ ] `id` field (not `user_id`) in response

3. **Redirection**
   - [ ] After login: redirected to appropriate dashboard
   - [ ] After registration: redirected to appropriate dashboard
   - [ ] 500ms delay ensures async operations complete
   - [ ] No premature redirects

4. **Debugging**
   - [ ] All console.log statements output as expected
   - [ ] Error messages are clear and helpful
   - [ ] Network responses visible in DevTools
   - [ ] localStorage values correct

5. **Error Handling**
   - [ ] Network errors handled gracefully
   - [ ] Invalid credentials handled
   - [ ] Backend errors displayed to user
   - [ ] No silent failures

## Notes

- Refresh page clears Google Sign-In button state (normal behavior)
- First-time users automatically created as 'customer' type in google-login.php
- Registration allows choice between 'customer' and 'provider'
- All timestamps are UTC in database
- Token is randomly generated (not JWT from Google) for session management
