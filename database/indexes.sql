USE pawssible;

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

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