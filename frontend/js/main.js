// ============================================================
// Pawssible · Main Application JavaScript
// Stray Animal Rescue and Assistance Management System
// Version 3.12.50
// ============================================================

// ============================================================
// STORAGE KEYS & HELPERS
// ============================================================

const STORAGE = {
    users: 'pawssible_users',
    roles: 'pawssible_roles',
    animalReports: 'pawssible_animal_reports',
    animals: 'pawssible_animals',
    assistanceRequests: 'pawssible_assistance_requests',
    adoptionApplications: 'pawssible_adoption_applications',
    organizations: 'pawssible_organizations',
    organizationMembers: 'pawssible_organization_members',
    medicalRecords: 'pawssible_medical_records',
    systemLogs: 'pawssible_system_logs',
    activity: 'pawssible_activity',
    settings: 'pawssible_settings'
};

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @returns {Array} Array of data
 */
function getData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 */
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Generate a unique ID
 * @returns {number} Unique timestamp-based ID
 */
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date and time
 * @param {string} dateStr - Date string
 * @returns {string} Formatted datetime
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    const old = document.querySelector('.pawssible-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'pawssible-toast';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${escapeHTML(message)}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// ROLE MANAGEMENT
// ============================================================

const RoleManager = {
    /**
     * Get all roles
     * @returns {Array} Array of role objects
     */
    getAll() {
        return getData(STORAGE.roles);
    },

    /**
     * Get role by ID
     * @param {number} id - Role ID
     * @returns {Object|null} Role object
     */
    getById(id) {
        const roles = this.getAll();
        return roles.find(r => r.roleId === id) || null;
    },

    /**
     * Get role by name
     * @param {string} name - Role name
     * @returns {Object|null} Role object
     */
    getByName(name) {
        const roles = this.getAll();
        return roles.find(r => r.roleName === name) || null;
    },

    /**
     * Initialize default roles
     */
    initDefaultRoles() {
        if (!localStorage.getItem(STORAGE.roles)) {
            const defaultRoles = [
                { roleId: 1, roleName: 'CommunityMember', description: 'Can report strays and view listings' },
                { roleId: 2, roleName: 'Volunteer', description: 'Can respond to assistance requests' },
                { roleId: 3, roleName: 'Rescuer', description: 'Can coordinate rescue operations' },
                { roleId: 4, roleName: 'OrganizationRep', description: 'Can manage organization profiles' },
                { roleId: 5, roleName: 'VetProvider', description: 'Can update medical records' },
                { roleId: 6, roleName: 'Admin', description: 'Full system access' }
            ];
            saveData(STORAGE.roles, defaultRoles);
        }
    }
};

// ============================================================
// USER MANAGEMENT
// ============================================================

const UserManager = {
    /**
     * Get all users
     * @returns {Array} Array of user objects
     */
    getAll() {
        return getData(STORAGE.users);
    },

    /**
     * Get user by ID
     * @param {number} id - User ID
     * @returns {Object|null} User object
     */
    getById(id) {
        const users = this.getAll();
        return users.find(u => u.userId === id) || null;
    },

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Object|null} User object
     */
    getByEmail(email) {
        const users = this.getAll();
        return users.find(u => u.email === email) || null;
    },

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Object} Created user
     */
    register(userData) {
        const users = this.getAll();
        if (this.getByEmail(userData.email)) {
            throw new Error('Email already exists');
        }

        const role = RoleManager.getByName(userData.role || 'CommunityMember');
        if (!role) {
            throw new Error('Invalid role');
        }

        const user = {
            userId: generateId(),
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            passwordHash: userData.password || '', // In production, hash with bcrypt
            roleId: role.roleId,
            phoneNumber: userData.phoneNumber || '',
            registrationDate: new Date().toISOString(),
            lastLoginDate: null,
            isActive: true
        };

        users.push(user);
        saveData(STORAGE.users, users);
        ActivityLogger.log('fa-user-plus', `User registered: ${user.firstName} ${user.lastName}`);
        return user;
    },

    /**
     * Authenticate user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object|null} User object
     */
    authenticate(email, password) {
        const user = this.getByEmail(email);
        if (user && user.passwordHash === password && user.isActive) {
            user.lastLoginDate = new Date().toISOString();
            saveData(STORAGE.users, this.getAll());
            ActivityLogger.log('fa-sign-in-alt', `User logged in: ${user.email}`);
            return user;
        }
        return null;
    },

    /**
     * Update user
     * @param {number} id - User ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated user
     */
    update(id, updates) {
        const users = this.getAll();
        const index = users.findIndex(u => u.userId === id);
        if (index === -1) return null;

        users[index] = {
            ...users[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        saveData(STORAGE.users, users);
        ActivityLogger.log('fa-user-edit', `User updated: ${users[index].email}`);
        return users[index];
    },

    /**
     * Delete user (soft delete)
     * @param {number} id - User ID
     * @returns {boolean} Success status
     */
    delete(id) {
        return this.update(id, { isActive: false }) !== null;
    },

    /**
     * Get users by role
     * @param {string} roleName - Role name
     * @returns {Array} Filtered users
     */
    getByRole(roleName) {
        const role = RoleManager.getByName(roleName);
        if (!role) return [];
        return this.getAll().filter(u => u.roleId === role.roleId && u.isActive);
    },

    /**
     * Count total users
     * @returns {number} Total count
     */
    count() {
        return this.getAll().filter(u => u.isActive).length;
    }
};

// ============================================================
// ANIMAL REPORT MANAGEMENT
// ============================================================

const AnimalReportManager = {
    /**
     * Get all reports
     * @returns {Array} Array of report objects
     */
    getAll() {
        return getData(STORAGE.animalReports);
    },

    /**
     * Get report by ID
     * @param {number} id - Report ID
     * @returns {Object|null} Report object
     */
    getById(id) {
        const reports = this.getAll();
        return reports.find(r => r.reportId === id) || null;
    },

    /**
     * Submit a new animal report
     * @param {Object} reportData - Report data
     * @returns {Object} Created report
     */
    submit(reportData) {
        const reports = this.getAll();
        const report = {
            reportId: generateId(),
            reporterUserId: reportData.reporterUserId || null,
            locationLatitude: reportData.latitude || null,
            locationLongitude: reportData.longitude || null,
            locationAddress: reportData.address || '',
            species: reportData.species || '',
            breed: reportData.breed || '',
            color: reportData.color || '',
            estimatedAge: reportData.estimatedAge || null,
            sex: reportData.sex || 'Unknown',
            conditionDescription: reportData.conditionDescription || '',
            reportDate: new Date().toISOString(),
            status: reportData.status || 'Pending',
            imageURLs: reportData.imageURLs || []
        };
        reports.push(report);
        saveData(STORAGE.animalReports, reports);
        ActivityLogger.log('fa-paw', `Animal report submitted: ${report.species} at ${report.locationAddress}`);
        return report;
    },

    /**
     * Update report status
     * @param {number} id - Report ID
     * @param {string} status - New status
     * @param {string} notes - Notes
     * @returns {Object|null} Updated report
     */
    updateStatus(id, status, notes = '') {
        const reports = this.getAll();
        const index = reports.findIndex(r => r.reportId === id);
        if (index === -1) return null;
        reports[index].status = status;
        reports[index].resolutionNotes = notes;
        reports[index].updatedAt = new Date().toISOString();
        saveData(STORAGE.animalReports, reports);
        ActivityLogger.log('fa-check-circle', `Report ${id} status updated to: ${status}`);
        return reports[index];
    },

    /**
     * Get reports by status
     * @param {string} status - Report status
     * @returns {Array} Filtered reports
     */
    getByStatus(status) {
        return this.getAll().filter(r => r.status === status);
    },

    /**
     * Get pending reports
     * @returns {Array} Pending reports
     */
    getPending() {
        return this.getByStatus('Pending');
    },

    /**
     * Count total reports
     * @returns {number} Total count
     */
    count() {
        return this.getAll().length;
    }
};

// ============================================================
// ANIMAL MANAGEMENT
// ============================================================

const AnimalManager = {
    /**
     * Get all animals
     * @returns {Array} Array of animal objects
     */
    getAll() {
        return getData(STORAGE.animals);
    },

    /**
     * Get animal by ID
     * @param {number} id - Animal ID
     * @returns {Object|null} Animal object
     */
    getById(id) {
        const animals = this.getAll();
        return animals.find(a => a.animalId === id) || null;
    },

    /**
     * Create a new animal record from a report
     * @param {Object} animalData - Animal data
     * @returns {Object} Created animal
     */
    create(animalData) {
        const animals = this.getAll();
        const animal = {
            animalId: generateId(),
            sourceReportId: animalData.sourceReportId || null,
            name: animalData.name || '',
            species: animalData.species || '',
            breed: animalData.breed || '',
            color: animalData.color || '',
            dateOfBirth: animalData.dateOfBirth || null,
            sex: animalData.sex || 'Unknown',
            intakeDate: new Date().toISOString(),
            currentLocation: animalData.currentLocation || '',
            medicalHistorySummary: animalData.medicalHistorySummary || '',
            behavioralNotes: animalData.behavioralNotes || '',
            sterilizationStatus: animalData.sterilizationStatus || 'Unknown',
            vaccinationStatus: animalData.vaccinationStatus || 'Unknown',
            adoptionStatus: animalData.adoptionStatus || 'Available'
        };
        animals.push(animal);
        saveData(STORAGE.animals, animal);
        ActivityLogger.log('fa-dog', `Animal record created: ${animal.name || animal.species}`);
        return animal;
    },

    /**
     * Update animal
     * @param {number} id - Animal ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated animal
     */
    update(id, updates) {
        const animals = this.getAll();
        const index = animals.findIndex(a => a.animalId === id);
        if (index === -1) return null;
        animals[index] = {
            ...animals[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        saveData(STORAGE.animals, animals);
        ActivityLogger.log('fa-edit', `Animal updated: ${animals[index].name || animals[index].species}`);
        return animals[index];
    },

    /**
     * Get animals by adoption status
     * @param {string} status - Adoption status
     * @returns {Array} Filtered animals
     */
    getByAdoptionStatus(status) {
        return this.getAll().filter(a => a.adoptionStatus === status);
    },

    /**
     * Get available animals for adoption
     * @returns {Array} Available animals
     */
    getAvailable() {
        return this.getByAdoptionStatus('Available');
    },

    /**
     * Count total animals
     * @returns {number} Total count
     */
    count() {
        return this.getAll().length;
    }
};

// ============================================================
// ASSISTANCE REQUEST MANAGEMENT
// ============================================================

const AssistanceRequestManager = {
    /**
     * Get all requests
     * @returns {Array} Array of request objects
     */
    getAll() {
        return getData(STORAGE.assistanceRequests);
    },

    /**
     * Get request by ID
     * @param {number} id - Request ID
     * @returns {Object|null} Request object
     */
    getById(id) {
        const requests = this.getAll();
        return requests.find(r => r.requestId === id) || null;
    },

    /**
     * Create a new assistance request
     * @param {Object} requestData - Request data
     * @returns {Object} Created request
     */
    create(requestData) {
        const requests = this.getAll();
        const request = {
            requestId: generateId(),
            animalId: requestData.animalId || null,
            reportId: requestData.reportId || null,
            requesterUserId: requestData.requesterUserId || null,
            requestType: requestData.requestType || 'Rescue',
            urgencyLevel: requestData.urgencyLevel || 'Normal',
            description: requestData.description || '',
            requestDate: new Date().toISOString(),
            assignedUserId: requestData.assignedUserId || null,
            status: requestData.status || 'Pending',
            resolutionNotes: requestData.resolutionNotes || ''
        };
        requests.push(request);
        saveData(STORAGE.assistanceRequests, requests);
        ActivityLogger.log('fa-calendar-check', `Assistance request created: ${request.requestType}`);
        return request;
    },

    /**
     * Update request status
     * @param {number} id - Request ID
     * @param {string} status - New status
     * @param {string} notes - Resolution notes
     * @returns {Object|null} Updated request
     */
    updateStatus(id, status, notes = '') {
        const requests = this.getAll();
        const index = requests.findIndex(r => r.requestId === id);
        if (index === -1) return null;
        requests[index].status = status;
        if (notes) requests[index].resolutionNotes = notes;
        requests[index].updatedAt = new Date().toISOString();
        saveData(STORAGE.assistanceRequests, requests);
        ActivityLogger.log('fa-check-circle', `Request ${id} status updated to: ${status}`);
        return requests[index];
    },

    /**
     * Assign request to a user
     * @param {number} id - Request ID
     * @param {number} userId - User ID to assign
     * @returns {Object|null} Updated request
     */
    assign(id, userId) {
        const requests = this.getAll();
        const index = requests.findIndex(r => r.requestId === id);
        if (index === -1) return null;
        requests[index].assignedUserId = userId;
        requests[index].status = 'In Progress';
        requests[index].updatedAt = new Date().toISOString();
        saveData(STORAGE.assistanceRequests, requests);
        ActivityLogger.log('fa-user-check', `Request ${id} assigned to user ${userId}`);
        return requests[index];
    },

    /**
     * Get requests by status
     * @param {string} status - Request status
     * @returns {Array} Filtered requests
     */
    getByStatus(status) {
        return this.getAll().filter(r => r.status === status);
    },

    /**
     * Get pending requests
     * @returns {Array} Pending requests
     */
    getPending() {
        return this.getByStatus('Pending');
    },

    /**
     * Count total requests
     * @returns {number} Total count
     */
    count() {
        return this.getAll().length;
    }
};

// ============================================================
// ADOPTION APPLICATION MANAGEMENT
// ============================================================

const AdoptionApplicationManager = {
    /**
     * Get all applications
     * @returns {Array} Array of application objects
     */
    getAll() {
        return getData(STORAGE.adoptionApplications);
    },

    /**
     * Get application by ID
     * @param {number} id - Application ID
     * @returns {Object|null} Application object
     */
    getById(id) {
        const applications = this.getAll();
        return applications.find(a => a.applicationId === id) || null;
    },

    /**
     * Submit an adoption application
     * @param {Object} appData - Application data
     * @returns {Object} Created application
     */
    submit(appData) {
        const applications = this.getAll();
        const application = {
            applicationId: generateId(),
            animalId: appData.animalId || null,
            applicantUserId: appData.applicantUserId || null,
            submissionDate: new Date().toISOString(),
            homeType: appData.homeType || '',
            hasOtherPets: appData.hasOtherPets || false,
            hasChildren: appData.hasChildren || false,
            employmentStatus: appData.employmentStatus || '',
            references: appData.references || '',
            homeVisitCompleted: appData.homeVisitCompleted || false,
            applicationStatus: appData.applicationStatus || 'Pending',
            reviewNotes: appData.reviewNotes || ''
        };
        applications.push(application);
        saveData(STORAGE.adoptionApplications, applications);
        ActivityLogger.log('fa-heart', `Adoption application submitted for animal ${appData.animalId}`);
        return application;
    },

    /**
     * Update application status
     * @param {number} id - Application ID
     * @param {string} status - New status
     * @param {string} notes - Review notes
     * @returns {Object|null} Updated application
     */
    updateStatus(id, status, notes = '') {
        const applications = this.getAll();
        const index = applications.findIndex(a => a.applicationId === id);
        if (index === -1) return null;
        applications[index].applicationStatus = status;
        if (notes) applications[index].reviewNotes = notes;
        applications[index].updatedAt = new Date().toISOString();
        saveData(STORAGE.adoptionApplications, applications);
        ActivityLogger.log('fa-check-circle', `Application ${id} status updated to: ${status}`);
        return applications[index];
    },

    /**
     * Get applications by status
     * @param {string} status - Application status
     * @returns {Array} Filtered applications
     */
    getByStatus(status) {
        return this.getAll().filter(a => a.applicationStatus === status);
    },

    /**
     * Get pending applications
     * @returns {Array} Pending applications
     */
    getPending() {
        return this.getByStatus('Pending');
    },

    /**
     * Count total applications
     * @returns {number} Total count
     */
    count() {
        return this.getAll().length;
    }
};

// ============================================================
// ORGANIZATION MANAGEMENT
// ============================================================

const OrganizationManager = {
    /**
     * Get all organizations
     * @returns {Array} Array of organization objects
     */
    getAll() {
        return getData(STORAGE.organizations);
    },

    /**
     * Get organization by ID
     * @param {number} id - Organization ID
     * @returns {Object|null} Organization object
     */
    getById(id) {
        const orgs = this.getAll();
        return orgs.find(o => o.organizationId === id) || null;
    },

    /**
     * Create a new organization
     * @param {Object} orgData - Organization data
     * @returns {Object} Created organization
     */
    create(orgData) {
        const orgs = this.getAll();
        const org = {
            organizationId: generateId(),
            organizationName: orgData.organizationName || '',
            contactEmail: orgData.contactEmail || '',
            contactPhone: orgData.contactPhone || '',
            serviceArea: orgData.serviceArea || '',
            websiteURL: orgData.websiteURL || '',
            description: orgData.description || '',
            createdAt: new Date().toISOString()
        };
        orgs.push(org);
        saveData(STORAGE.organizations, orgs);
        ActivityLogger.log('fa-building', `Organization created: ${org.organizationName}`);
        return org;
    },

    /**
     * Update organization
     * @param {number} id - Organization ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated organization
     */
    update(id, updates) {
        const orgs = this.getAll();
        const index = orgs.findIndex(o => o.organizationId === id);
        if (index === -1) return null;
        orgs[index] = {
            ...orgs[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        saveData(STORAGE.organizations, orgs);
        ActivityLogger.log('fa-edit', `Organization updated: ${orgs[index].organizationName}`);
        return orgs[index];
    },

    /**
     * Count total organizations
     * @returns {number} Total count
     */
    count() {
        return this.getAll().length;
    }
};

// ============================================================
// ORGANIZATION MEMBER MANAGEMENT
// ============================================================

const OrganizationMemberManager = {
    /**
     * Get all organization memberships
     * @returns {Array} Array of membership objects
     */
    getAll() {
        return getData(STORAGE.organizationMembers);
    },

    /**
     * Add a member to an organization
     * @param {number} orgId - Organization ID
     * @param {number} userId - User ID
     * @param {string} role - Role in organization
     * @returns {Object} Created membership
     */
    addMember(orgId, userId, role = 'Member') {
        const members = this.getAll();
        const membership = {
            orgMemberId: generateId(),
            organizationId: orgId,
            userId: userId,
            roleInOrganization: role,
            joinDate: new Date().toISOString()
        };
        members.push(membership);
        saveData(STORAGE.organizationMembers, members);
        ActivityLogger.log('fa-user-plus', `User ${userId} joined organization ${orgId}`);
        return membership;
    },

    /**
     * Remove a member from an organization
     * @param {number} orgId - Organization ID
     * @param {number} userId - User ID
     * @returns {boolean} Success status
     */
    removeMember(orgId, userId) {
        const members = this.getAll();
        const filtered = members.filter(m => !(m.organizationId === orgId && m.userId === userId));
        if (filtered.length === members.length) return false;
        saveData(STORAGE.organizationMembers, filtered);
        ActivityLogger.log('fa-user-minus', `User ${userId} left organization ${orgId}`);
        return true;
    },

    /**
     * Get members of an organization
     * @param {number} orgId - Organization ID
     * @returns {Array} Members of the organization
     */
    getMembers(orgId) {
        return this.getAll().filter(m => m.organizationId === orgId);
    },

    /**
     * Get organizations a user belongs to
     * @param {number} userId - User ID
     * @returns {Array} Organizations the user belongs to
     */
    getUserOrgs(userId) {
        return this.getAll().filter(m => m.userId === userId);
    }
};

// ============================================================
// MEDICAL RECORD MANAGEMENT
// ============================================================

const MedicalRecordManager = {
    /**
     * Get all medical records
     * @returns {Array} Array of medical record objects
     */
    getAll() {
        return getData(STORAGE.medicalRecords);
    },

    /**
     * Get record by ID
     * @param {number} id - Record ID
     * @returns {Object|null} Record object
     */
    getById(id) {
        const records = this.getAll();
        return records.find(r => r.recordId === id) || null;
    },

    /**
     * Create a new medical record
     * @param {Object} recordData - Record data
     * @returns {Object} Created record
     */
    create(recordData) {
        const records = this.getAll();
        const record = {
            recordId: generateId(),
            animalId: recordData.animalId || null,
            vetUserId: recordData.vetUserId || null,
            visitDate: new Date().toISOString(),
            diagnosis: recordData.diagnosis || '',
            treatmentProvided: recordData.treatmentProvided || '',
            medicationsPrescribed: recordData.medicationsPrescribed || '',
            followUpRequired: recordData.followUpRequired || false,
            followUpDate: recordData.followUpDate || null,
            notes: recordData.notes || ''
        };
        records.push(record);
        saveData(STORAGE.medicalRecords, records);
        ActivityLogger.log('fa-file-medical', `Medical record created for animal ${recordData.animalId}`);
        return record;
    },

    /**
     * Update a medical record
     * @param {number} id - Record ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated record
     */
    update(id, updates) {
        const records = this.getAll();
        const index = records.findIndex(r => r.recordId === id);
        if (index === -1) return null;
        records[index] = {
            ...records[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        saveData(STORAGE.medicalRecords, records);
        ActivityLogger.log('fa-edit', `Medical record ${id} updated`);
        return records[index];
    },

    /**
     * Get records by animal ID
     * @param {number} animalId - Animal ID
     * @returns {Array} Records for the animal
     */
    getByAnimal(animalId) {
        return this.getAll().filter(r => r.animalId === animalId);
    },

    /**
     * Count total records
     * @returns {number} Total count
     */
    count() {
        return this.getAll().length;
    }
};

// ============================================================
// SYSTEM LOG MANAGEMENT
// ============================================================

const SystemLogManager = {
    /**
     * Get all logs
     * @returns {Array} Array of log objects
     */
    getAll() {
        return getData(STORAGE.systemLogs);
    },

    /**
     * Add a system log entry
     * @param {Object} logData - Log data
     * @returns {Object} Created log
     */
    add(logData) {
        const logs = this.getAll();
        const log = {
            logId: generateId(),
            userId: logData.userId || null,
            actionType: logData.actionType || 'Unknown',
            actionDescription: logData.actionDescription || '',
            timestamp: new Date().toISOString(),
            ipAddress: logData.ipAddress || ''
        };
        logs.push(log);
        // Keep only last 1000 logs
        if (logs.length > 1000) logs.splice(0, logs.length - 1000);
        saveData(STORAGE.systemLogs, logs);
        return log;
    },

    /**
     * Get logs by user
     * @param {number} userId - User ID
     * @returns {Array} User's logs
     */
    getByUser(userId) {
        return this.getAll().filter(l => l.userId === userId);
    },

    /**
     * Get logs by date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Array} Filtered logs
     */
    getByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return this.getAll().filter(l => {
            const date = new Date(l.timestamp);
            return date >= start && date <= end;
        });
    },

    /**
     * Clear all logs
     */
    clear() {
        saveData(STORAGE.systemLogs, []);
        ActivityLogger.log('fa-trash', 'System logs cleared');
    }
};

// ============================================================
// ACTIVITY LOGGER
// ============================================================

const ActivityLogger = {
    /**
     * Log an activity
     * @param {string} icon - Font Awesome icon class
     * @param {string} text - Activity description
     */
    log(icon, text) {
        const activities = getData(STORAGE.activity);
        activities.unshift({
            id: generateId(),
            icon: icon || 'fa-info-circle',
            text: text || 'Activity logged',
            date: new Date().toLocaleString()
        });
        if (activities.length > 50) activities.length = 50;
        saveData(STORAGE.activity, activities);
        if (typeof renderActivity === 'function') {
            renderActivity();
        }
    },

    /**
     * Get all activities
     * @returns {Array} Array of activity objects
     */
    getAll() {
        return getData(STORAGE.activity);
    },

    /**
     * Clear all activities
     */
    clear() {
        saveData(STORAGE.activity, []);
        if (typeof renderActivity === 'function') {
            renderActivity();
        }
    }
};

// ============================================================
// DASHBOARD UI RENDER FUNCTIONS
// ============================================================

/**
 * Render appointments in the UI
 */
function renderAppointments() {
    const container = document.getElementById('appointmentsContainer');
    if (!container) return;

    const requests = AssistanceRequestManager.getPending().slice(0, 5);

    if (!requests.length) {
        container.innerHTML = `
            <div class="empty-state-content">
                <i class="fas fa-calendar-plus empty-icon"></i>
                <p class="empty-title">No pending assistance requests</p>
                <p class="empty-desc">Requests from community members will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="appointment-list">
            ${requests.map(r => `
                <div class="appointment-item">
                    <div class="appointment-date">
                        <strong>${formatDate(r.requestDate)}</strong>
                        <small>${r.requestType}</small>
                    </div>
                    <div class="appointment-info">
                        <strong>${escapeHTML(r.description || 'No description')}</strong>
                        <span>Urgency: ${escapeHTML(r.urgencyLevel)}</span>
                    </div>
                    <button class="delete-btn" type="button" data-id="${r.requestId}">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            AssistanceRequestManager.updateStatus(id, 'In Progress');
            updateDashboard();
            showToast('Request marked as in progress.');
        });
    });
}

/**
 * Render activity log in the UI
 */
function renderActivity() {
    const container = document.getElementById('activityContainer');
    if (!container) return;

    const activities = ActivityLogger.getAll().slice(0, 5);

    if (!activities.length) {
        container.innerHTML = `
            <div class="empty-state-content">
                <i class="fas fa-clock empty-icon"></i>
                <p class="empty-title">No recent activity</p>
                <p class="empty-desc">System actions will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="activity-list">
            ${activities.map(a => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${escapeHTML(a.icon || 'fa-info-circle')}"></i>
                    </div>
                    <div class="activity-content">
                        <strong>${escapeHTML(a.text)}</strong>
                        <small>${escapeHTML(a.date)}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Update all statistics on the dashboard
 */
function updateStats() {
    const stats = [
        { id: 'totalPets', value: AnimalManager.count() },
        { id: 'totalAppointments', value: AssistanceRequestManager.count() },
        { id: 'totalRecords', value: MedicalRecordManager.count() },
        { id: 'totalUsers', value: UserManager.count() }
    ];

    stats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (el) el.textContent = stat.value;
    });
}

/**
 * Update the entire dashboard
 */
function updateDashboard() {
    updateStats();
    renderAppointments();
    renderActivity();
}

// ============================================================
// MODAL CONTROLS
// ============================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// ============================================================
// FORM HANDLERS
// ============================================================

function setupPetForm() {
    const form = document.getElementById('petForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('petName')?.value?.trim();
        const species = document.getElementById('petSpecies')?.value;
        const breed = document.getElementById('petBreed')?.value?.trim();
        const age = document.getElementById('petAge')?.value;
        const color = document.getElementById('petColor')?.value?.trim();

        if (!name || !species) {
            showToast('Please enter name and species.', 'error');
            return;
        }

        const animal = AnimalManager.create({
            name,
            species,
            breed: breed || 'Unknown',
            color: color || 'Unknown',
            dateOfBirth: age ? new Date(Date.now() - age * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
            sex: document.getElementById('petSex')?.value || 'Unknown',
            currentLocation: document.getElementById('petLocation')?.value || '',
            behavioralNotes: document.getElementById('petBehavior')?.value || '',
            adoptionStatus: 'Available'
        });

        this.reset();
        closeModal('petModal');
        updateDashboard();
        showToast(`${animal.name} was added successfully!`);
    });
}

function setupAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const animalId = document.getElementById('appointmentAnimal')?.value;
        const animalName = document.getElementById('appointmentAnimalName')?.value?.trim();
        const requestType = document.getElementById('appointmentType')?.value;
        const urgency = document.getElementById('appointmentUrgency')?.value;
        const description = document.getElementById('appointmentDesc')?.value?.trim();

        if (!animalName || !requestType) {
            showToast('Please complete all required fields.', 'error');
            return;
        }

        AssistanceRequestManager.create({
            animalId: animalId ? parseInt(animalId) : null,
            requesterUserId: 1, // Current user ID
            requestType: requestType,
            urgencyLevel: urgency || 'Normal',
            description: description || `Assistance needed for ${animalName}`,
            status: 'Pending'
        });

        this.reset();
        closeModal('appointmentModal');
        updateDashboard();
        showToast('Assistance request submitted successfully!');
    });
}

function setupRecordForm() {
    const form = document.getElementById('recordForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const animalId = document.getElementById('recordAnimal')?.value;
        const animalName = document.getElementById('recordAnimalName')?.value?.trim();
        const diagnosis = document.getElementById('recordDiagnosis')?.value?.trim();
        const treatment = document.getElementById('recordTreatment')?.value?.trim();

        if (!animalName || !diagnosis) {
            showToast('Please enter animal name and diagnosis.', 'error');
            return;
        }

        MedicalRecordManager.create({
            animalId: animalId ? parseInt(animalId) : null,
            vetUserId: 1, // Current user ID
            diagnosis: diagnosis,
            treatmentProvided: treatment || '',
            medicationsPrescribed: document.getElementById('recordMeds')?.value || '',
            followUpRequired: document.getElementById('recordFollowUp')?.checked || false,
            followUpDate: document.getElementById('recordFollowUpDate')?.value || null,
            notes: document.getElementById('recordNotes')?.value || ''
        });

        this.reset();
        closeModal('recordModal');
        updateDashboard();
        showToast('Medical record saved successfully!');
    });
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    if (!input || !results) return;

    input.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        if (!query) {
            results.innerHTML = '';
            return;
        }

        const animals = AnimalManager.getAll()
            .filter(a => a.name.toLowerCase().includes(query) || a.species.toLowerCase().includes(query));
        const reports = AnimalReportManager.getAll()
            .filter(r => r.species.toLowerCase().includes(query) || r.locationAddress.toLowerCase().includes(query));
        const requests = AssistanceRequestManager.getAll()
            .filter(r => r.description.toLowerCase().includes(query) || r.requestType.toLowerCase().includes(query));

        const matches = [];

        animals.forEach(a => {
            matches.push({
                icon: 'fa-dog',
                title: a.name || 'Unnamed',
                description: `${a.species} · ${a.adoptionStatus}`
            });
        });

        reports.forEach(r => {
            matches.push({
                icon: 'fa-paw',
                title: `Report: ${r.species}`,
                description: r.locationAddress || 'Location unknown'
            });
        });

        requests.forEach(r => {
            matches.push({
                icon: 'fa-calendar-check',
                title: `${r.requestType} Request`,
                description: r.status
            });
        });

        if (!matches.length) {
            results.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p>No results found.</p>
                </div>
            `;
            return;
        }

        results.innerHTML = matches.slice(0, 10).map(m => `
            <div class="search-result">
                <i class="fas ${escapeHTML(m.icon)}"></i>
                <div>
                    <strong>${escapeHTML(m.title)}</strong>
                    <small>${escapeHTML(m.description)}</small>
                </div>
            </div>
        `).join('');
    });
}

// ============================================================
// SIDEBAR CONTROLS
// ============================================================

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const reopenBtn = document.getElementById('sidebarReopenBtn');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar?.classList.toggle('collapsed');
            if (reopenBtn) {
                reopenBtn.classList.toggle('visible', sidebar?.classList.contains('collapsed'));
            }
        });
    }

    if (reopenBtn) {
        reopenBtn.addEventListener('click', () => {
            sidebar?.classList.remove('collapsed');
            reopenBtn.classList.remove('visible');
        });
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar?.classList.add('mobile-open');
            overlay?.classList.add('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar?.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
}

// ============================================================
// BUTTON BINDINGS
// ============================================================

function setupButtons() {
    // Open modals
    const modalTriggers = {
        'addPetBtn': 'petModal',
        'statAddPet': 'petModal',
        'statBookAppointment': 'appointmentModal',
        'emptyBookAppointment': 'appointmentModal',
        'statAddRecord': 'recordModal',
        'searchBtn': 'searchModal',
        'notificationBtn': 'notificationModal'
    };

    Object.entries(modalTriggers).forEach(([btnId, modalId]) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => openModal(modalId));
        }
    });

    // Close modal buttons
    const closeButtons = [
        'closePetModal', 'closeAppointmentModal', 'closeRecordModal',
        'closeSearchModal', 'closeNotificationModal'
    ];

    closeButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                const modalId = id.replace('close', '').toLowerCase() + 'Modal';
                closeModal(modalId);
            });
        }
    });

    // Other buttons
    document.getElementById('viewUsersBtn')?.addEventListener('click', () => {
        showToast(`Total users: ${UserManager.count()}`);
    });

    document.getElementById('viewAppointments')?.addEventListener('click', () => {
        showToast(`Total requests: ${AssistanceRequestManager.count()}`);
    });

    document.getElementById('clearActivity')?.addEventListener('click', () => {
        ActivityLogger.clear();
        updateDashboard();
        showToast('Activity cleared.');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sidebar?.classList.remove('mobile-open');
            overlay?.classList.remove('active');
        }
    });
}

