# Home Service Booking Application

A web-based platform for connecting users with reliable household service providers.

## Project Structure

```
HomeService/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── backend/
│   ├── config.php
│   ├── db_schema.sql
│   └── api/
│       └── services.php
└── README.md
```

## Technologies

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: PHP
- **Database**: MySQL

## Features

- User registration and authentication
- Service provider profiles
- Service browsing and search
- Booking management
- Rating and reviews system

## Setup Instructions

### Database Setup

1. Create a MySQL database
2. Run `backend/db_schema.sql` to create tables
3. Update database credentials in `backend/config.php`

### Running the Application

1. Place the project in your web server directory (Apache/Nginx)
2. Update the database configuration
3. Access via `http://localhost/HomeService/frontend/`

## Database Schema

- **users**: User accounts (customers, providers, admins)
- **services**: Available services
- **providers**: Service provider profiles
- **bookings**: Service bookings
- **reviews**: Customer reviews and ratings
