DROP DATABASE IF EXISTS pawssible;

CREATE DATABASE pawssible
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pawssible;

-- ============================================
-- ROLES
-- ============================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    phone_number VARCHAR(30),

    status ENUM(
        'active',
        'inactive',
        'suspended',
        'pending'
    ) NOT NULL DEFAULT 'pending',

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    last_login_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================
-- USER PREFERENCES
-- ============================================

CREATE TABLE user_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    adoption_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    assistance_notifications BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================
-- ORGANIZATIONS
-- ============================================

CREATE TABLE organizations (
    organization_id INT AUTO_INCREMENT PRIMARY KEY,

    organization_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,

    contact_email VARCHAR(150),
    contact_phone VARCHAR(30),

    service_area VARCHAR(255),
    website_url VARCHAR(255),

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================
-- ORGANIZATION MEMBERS
-- ============================================

CREATE TABLE organization_members (
    organization_member_id INT AUTO_INCREMENT PRIMARY KEY,

    organization_id INT NOT NULL,
    user_id INT NOT NULL,

    role_in_organization VARCHAR(100) NOT NULL,

    join_date DATE NOT NULL DEFAULT (CURRENT_DATE),

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_org_members_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(organization_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_org_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT unique_organization_member
        UNIQUE (organization_id, user_id)
) ENGINE=InnoDB;


-- ============================================
-- ANIMAL REPORTS
-- ============================================

CREATE TABLE animal_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,

    reporter_user_id INT NOT NULL,

    location_latitude DECIMAL(10,8),
    location_longitude DECIMAL(11,8),
    location_address VARCHAR(500),

    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    color VARCHAR(100),
    estimated_age VARCHAR(50),

    sex ENUM(
        'male',
        'female',
        'unknown'
    ) NOT NULL DEFAULT 'unknown',

    condition_description TEXT,

    report_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'pending',
        'verified',
        'in_progress',
        'resolved',
        'rejected',
        'closed'
    ) NOT NULL DEFAULT 'pending',

    admin_notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_animal_reports_reporter
        FOREIGN KEY (reporter_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT check_latitude
        CHECK (
            location_latitude IS NULL
            OR location_latitude BETWEEN -90 AND 90
        ),

    CONSTRAINT check_longitude
        CHECK (
            location_longitude IS NULL
            OR location_longitude BETWEEN -180 AND 180
        )
) ENGINE=InnoDB;


-- ============================================
-- REPORT IMAGES
-- ============================================

CREATE TABLE report_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,

    report_id INT NOT NULL,

    image_url VARCHAR(500) NOT NULL,

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_images_report
        FOREIGN KEY (report_id)
        REFERENCES animal_reports(report_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================
-- ANIMALS
-- ============================================

CREATE TABLE animals (
    animal_id INT AUTO_INCREMENT PRIMARY KEY,

    source_report_id INT UNIQUE,

    name VARCHAR(100),

    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    color VARCHAR(100),

    date_of_birth DATE,

    sex ENUM(
        'male',
        'female',
        'unknown'
    ) NOT NULL DEFAULT 'unknown',

    intake_date DATE,

    current_location VARCHAR(500),

    medical_history_summary TEXT,
    behavioral_notes TEXT,

    sterilization_status ENUM(
        'unknown',
        'not_sterilized',
        'sterilized'
    ) NOT NULL DEFAULT 'unknown',

    adoption_status ENUM(
        'not_available',
        'available',
        'application_pending',
        'adopted'
    ) NOT NULL DEFAULT 'not_available',

    status ENUM(
        'reported',
        'rescued',
        'under_care',
        'available_for_adoption',
        'adopted',
        'released',
        'deceased'
    ) NOT NULL DEFAULT 'reported',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_animals_source_report
        FOREIGN KEY (source_report_id)
        REFERENCES animal_reports(report_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================
-- ASSISTANCE REQUESTS
-- ============================================

CREATE TABLE assistance_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT NULL,
    report_id INT NULL,

    requester_user_id INT NOT NULL,

    request_type ENUM(
        'rescue',
        'transport',
        'veterinary',
        'shelter',
        'food',
        'other'
    ) NOT NULL,

    urgency_level ENUM(
        'low',
        'medium',
        'high',
        'critical'
    ) NOT NULL DEFAULT 'medium',

    description TEXT NOT NULL,

    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'pending',
        'assigned',
        'in_progress',
        'completed',
        'cancelled',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    resolution_notes TEXT,

    completed_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_assistance_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(animal_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_assistance_report
        FOREIGN KEY (report_id)
        REFERENCES animal_reports(report_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_assistance_requester
        FOREIGN KEY (requester_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================
-- ASSISTANCE ASSIGNMENTS
-- ============================================

CREATE TABLE assistance_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,

    request_id INT NOT NULL,
    assigned_user_id INT NOT NULL,

    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'assigned',
        'accepted',
        'declined',
        'completed'
    ) NOT NULL DEFAULT 'assigned',

    notes TEXT,

    completed_at TIMESTAMP NULL,

    CONSTRAINT fk_assignment_request
        FOREIGN KEY (request_id)
        REFERENCES assistance_requests(request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_user
        FOREIGN KEY (assigned_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================
-- MEDICAL RECORDS
-- ============================================

CREATE TABLE medical_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT NOT NULL,
    vet_user_id INT NULL,

    visit_date DATE NOT NULL,

    diagnosis TEXT,
    treatment_provided TEXT,
    medications_prescribed TEXT,

    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date DATE,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_medical_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(animal_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_medical_vet
        FOREIGN KEY (vet_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT check_follow_up_date
        CHECK (
            follow_up_required = FALSE
            OR follow_up_date IS NOT NULL
        )
) ENGINE=InnoDB;


-- ============================================
-- VACCINATIONS
-- ============================================

CREATE TABLE vaccinations (
    vaccination_id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT NOT NULL,

    vaccine_name VARCHAR(150) NOT NULL,

    vaccination_date DATE NOT NULL,
    next_due_date DATE,

    administered_by INT NULL,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vaccination_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(animal_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_vaccination_user
        FOREIGN KEY (administered_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================
-- ADOPTION LISTINGS
-- ============================================

CREATE TABLE adoption_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT NOT NULL UNIQUE,

    posted_by INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    description TEXT,
    adoption_requirements TEXT,

    status ENUM(
        'draft',
        'published',
        'paused',
        'adopted',
        'closed'
    ) NOT NULL DEFAULT 'draft',

    posted_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_listing_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(animal_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_listing_user
        FOREIGN KEY (posted_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================
-- ADOPTION APPLICATIONS
-- ============================================

CREATE TABLE adoption_applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT NOT NULL,
    applicant_user_id INT NOT NULL,

    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    home_type VARCHAR(100),
    has_other_pets BOOLEAN,
    has_children BOOLEAN,
    employment_status VARCHAR(100),

    references_info TEXT,

    home_visit_completed BOOLEAN NOT NULL DEFAULT FALSE,
    home_visit_date DATE,

    application_status ENUM(
        'pending',
        'under_review',
        'home_visit',
        'approved',
        'rejected',
        'withdrawn',
        'completed'
    ) NOT NULL DEFAULT 'pending',

    review_notes TEXT,

    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_animal
        FOREIGN KEY (animal_id)
        REFERENCES animals(animal_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_application_applicant
        FOREIGN KEY (applicant_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_application_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    notification_type VARCHAR(50) NOT NULL,

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    read_at TIMESTAMP NULL,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================
-- MESSAGES
-- ============================================

CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,

    sender_user_id INT NOT NULL,
    receiver_user_id INT NOT NULL,

    message_text TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    read_at TIMESTAMP NULL,

    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_receiver
        FOREIGN KEY (receiver_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================
-- EMAIL VERIFICATIONS
-- ============================================

CREATE TABLE email_verifications (
    verification_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    otp_hash VARCHAR(255) NOT NULL,

    expires_at DATETIME NOT NULL,

    verified_at DATETIME NULL,

    attempts INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_verification_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT check_verification_attempts
        CHECK (attempts >= 0)
) ENGINE=InnoDB;


-- ============================================
-- PASSWORD RESETS
-- ============================================

CREATE TABLE password_resets (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    otp_hash VARCHAR(255) NOT NULL,

    reset_token_hash VARCHAR(255),

    expires_at DATETIME NOT NULL,

    reset_token_expires_at DATETIME NULL,

    verified_at DATETIME NULL,

    used_at DATETIME NULL,

    attempts INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT check_reset_attempts
        CHECK (attempts >= 0)
) ENGINE=InnoDB;


-- ============================================
-- SYSTEM LOGS
-- ============================================

CREATE TABLE system_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    action_type VARCHAR(100) NOT NULL,

    action_description TEXT,

    ip_address VARCHAR(45),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================
-- ROLE DATA
-- ============================================

INSERT INTO roles (role_name, description) VALUES
(
    'community_member',
    'Community member who can report stray animals and request assistance.'
),
(
    'volunteer',
    'Volunteer who assists with rescue and animal welfare activities.'
),
(
    'rescuer',
    'Rescuer responsible for responding to rescue and assistance requests.'
),
(
    'organization_rep',
    'Representative of an animal welfare organization.'
),
(
    'vet_provider',
    'Veterinary service provider who handles animal medical care.'
),
(
    'admin',
    'System administrator responsible for managing and monitoring the system.'
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_role
    ON users(role_id);

CREATE INDEX idx_users_status
    ON users(status);

CREATE INDEX idx_org_members_user
    ON organization_members(user_id);

CREATE INDEX idx_org_members_organization
    ON organization_members(organization_id);

CREATE INDEX idx_reports_reporter
    ON animal_reports(reporter_user_id);

CREATE INDEX idx_reports_status
    ON animal_reports(status);

CREATE INDEX idx_reports_species
    ON animal_reports(species);

CREATE INDEX idx_reports_date
    ON animal_reports(report_date);

CREATE INDEX idx_report_images_report
    ON report_images(report_id);

CREATE INDEX idx_animals_species
    ON animals(species);

CREATE INDEX idx_animals_status
    ON animals(status);

CREATE INDEX idx_animals_adoption
    ON animals(adoption_status);

CREATE INDEX idx_animals_species_adoption
    ON animals(species, adoption_status);

CREATE INDEX idx_assistance_animal
    ON assistance_requests(animal_id);

CREATE INDEX idx_assistance_report
    ON assistance_requests(report_id);

CREATE INDEX idx_assistance_requester
    ON assistance_requests(requester_user_id);

CREATE INDEX idx_assistance_status
    ON assistance_requests(status);

CREATE INDEX idx_assistance_urgency
    ON assistance_requests(urgency_level);

CREATE INDEX idx_assignments_request
    ON assistance_assignments(request_id);

CREATE INDEX idx_assignments_user
    ON assistance_assignments(assigned_user_id);

CREATE INDEX idx_medical_animal
    ON medical_records(animal_id);

CREATE INDEX idx_medical_vet
    ON medical_records(vet_user_id);

CREATE INDEX idx_medical_date
    ON medical_records(visit_date);

CREATE INDEX idx_vaccinations_animal
    ON vaccinations(animal_id);

CREATE INDEX idx_vaccinations_due
    ON vaccinations(next_due_date);

CREATE INDEX idx_adoption_animal
    ON adoption_applications(animal_id);

CREATE INDEX idx_adoption_applicant
    ON adoption_applications(applicant_user_id);

CREATE INDEX idx_adoption_status
    ON adoption_applications(application_status);

CREATE INDEX idx_notifications_user
    ON notifications(user_id);

CREATE INDEX idx_notifications_read
    ON notifications(is_read);

CREATE INDEX idx_messages_sender
    ON messages(sender_user_id);

CREATE INDEX idx_messages_receiver
    ON messages(receiver_user_id);

CREATE INDEX idx_email_verification_user
    ON email_verifications(user_id);

CREATE INDEX idx_password_reset_user
    ON password_resets(user_id);

CREATE INDEX idx_system_logs_user
    ON system_logs(user_id);

CREATE INDEX idx_system_logs_action
    ON system_logs(action_type);

CREATE INDEX idx_system_logs_date
    ON system_logs(created_at);