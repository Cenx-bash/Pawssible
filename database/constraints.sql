USE petcareconnect;

-- Pet weight must be greater than 0 when provided
ALTER TABLE pets
ADD CONSTRAINT check_pet_weight
CHECK (weight IS NULL OR weight > 0);

-- Service duration must be positive
ALTER TABLE services
ADD CONSTRAINT check_service_duration
CHECK (duration_minutes > 0);

-- Service base price cannot be negative
ALTER TABLE services
ADD CONSTRAINT check_service_base_price
CHECK (base_price >= 0);

-- Provider service price cannot be negative
ALTER TABLE provider_services
ADD CONSTRAINT check_provider_service_price
CHECK (price >= 0);

-- Schedule closing time must be after opening time
ALTER TABLE schedules
ADD CONSTRAINT check_schedule_time
CHECK (closing_time > opening_time);
