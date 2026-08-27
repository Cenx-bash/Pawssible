USE petcareconnect;

CREATE INDEX idx_users_role
ON users(role_id);

CREATE INDEX idx_pets_owner
ON pets(owner_id);

CREATE INDEX idx_pets_species
ON pets(species);

CREATE INDEX idx_providers_location
ON providers(location_id);

CREATE INDEX idx_providers_type
ON providers(provider_type);

CREATE INDEX idx_provider_services_provider
ON provider_services(provider_id);

CREATE INDEX idx_provider_services_service
ON provider_services(service_id);

CREATE INDEX idx_schedules_provider_day
ON schedules(provider_id, day_of_week);

CREATE INDEX idx_appointments_pet
ON appointments(pet_id);

CREATE INDEX idx_appointments_provider_service
ON appointments(provider_service_id);

CREATE INDEX idx_appointments_date
ON appointments(appointment_date);

CREATE INDEX idx_medical_records_pet
ON pet_medical_records(pet_id);

CREATE INDEX idx_reviews_provider
ON reviews(provider_id);

CREATE INDEX idx_reviews_owner
ON reviews(owner_id);