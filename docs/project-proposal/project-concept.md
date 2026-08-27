## 2.2 Conceptual Schema

The conceptual schema describes the high-level entities and their relationships without yet specifying physical table structures or keys. It serves as the basis for the Entity-Relationship Diagram (ERD) and later logical and physical database design.

## Main Entities

- **User**
- **PetOwner**
- **Pet**
- **ServiceProvider**
- **VeterinaryClinic**
- **Veterinarian**
- **Service**
- **Schedule**
- **Appointment**
- **MedicalRecord**
- **Review**
- **AdminLog** _(optional)_

## Key Relationships

1. **User – PetOwner**
   - One **User** can be associated with at most one **PetOwner** profile.
   - One **PetOwner** is associated with exactly one **User**.
   - Relationship: **1:1** (or merged into one entity if simplified).

2. **PetOwner – Pet**
   - One **PetOwner** can own many **Pets**.
   - Each **Pet** belongs to exactly one **PetOwner**.
   - Relationship: **1:N** (PetOwner to Pet).

3. **User – ServiceProvider**
   - One **User** can manage one **ServiceProvider** business profile.
   - One **ServiceProvider** is managed by one **User**.
   - Relationship: **1:1** (or **1:N** if a user can manage multiple businesses).

4. **ServiceProvider – Service**
   - One **ServiceProvider** offers many **Services**.
   - Each **Service** belongs to one **ServiceProvider**.
   - Relationship: **1:N**.

5. **ServiceProvider – Schedule**
   - One **ServiceProvider** has many **Schedule** entries, such as one entry per day of the week.
   - Each **Schedule** entry belongs to one **ServiceProvider**.
   - Relationship: **1:N**.

6. **User – VeterinaryClinic**
   - One **User** can be the admin/owner of one **VeterinaryClinic**, or more depending on the requirements.
   - Each **VeterinaryClinic** is associated with at least one **User**.
   - Relationship: **1:1** or **1:N**.

7. **VeterinaryClinic – Veterinarian**
   - One **VeterinaryClinic** employs many **Veterinarians**.
   - Each **Veterinarian** works at one **VeterinaryClinic** in this simplified model.
   - Relationship: **1:N**.

8. **VeterinaryClinic – Service**
   - One **VeterinaryClinic** offers many **Services**, including medical and procedural services.
   - Each **Service** belongs to one **VeterinaryClinic**.
   - Relationship: **1:N**.

9. **Pet – Appointment**
   - One **Pet** can have many **Appointments** over time.
   - Each **Appointment** is for exactly one **Pet**.
   - Relationship: **1:N**.

10. **PetOwner – Appointment**
    - One **PetOwner** can make many **Appointments** for their pets.
    - Each **Appointment** is made by one **PetOwner**.
    - Relationship: **1:N**.

11. **ServiceProvider / VeterinaryClinic / Veterinarian – Appointment**
    - One **ServiceProvider** can have many **Appointments**.
    - One **VeterinaryClinic** can have many **Appointments**.
    - One **Veterinarian** can have many **Appointments**.
    - Each **Appointment** is associated with either one **ServiceProvider** or one **VeterinaryClinic**, and optionally one **Veterinarian**.
    - Relationship: **1:N** from each provider, clinic, or veterinarian to **Appointment**.

12. **Service – Appointment**
    - One **Service** can be associated with many **Appointments**.
    - Each **Appointment** is for one **Service**.
    - Relationship: **1:N**.

13. **Pet – MedicalRecord**
    - One **Pet** can have many **MedicalRecords** over its lifetime.
    - Each **MedicalRecord** belongs to one **Pet**.
    - Relationship: **1:N**.

14. **VeterinaryClinic – MedicalRecord**
    - One **VeterinaryClinic** can generate many **MedicalRecords**.
    - Each **MedicalRecord** is created at one **VeterinaryClinic**.
    - Relationship: **1:N**.

15. **Veterinarian – MedicalRecord**
    - One **Veterinarian** can create many **MedicalRecords**.
    - Each **MedicalRecord** is created by one **Veterinarian**.
    - Relationship: **1:N**.

16. **PetOwner – Review**
    - One **PetOwner** can write many **Reviews**.
    - Each **Review** is written by one **PetOwner**.
    - Relationship: **1:N**.

17. **ServiceProvider / VeterinaryClinic – Review**
    - One **ServiceProvider** can receive many **Reviews**.
    - One **VeterinaryClinic** can receive many **Reviews**.
    - Each **Review** targets either one **ServiceProvider** or one **VeterinaryClinic**.
    - Relationship: **1:N**.

18. **User (Admin) – AdminLog**
    - One **Admin User** can create many **AdminLog** entries.
    - Each **AdminLog** entry is created by one **Admin User**.
    - Relationship: **1:N**.

## ERD Representation

This conceptual schema will be translated into an Entity-Relationship Diagram (ERD) showing entities as rectangles, attributes as ovals (or listed inside entities), and relationships as diamonds with cardinality labels such as **1:1** and **1:N**.
