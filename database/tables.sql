USE petcareconnect;

-- ============================================
-- DROP EXISTING TABLES
-- ============================================
-- Drop in reverse dependency order.

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS pet_medical_records;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS provider_services;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;


-- ============================================
-- ROLES
-- ============================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;


-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    status ENUM('active', 'inactive', 'suspended')
        NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================
-- LOCATIONS
-- ============================================

CREATE TABLE locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    barangay VARCHAR(100) NOT NULL,
    street VARCHAR(255),
    city VARCHAR(100) NOT NULL DEFAULT 'Naga City',
    province VARCHAR(100) NOT NULL DEFAULT 'Camarines Sur',

    CONSTRAINT unique_location
        UNIQUE (barangay, street, city, province)
) ENGINE=InnoDB;


-- ============================================
-- PETS
-- ============================================

CREATE TABLE pets (
    pet_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    pet_name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    sex ENUM('male', 'female', 'unknown')
        NOT NULL DEFAULT 'unknown',
    birth_date DATE,
    weight DECIMAL(6,2),
    allergies TEXT,
    behavioral_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pets_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT check_pet_weight
        CHECK (weight IS NULL OR weight > 0)
) ENGINE=InnoDB;


-- ============================================
-- PROVIDERS
-- ============================================

CREATE TABLE providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    provider_name VARCHAR(150) NOT NULL,

    provider_type ENUM(
        'veterinary_clinic',
        'groomer',
        'pet_sitter',
        'trainer',
        'boarding'
    ) NOT NULL,

    description TEXT,
    contact_number VARCHAR(30),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    accepts_emergency BOOLEAN NOT NULL DEFAULT FALSE,
    is_24_7 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_providers_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_providers_location
        FOREIGN KEY (location_id)
        REFERENCES locations(location_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT unique_provider_user
        UNIQUE (user_id)
) ENGINE=InnoDB;


-- ============================================
-- SERVICES
-- ============================================

CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    duration_minutes INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,

    CONSTRAINT check_service_duration
        CHECK (duration_minutes > 0),

    CONSTRAINT check_service_price
        CHECK (base_price >= 0)
) ENGINE=InnoDB;


-- ============================================
-- PROVIDER SERVICES
-- ============================================

CREATE TABLE provider_services (
    provider_service_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_provider_services_provider
        FOREIGN KEY (provider_id)
        REFERENCES providers(provider_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_provider_services_service
        FOREIGN KEY (service_id)
        REFERENCES services(service_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT unique_provider_service
        UNIQUE (provider_id, service_id),

    CONSTRAINT check_provider_service_price
        CHECK (price >= 0)
) ENGINE=InnoDB;


-- ============================================
-- PROVIDER SCHEDULES
-- ============================================

CREATE TABLE schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,

    day_of_week ENUM(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ) NOT NULL,

    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,

    CONSTRAINT fk_schedules_provider
        FOREIGN KEY (provider_id)
        REFERENCES providers(provider_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT unique_provider_day
        UNIQUE (provider_id, day_of_week),

    CONSTRAINT check_schedule_time
        CHECK (opening_time < closing_time)
) ENGINE=InnoDB;


-- ============================================
-- APPOINTMENTS
-- ============================================

CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    provider_service_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,

    status ENUM(
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
    ) NOT NULL DEFAULT 'pending',

    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointments_pet
        FOREIGN KEY (pet_id)
        REFERENCES pets(pet_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointments_service
        FOREIGN KEY (provider_service_id)
        REFERENCES provider_services(provider_service_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================
-- PET MEDICAL RECORDS
-- ============================================

CREATE TABLE pet_medical_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    appointment_id INT,
    record_type VARCHAR(100) NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    notes TEXT,
    record_date DATE NOT NULL,

    CONSTRAINT fk_medical_pet
        FOREIGN KEY (pet_id)
        REFERENCES pets(pet_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_medical_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    provider_id INT NOT NULL,
    owner_id INT NOT NULL,
    rating INT NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_provider
        FOREIGN KEY (provider_id)
        REFERENCES providers(provider_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_reviews_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT unique_appointment_review
        UNIQUE (appointment_id),

    CONSTRAINT check_rating
        CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;