// ============================================================
// SEED DATA
// ============================================================

function seedSampleData() {
    // Initialize roles
    RoleManager.initDefaultRoles();

    // Seed users
    if (!localStorage.getItem(STORAGE.users)) {
        const sampleUsers = [
            { userId: 1, firstName: 'Admin', lastName: 'User', email: 'admin@pawssible.com', passwordHash: 'admin123', roleId: 6, phoneNumber: '(555) 000-0000', registrationDate: new Date().toISOString(), lastLoginDate: null, isActive: true },
            { userId: 2, firstName: 'John', lastName: 'Doe', email: 'john@example.com', passwordHash: 'password123', roleId: 1, phoneNumber: '(555) 123-4567', registrationDate: new Date().toISOString(), lastLoginDate: null, isActive: true },
            { userId: 3, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', passwordHash: 'password123', roleId: 2, phoneNumber: '(555) 234-5678', registrationDate: new Date().toISOString(), lastLoginDate: null, isActive: true }
        ];
        saveData(STORAGE.users, sampleUsers);
    }

    // Seed animal reports
    if (!localStorage.getItem(STORAGE.animalReports)) {
        const sampleReports = [
            { reportId: 1, reporterUserId: 2, locationLatitude: 13.6233, locationLongitude: 123.1667, locationAddress: 'Naga City, Camarines Sur', species: 'Dog', breed: 'Aspin', color: 'Brown', estimatedAge: 2, sex: 'Male', conditionDescription: 'Friendly, slightly malnourished', reportDate: new Date().toISOString(), status: 'Verified', imageURLs: [] },
            { reportId: 2, reporterUserId: 2, locationLatitude: 13.6240, locationLongitude: 123.1670, locationAddress: 'Ateneo de Naga University', species: 'Cat', breed: 'Puspin', color: 'Orange', estimatedAge: 1, sex: 'Female', conditionDescription: 'Healthy, shy', reportDate: new Date().toISOString(), status: 'Pending', imageURLs: [] }
        ];
        saveData(STORAGE.animalReports, sampleReports);
    }

    // Seed animals
    if (!localStorage.getItem(STORAGE.animals)) {
        const sampleAnimals = [
            { animalId: 1, sourceReportId: 1, name: 'Buddy', species: 'Dog', breed: 'Aspin', color: 'Brown', dateOfBirth: '2024-01-15', sex: 'Male', intakeDate: new Date().toISOString(), currentLocation: 'Naga City Shelter', medicalHistorySummary: 'Underweight, being rehabilitated', behavioralNotes: 'Friendly, good with people', sterilizationStatus: 'Not Sterilized', vaccinationStatus: 'Partially Vaccinated', adoptionStatus: 'Available' },
            { animalId: 2, sourceReportId: 2, name: 'Whiskers', species: 'Cat', breed: 'Puspin', color: 'Orange', dateOfBirth: '2025-01-01', sex: 'Female', intakeDate: new Date().toISOString(), currentLocation: 'Naga City Shelter', medicalHistorySummary: 'Healthy', behavioralNotes: 'Shy, needs patient adopter', sterilizationStatus: 'Not Sterilized', vaccinationStatus: 'Not Vaccinated', adoptionStatus: 'Available' }
        ];
        saveData(STORAGE.animals, sampleAnimals);
    }

    // Seed assistance requests
    if (!localStorage.getItem(STORAGE.assistanceRequests)) {
        const sampleRequests = [
            { requestId: 1, animalId: 1, reportId: 1, requesterUserId: 2, requestType: 'Rescue', urgencyLevel: 'High', description: 'Dog needs immediate rescue from street', requestDate: new Date().toISOString(), assignedUserId: 3, status: 'In Progress', resolutionNotes: '' },
            { requestId: 2, animalId: 2, reportId: 2, requesterUserId: 2, requestType: 'Veterinary', urgencyLevel: 'Normal', description: 'Cat needs medical checkup', requestDate: new Date().toISOString(), assignedUserId: null, status: 'Pending', resolutionNotes: '' }
        ];
        saveData(STORAGE.assistanceRequests, sampleRequests);
    }

    // Seed medical records
    if (!localStorage.getItem(STORAGE.medicalRecords)) {
        const sampleRecords = [
            { recordId: 1, animalId: 1, vetUserId: 1, visitDate: new Date().toISOString(), diagnosis: 'Malnourishment', treatmentProvided: 'Dietary supplements and monitoring', medicationsPrescribed: 'Multivitamins', followUpRequired: true, followUpDate: '2026-10-15', notes: 'Progress is good' }
        ];
        saveData(STORAGE.medicalRecords, sampleRecords);
    }

    // Seed organizations
    if (!localStorage.getItem(STORAGE.organizations)) {
        const sampleOrgs = [
            { organizationId: 1, organizationName: 'Naga City Animal Shelter', contactEmail: 'shelter@naga.gov', contactPhone: '(555) 111-2222', serviceArea: 'Naga City', websiteURL: 'www.naga.gov/shelter', description: 'City-run animal shelter', createdAt: new Date().toISOString() }
        ];
        saveData(STORAGE.organizations, sampleOrgs);
    }

    // Seed activity
    if (!localStorage.getItem(STORAGE.activity)) {
        const sampleActivity = [
            { id: 1, icon: 'fa-paw', text: 'Animal report submitted: Dog at Naga City', date: new Date().toLocaleString() },
            { id: 2, icon: 'fa-calendar-check', text: 'Assistance request created: Rescue', date: new Date().toLocaleString() },
            { id: 3, icon: 'fa-file-medical', text: 'Medical record added for Buddy', date: new Date().toLocaleString() }
        ];
        saveData(STORAGE.activity, sampleActivity);
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Seed sample data
    seedSampleData();

    // Setup forms
    setupPetForm();
    setupAppointmentForm();
    setupRecordForm();
    setupSearch();

    // Setup UI
    setupSidebar();
    setupButtons();

    // Update dashboard
    updateDashboard();

    // Set current user (for demo purposes)
    const currentUser = UserManager.getByEmail('admin@pawssible.com');
    if (currentUser) {
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        });
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = currentUser.email;
        });
        document.querySelectorAll('.user-name-display').forEach(el => {
            el.textContent = currentUser.firstName;
        });
    }

    console.log('Pawssible System initialized successfully!');
    console.log(`Users: ${UserManager.count()}, Animals: ${AnimalManager.count()}`);
    console.log(`Reports: ${AnimalReportManager.count()}, Requests: ${AssistanceRequestManager.count()}`);
});

// ============================================================
// EXPORTS (for testing/extension)
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UserManager,
        RoleManager,
        AnimalReportManager,
        AnimalManager,
        AssistanceRequestManager,
        AdoptionApplicationManager,
        OrganizationManager,
        OrganizationMemberManager,
        MedicalRecordManager,
        SystemLogManager,
        ActivityLogger,
        updateDashboard,
        showToast
    };
}