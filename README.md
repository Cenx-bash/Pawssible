# PetCareConnect

A web-based pet care management and service platform designed to help pet owners manage their pets, access pet care services, schedule appointments, and maintain pet medical records.

PetCareConnect connects **pet owners**, **veterinary clinics**, **service providers**, and administrators in one centralized system.

---

## Table of Contents

* [Project Overview](#project-overview)
* [Objectives](#objectives)
* [Features](#features)
* [User Roles](#user-roles)
* [Technology Stack](#technology-stack)
* [System Architecture](#system-architecture)
* [Database Architecture](#database-architecture)
* [Database Tables](#database-tables)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Database Setup](#database-setup)
* [Backend Setup](#backend-setup)
* [Environment Variables](#environment-variables)
* [Running the Project](#running-the-project)
* [Project Structure](#project-structure)
* [API Structure](#api-structure)
* [Development Workflow](#development-workflow)
* [Testing](#testing)
* [Troubleshooting](#troubleshooting)
* [Future Improvements](#future-improvements)
* [Contributors](#contributors)
* [License](#license)

---

## Project Overview

**PetCareConnect** is a web application that provides a centralized platform for managing pet-related information and services.

The system allows pet owners to:

* Register and manage their accounts.
* Add and manage their pets.
* View pet information.
* Manage pet medical records.
* Browse available pet care services.
* Find service providers.
* Schedule appointments.
* View appointment information.
* Leave reviews for completed services.

Service providers can manage their services, schedules, and appointments, while administrators can manage the overall platform.

---

## Objectives

The main objectives of PetCareConnect are:

1. Provide pet owners with a centralized platform for managing their pets.
2. Make pet care services easier to discover and access.
3. Simplify appointment scheduling.
4. Maintain organized pet medical records.
5. Connect pet owners with veterinary and other pet care providers.
6. Provide service providers with tools for managing their services and schedules.
7. Provide administrators with centralized system management.
8. Reduce manual processes involved in managing pet care information.

---

## Features

### Authentication

* User registration
* User login
* Password hashing
* Role-based access
* Account status management
* Secure authentication

### Pet Management

Pet owners can:

* Add pets
* View pets
* Update pet information
* Delete pets
* Store pet species
* Store breed
* Store sex
* Store birth date
* Store weight
* Store allergies
* Store behavioral notes

### Service Management

The system supports services such as:

* Veterinary Consultation
* Pet Grooming
* Pet Vaccination
* Pet Boarding
* Pet Training

Each service can contain:

* Service name
* Description
* Duration
* Base price

### Provider Management

Service providers can have:

* Provider information
* Provider type
* Location
* Contact information
* Verification status
* Emergency availability
* 24/7 availability

### Appointment Management

Appointments contain:

* Pet
* Service provider
* Service
* Appointment date
* Appointment time
* Status
* Notes

Supported appointment statuses:

* `pending`
* `confirmed`
* `completed`
* `cancelled`
* `no_show`

### Medical Records

Pet medical records can store:

* Record type
* Diagnosis
* Treatment
* Medication
* Notes
* Record date
* Related appointment

### Reviews

Pet owners can leave reviews for completed appointments.

Reviews include:

* Rating
* Review text
* Provider
* Pet owner
* Appointment
* Creation date

Ratings range from **1 to 5**.

---

# User Roles

PetCareConnect currently supports four main roles.

| Role           | Description                                           |
| -------------- | ----------------------------------------------------- |
| `pet_owner`    | Manages pets, appointments, and reviews               |
| `provider`     | Manages pet care services and schedules               |
| `veterinarian` | Provides veterinary-related services and medical care |
| `admin`        | Manages the overall system                            |

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript
* Responsive web design

## Backend

* Node.js
* Express.js
* REST API

## Database

* MySQL 8.0+
* InnoDB storage engine
* Relational database design

## Authentication

* bcrypt
* Session/token-based authentication depending on implementation

## Development Tools

* Visual Studio Code
* Git
* GitHub
* MySQL CLI
* MySQL Workbench
* XAMPP, if used for local database management

---

# System Architecture

PetCareConnect follows a client-server architecture.

```text
                    PETCARECONNECT
                          |
             +------------+------------+
             |                         |
          Frontend                  Backend
             |                         |
       HTML / CSS / JS            Node.js
                                       |
                                   Express.js
                                       |
                                  REST API
                                       |
                                       |
                                   MySQL
                                       |
                         +-------------+-------------+
                         |             |             |
                       Users          Pets       Appointments
                         |             |             |
                     Providers     Medical       Services
                                   Records
```

### Frontend

The frontend provides the user interface for:

* Login
* Registration
* Dashboard
* Pet management
* Services
* Providers
* Appointments
* Medical records
* Reviews

### Backend

The Node.js backend handles:

* Authentication
* API requests
* Business logic
* Database operations
* Validation
* Authorization

### Database

MySQL stores:

* User accounts
* Roles
* Pets
* Providers
* Locations
* Services
* Schedules
* Appointments
* Medical records
* Reviews

---

# Database Architecture

The database is named:

```text
petcareconnect
```

The database follows a relational structure using primary keys and foreign keys.

Main relationships include:

```text
roles
  |
  +---- users
           |
           +---- pets
           |      |
           |      +---- appointments
           |      |
           |      +---- pet_medical_records
           |
           +---- providers
                    |
                    +---- provider_services
                    |         |
                    |         +---- services
                    |
                    +---- schedules
                    |
                    +---- locations
```

---

# Database Tables

PetCareConnect contains the following main tables:

## `roles`

Stores available user roles.

Important fields:

```text
role_id
role_name
```

---

## `users`

Stores registered users.

Important fields:

```text
user_id
role_id
first_name
last_name
email
password_hash
phone
status
created_at
```

Passwords should never be stored as plain text.

Example:

```text
$2a$10$...
```

indicates a bcrypt password hash.

---

## `pets`

Stores pet information.

Important fields:

```text
pet_id
owner_id
pet_name
species
breed
sex
birth_date
weight
allergies
behavioral_notes
created_at
```

The `owner_id` connects each pet to a user.

Example relationship:

```text
users.user_id
       |
       |
       v
pets.owner_id
```

---

## `locations`

Stores provider locations.

Important fields:

```text
location_id
barangay
street
city
province
```

The default location is:

```text
Naga City
Camarines Sur
```

---

## `providers`

Stores service provider information.

Important fields:

```text
provider_id
user_id
location_id
provider_name
provider_type
description
contact_number
is_verified
accepts_emergency
is_24_7
created_at
```

Supported provider types:

```text
veterinary_clinic
groomer
pet_sitter
trainer
boarding
```

---

## `services`

Stores available services.

Important fields:

```text
service_id
service_name
description
duration_minutes
base_price
```

Example services:

```text
Veterinary Consultation
Pet Grooming
Pet Vaccination
Pet Boarding
Pet Training
```

---

## `provider_services`

Connects providers to the services they offer.

Important fields:

```text
provider_service_id
provider_id
service_id
price
```

This allows different providers to charge different prices for the same service.

---

## `schedules`

Stores provider schedules.

Important fields:

```text
schedule_id
provider_id
day_of_week
opening_time
closing_time
```

Each provider can have a schedule for each day of the week.

---

## `appointments`

Stores pet care appointments.

Important fields:

```text
appointment_id
pet_id
provider_service_id
appointment_date
appointment_time
status
notes
created_at
```

---

## `pet_medical_records`

Stores medical information associated with pets.

Important fields:

```text
record_id
pet_id
appointment_id
record_type
diagnosis
treatment
medication
notes
record_date
```

---

## `reviews`

Stores provider reviews.

Important fields:

```text
review_id
appointment_id
provider_id
owner_id
rating
review_text
created_at
```

The rating must be between:

```text
1 - 5
```

---

# Prerequisites

Before installing PetCareConnect, make sure the following are installed.

### Node.js

Check:

```bash
node --version
```

and:

```bash
npm --version
```

### MySQL

Check:

```bash
mysql --version
```

You should have MySQL 8.0 or later.

### Git

Check:

```bash
git --version
```

### Visual Studio Code

Recommended for development.

---

# Installation

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project directory:

```bash
cd petcareconnect
```

---

## 2. Install Node Dependencies

Run:

```bash
npm install
```

This installs the dependencies listed in `package.json`.

---

# Database Setup

## 1. Start MySQL

Make sure your MySQL server is running.

On Linux:

```bash
sudo systemctl start mysql
```

Check the status:

```bash
sudo systemctl status mysql
```

---

## 2. Open MySQL

```bash
mysql -u root -p
```

Enter your MySQL password.

---

## 3. Create the Database

```sql
CREATE DATABASE IF NOT EXISTS petcareconnect;
```

Select the database:

```sql
USE petcareconnect;
```

---

## 4. Create the Tables

Run the project's database schema SQL file.

For example:

```bash
mysql -u root -p petcareconnect < database/schema.sql
```

If the SQL file is stored somewhere else, change the path accordingly.

---

## 5. Insert Initial Data

The project can include seed data for roles and services.

Example:

```sql
INSERT IGNORE INTO roles (role_name) VALUES
('pet_owner'),
('provider'),
('veterinarian'),
('admin');
```

Example services:

```sql
INSERT IGNORE INTO services (
    service_name,
    description,
    duration_minutes,
    base_price
) VALUES
(
    'Veterinary Consultation',
    'General veterinary consultation for pets.',
    30,
    500.00
),
(
    'Pet Grooming',
    'Basic grooming service for dogs and cats.',
    60,
    800.00
),
(
    'Pet Vaccination',
    'Routine vaccination service.',
    30,
    600.00
),
(
    'Pet Boarding',
    'Temporary boarding and care for pets.',
    1440,
    1000.00
),
(
    'Pet Training',
    'Basic obedience and behavior training.',
    60,
    700.00
);
```

---

# Checking the Database

After creating the database, verify it using:

```bash
mysql -u root -p
```

Then:

```sql
USE petcareconnect;
```

Check the tables:

```sql
SHOW TABLES;
```

Check pets:

```sql
SELECT * FROM pets;
```

Because the primary key is named `pet_id`, not `id`, use:

```sql
SELECT pet_id, pet_name, species, breed, sex
FROM pets;
```

Check users:

```sql
SELECT user_id, first_name, last_name, email
FROM users;
```

Check services:

```sql
SELECT * FROM services;
```

---

# Backend Setup

Create an environment file:

```text
.env
```

Example:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=petcareconnect

SESSION_SECRET=your_secret_key
```

Do not commit `.env` to GitHub.

Add it to `.gitignore`:

```gitignore
.env
node_modules/
```

---

# Environment Variables

| Variable         | Description                                     |
| ---------------- | ----------------------------------------------- |
| `PORT`           | Port used by the Node.js server                 |
| `DB_HOST`        | MySQL server host                               |
| `DB_PORT`        | MySQL server port                               |
| `DB_USER`        | MySQL username                                  |
| `DB_PASSWORD`    | MySQL password                                  |
| `DB_NAME`        | Database name                                   |
| `SESSION_SECRET` | Secret used for authentication/session security |

Example:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=petcareconnect
SESSION_SECRET=petcareconnect_secret
```

---

# Running the Project

Start the backend using:

```bash
npm start
```

If the project uses a development script:

```bash
npm run dev
```

The application should normally be available at:

```text
http://localhost:3000
```

---

# Project Structure

A recommended project structure is:

```text
petcareconnect/
│
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   │
│   ├── js/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── pets.js
│   │   └── appointments.js
│   │
│   ├── images/
│   │
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── pets.html
│   ├── services.html
│   └── appointments.html
│
├── routes/
│   ├── auth.js
│   ├── pets.js
│   ├── services.js
│   ├── providers.js
│   ├── appointments.js
│   └── medicalRecords.js
│
├── controllers/
│   ├── authController.js
│   ├── petController.js
│   ├── serviceController.js
│   └── appointmentController.js
│
├── middleware/
│   ├── auth.js
│   └── roleCheck.js
│
├── config/
│   └── database.js
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

The exact structure may differ depending on the current implementation.

---

# API Structure

The backend uses REST-style API endpoints.

## Authentication

### Register

```http
POST /api/auth/register
```

### Login

```http
POST /api/auth/login
```

### Logout

```http
POST /api/auth/logout
```

---

## Pets

### Get Pets

```http
GET /api/pets
```

### Get One Pet

```http
GET /api/pets/:pet_id
```

### Add Pet

```http
POST /api/pets
```

### Update Pet

```http
PUT /api/pets/:pet_id
```

### Delete Pet

```http
DELETE /api/pets/:pet_id
```

---

## Services

### Get Services

```http
GET /api/services
```

### Get Service

```http
GET /api/services/:service_id
```

---

## Providers

### Get Providers

```http
GET /api/providers
```

### Get Provider

```http
GET /api/providers/:provider_id
```

---

## Appointments

### Get Appointments

```http
GET /api/appointments
```

### Create Appointment

```http
POST /api/appointments
```

### Update Appointment

```http
PUT /api/appointments/:appointment_id
```

### Cancel Appointment

```http
DELETE /api/appointments/:appointment_id
```

---

## Medical Records

### Get Pet Medical Records

```http
GET /api/pets/:pet_id/medical-records
```

### Add Medical Record

```http
POST /api/pets/:pet_id/medical-records
```

---

## Reviews

### Create Review

```http
POST /api/reviews
```

### Get Provider Reviews

```http
GET /api/providers/:provider_id/reviews
```

---

# Development Workflow

A recommended development workflow is:

```text
1. Create or update feature
          |
          v
2. Update frontend
          |
          v
3. Create/update API endpoint
          |
          v
4. Connect API to MySQL
          |
          v
5. Test functionality
          |
          v
6. Check database records
          |
          v
7. Commit changes
          |
          v
8. Push to GitHub
```

---

## Git Workflow

Check your current changes:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Add pet management functionality"
```

Push:

```bash
git push
```

---

# Testing

Before considering a feature complete, test:

### Authentication

* [ ] User registration works.
* [ ] Login works.
* [ ] Incorrect passwords are rejected.
* [ ] Passwords are stored as bcrypt hashes.
* [ ] Logout works.
* [ ] Unauthorized users cannot access protected pages.

### Pet Management

* [ ] User can add a pet.
* [ ] User can view their pets.
* [ ] User can edit a pet.
* [ ] User can delete a pet.
* [ ] Pet belongs to the correct owner.
* [ ] Dashboard pet count matches the actual database count.

### Services

* [ ] Services load correctly.
* [ ] Service information displays correctly.
* [ ] Prices display correctly.

### Appointments

* [ ] User can create appointments.
* [ ] Appointment information is stored correctly.
* [ ] Appointment status updates correctly.
* [ ] Cancelled appointments are handled correctly.

### Database

Check the actual number of pets:

```sql
SELECT COUNT(*) AS total_pets
FROM pets;
```

Check all pets:

```sql
SELECT
    pet_id,
    owner_id,
    pet_name,
    species,
    breed,
    sex
FROM pets;
```

This is useful when the dashboard shows a different number of pets than the Pets page.

---

# Troubleshooting

## MySQL Connection Error

If Node.js cannot connect to MySQL, check:

```bash
sudo systemctl status mysql
```

Then verify your `.env` configuration:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=petcareconnect
```

---

## Database Does Not Exist

Check:

```sql
SHOW DATABASES;
```

If `petcareconnect` is missing:

```sql
CREATE DATABASE petcareconnect;
```

---

## Tables Are Missing

Run:

```sql
USE petcareconnect;
SHOW TABLES;
```

If the tables are missing, execute the schema file again.

---

## Pet Page Shows One Pet but Dashboard Shows Two

Check the actual database:

```sql
SELECT COUNT(*) AS total_pets
FROM pets;
```

Then:

```sql
SELECT
    pet_id,
    owner_id,
    pet_name,
    species,
    breed
FROM pets;
```

If the database contains only one pet but the dashboard displays two, the issue is most likely in the dashboard's API/query logic rather than the database.

Also check that both pages are using the same API endpoint and authenticated user.

---

## `Unknown column 'id'`

The PetCareConnect database uses:

```text
pet_id
```

not:

```text
id
```

Therefore this is incorrect:

```sql
SELECT id, name
FROM pets;
```

Use:

```sql
SELECT pet_id, pet_name
FROM pets;
```

---

## Port 3000 Already in Use

Check which process is using port 3000:

```bash
sudo lsof -i :3000
```

You can terminate the process if necessary:

```bash
kill <PROCESS_ID>
```

Then start the server again:

```bash
npm start
```

---

## API Returns "PetCareConnect API is running"

If visiting:

```text
http://localhost:3000
```

shows:

```json
{
    "message": "PetCareConnect API is running",
    "status": "success"
}
```

the Node.js server is running, but the root route is currently serving the API response instead of the frontend login page.

The Express server should be configured to serve the frontend files if the project is intended to serve both frontend and backend.

---

# Security

PetCareConnect should follow basic security practices.

### Passwords

Never store plain-text passwords.

Use bcrypt:

```text
Plain password
      |
      v
   bcrypt
      |
      v
Password hash
```

### Environment Variables

Never commit database passwords or secrets.

Do not upload:

```text
.env
```

to GitHub.

### SQL Injection

Use parameterized queries instead of directly inserting user input into SQL statements.

Example:

```js
const [rows] = await db.execute(
    "SELECT * FROM pets WHERE owner_id = ?",
    [ownerId]
);
```

Avoid:

```js
const query = `SELECT * FROM pets WHERE owner_id = ${ownerId}`;
```

### Authorization

Users should only be able to access resources they are authorized to access.

For example:

```text
User A
  |
  +---- Pet A ✓
  |
  +---- Pet B ✗
```

---

# Future Improvements

Possible future features include:

* Online payment integration
* Email notifications
* SMS appointment reminders
* Real-time appointment notifications
* Provider verification
* Pet vaccination reminders
* Pet vaccination tracking
* Digital veterinary records
* Pet adoption services
* Lost pet reporting
* Map-based provider search
* Advanced search and filtering
* Provider analytics dashboard
* Admin analytics dashboard
* Mobile application
* Cloud deployment
* Automated database backups
* Two-factor authentication

---

# Deployment

For production deployment, the following components can be hosted separately:

```text
Frontend
   |
   v
Web Hosting / CDN
   |
   v
Node.js API Server
   |
   v
Cloud MySQL Database
```

Before deployment:

* Configure production environment variables.
* Disable development debugging.
* Use HTTPS.
* Secure database credentials.
* Configure CORS correctly.
* Use a production database.
* Enable database backups.
* Use secure session/authentication configuration.

---

# Contributing

Contributions should follow the project's development workflow.

1. Create a branch.

```bash
git checkout -b feature/feature-name
```

2. Make your changes.

3. Test the changes.

4. Commit the changes.

```bash
git add .
git commit -m "Add feature name"
```

5. Push the branch.

```bash
git push origin feature/feature-name
```

6. Create a Pull Request.

---

# Contributors

**PetCareConnect Development Team**

Developed as an academic/project system for **BS Information Systems**.

### Development Areas

* Frontend Development
* Backend Development
* Database Design
* UI/UX Design
* System Analysis
* Documentation
* Testing

---

# License

This project is intended for academic and educational purposes.

Copyright © 2026 PetCareConnect Development Team.

All rights reserved.
