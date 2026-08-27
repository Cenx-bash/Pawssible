USE petcareconnect;

-- ============================================
-- ROLES
-- ============================================

INSERT IGNORE INTO roles (role_name) VALUES
('pet_owner'),
('provider'),
('veterinarian'),
('admin');


-- ============================================
-- SERVICES
-- ============================================

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