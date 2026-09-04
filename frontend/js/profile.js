// ============================================================
// Pawssible · User Profile JavaScript
// Enhanced profile functionality with full CRUD operations
// Version 3.12.50
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================

    const CONFIG = {
        TOAST_DURATION: 3000,
        MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
        ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        MIN_PASSWORD_LENGTH: 8,
        STORAGE_KEYS: {
            USER_PROFILE: 'pawssible_user_profile',
            USER: 'user',
            TOKEN: 'token',
            PETS: 'pawssible_pets',
            RESCUE_OPS: 'pawssible_rescue_ops',
            PROVIDERS: 'pawssible_providers',
            REVIEWS: 'pawssible_reviews'
        }
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    function escapeHTML(str) {
        if (!str) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(str).replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password) {
        const errors = [];
        if (!password || password.length < CONFIG.MIN_PASSWORD_LENGTH) {
            errors.push('Password must be at least ' + CONFIG.MIN_PASSWORD_LENGTH + ' characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    function deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return Object.assign({}, obj);
        }
    }

    // ============================================================
    // STORAGE MANAGER
    // ============================================================

    var StorageManager = {
        get: function(key, defaultValue) {
            defaultValue = defaultValue || null;
            try {
                var data = localStorage.getItem(key);
                if (!data) return defaultValue;
                return JSON.parse(data);
            } catch (error) {
                console.error('Storage error (get): ' + key, error);
                return defaultValue;
            }
        },

        set: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Storage error (set): ' + key, error);
                return false;
            }
        },

        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage error (remove): ' + key, error);
                return false;
            }
        },

        clearAppData: function() {
            var keys = Object.values(CONFIG.STORAGE_KEYS);
            for (var i = 0; i < keys.length; i++) {
                this.remove(keys[i]);
            }
        }
    };

    // ============================================================
    // TOAST NOTIFICATION SYSTEM
    // ============================================================

    var ToastManager = {
        _toast: null,
        _timeout: null,

        show: function(message, type) {
            type = type || 'success';
            this.hide();

            var toast = document.createElement('div');
            toast.className = 'dashboard-toast';

            var icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };

            var colors = {
                success: '#8fd19e',
                error: '#f0a0a0',
                warning: '#f0c060',
                info: '#8fa9a1'
            };

            toast.innerHTML = 
                '<i class="fas ' + (icons[type] || icons.info) + '" style="color: ' + (colors[type] || colors.info) + '"></i>' +
                '<span>' + escapeHTML(message) + '</span>' +
                '<button class="toast-close" aria-label="Close notification">&times;</button>';

            document.body.appendChild(toast);
            this._toast = toast;

            var self = this;
            toast.querySelector('.toast-close').addEventListener('click', function() {
                self.hide();
            });

            requestAnimationFrame(function() {
                toast.classList.add('show');
            });

            this._timeout = setTimeout(function() {
                self.hide();
            }, CONFIG.TOAST_DURATION);
        },

        hide: function() {
            if (this._toast) {
                this._toast.classList.remove('show');
                var self = this;
                setTimeout(function() {
                    if (self._toast && self._toast.parentNode) {
                        self._toast.remove();
                    }
                    self._toast = null;
                }, 400);
            }
            if (this._timeout) {
                clearTimeout(this._timeout);
                this._timeout = null;
            }
        },

        success: function(message) {
            this.show(message, 'success');
        },

        error: function(message) {
            this.show(message, 'error');
        },

        warning: function(message) {
            this.show(message, 'warning');
        },

        info: function(message) {
            this.show(message, 'info');
        }
    };

    // ============================================================
    // PROFILE MANAGER
    // ============================================================

    var ProfileManager = {
        getProfile: function() {
            var saved = StorageManager.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
            if (saved) return saved;

            var user = StorageManager.get(CONFIG.STORAGE_KEYS.USER);
            if (user) {
                return {
                    userId: user.userId || null,
                    name: user.name || user.fullName || 'Rescue Hero',
                    email: user.email || 'hero@rescue.org',
                    phone: user.phone || '',
                    location: user.location || '',
                    bio: user.bio || '',
                    avatar: user.avatar || '',
                    role: user.role || 'CommunityMember',
                    joinedDate: user.joinedDate || this._getDefaultJoinedDate()
                };
            }

            return this._getDefaultProfile();
        },

        saveProfile: function(data) {
            var profile = {
                userId: data.userId || null,
                name: data.name || 'Rescue Hero',
                email: data.email || 'hero@rescue.org',
                phone: data.phone || '',
                location: data.location || '',
                bio: data.bio || '',
                avatar: data.avatar || '',
                role: data.role || 'CommunityMember',
                joinedDate: data.joinedDate || this._getDefaultJoinedDate(),
                updatedAt: new Date().toISOString()
            };

            StorageManager.set(CONFIG.STORAGE_KEYS.USER_PROFILE, profile);

            var user = StorageManager.get(CONFIG.STORAGE_KEYS.USER, {});
            user.userId = profile.userId;
            user.name = profile.name;
            user.email = profile.email;
            user.phone = profile.phone;
            user.location = profile.location;
            user.bio = profile.bio;
            user.avatar = profile.avatar;
            user.role = profile.role;
            StorageManager.set(CONFIG.STORAGE_KEYS.USER, user);

            return profile;
        },

        _getDefaultJoinedDate: function() {
            var months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            var d = new Date();
            return months[d.getMonth()] + ' ' + d.getFullYear();
        },

        _getDefaultProfile: function() {
            return {
                userId: null,
                name: 'Rescue Hero',
                email: 'hero@rescue.org',
                phone: '',
                location: '',
                bio: '',
                avatar: '',
                role: 'CommunityMember',
                joinedDate: this._getDefaultJoinedDate()
            };
        }
    };

    // ============================================================
    // AVATAR MANAGER
    // ============================================================

    var AvatarManager = {
        upload: function(file) {
            return new Promise(function(resolve, reject) {
                if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
                    reject(new Error('Please upload a PNG, JPG, or WEBP image file.'));
                    return;
                }

                if (file.size > CONFIG.MAX_AVATAR_SIZE) {
                    reject(new Error('Image must be under ' + (CONFIG.MAX_AVATAR_SIZE / 1024 / 1024) + 'MB.'));
                    return;
                }

                var reader = new FileReader();
                reader.onload = function(e) {
                    var img = new Image();
                    img.onload = function() {
                        if (img.width < 100 || img.height < 100) {
                            reject(new Error('Image should be at least 100x100 pixels for best quality.'));
                            return;
                        }

                        var canvas = document.createElement('canvas');
                        var width = img.width;
                        var height = img.height;
                        var maxSize = 400;

                        if (width > maxSize || height > maxSize) {
                            var ratio = Math.min(maxSize / width, maxSize / height);
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }

                        canvas.width = width;
                        canvas.height = height;
                        var ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);

                        resolve(canvas.toDataURL('image/jpeg', 0.85));
                    };
                    img.onerror = function() {
                        reject(new Error('Failed to load image.'));
                    };
                    img.src = e.target.result;
                };
                reader.onerror = function() {
                    reject(new Error('Failed to read file.'));
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // ============================================================
    // PASSWORD MANAGER
    // ============================================================

    var PasswordManager = {
        validate: function(currentPassword, newPassword, confirmPassword) {
            var errors = [];

            if (!currentPassword || currentPassword.length < 1) {
                errors.push('Current password is required');
            }

            if (!newPassword || newPassword.length < CONFIG.MIN_PASSWORD_LENGTH) {
                errors.push('Password must be at least ' + CONFIG.MIN_PASSWORD_LENGTH + ' characters');
            }

            if (newPassword !== confirmPassword) {
                errors.push('Passwords do not match');
            }

            if (newPassword && currentPassword && newPassword === currentPassword) {
                errors.push('New password must be different from current password');
            }

            if (newPassword) {
                var strength = validatePassword(newPassword);
                if (!strength.isValid) {
                    errors = errors.concat(strength.errors);
                }
            }

            return {
                isValid: errors.length === 0,
                errors: errors
            };
        },

        changePassword: function(userId, currentPassword, newPassword) {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    var user = StorageManager.get(CONFIG.STORAGE_KEYS.USER);
                    if (!user) {
                        reject(new Error('User not found'));
                        return;
                    }

                    user.password = newPassword;
                    StorageManager.set(CONFIG.STORAGE_KEYS.USER, user);

                    resolve({
                        success: true,
                        message: 'Password updated successfully!'
                    });
                }, 500);
            });
        }
    };

    // ============================================================
    // TAB MANAGER
    // ============================================================

    var TabManager = {
        init: function() {
            var tabs = document.querySelectorAll('#profileTabs .tab-btn');
            var panels = document.querySelectorAll('.tab-panel');

            tabs.forEach(function(tab) {
                tab.addEventListener('click', function() {
                    tabs.forEach(function(t) {
                        t.classList.remove('active');
                    });
                    this.classList.add('active');

                    var tabId = this.dataset.tab;
                    panels.forEach(function(p) {
                        p.classList.remove('active');
                    });
                    var targetPanel = document.getElementById('tab-' + tabId);
                    if (targetPanel) {
                        targetPanel.classList.add('active');
                    }

                    StorageManager.set('pawssible_last_tab', tabId);
                });
            });

            var lastTab = StorageManager.get('pawssible_last_tab');
            if (lastTab) {
                var tabBtn = document.querySelector('#profileTabs .tab-btn[data-tab="' + lastTab + '"]');
                if (tabBtn) {
                    tabBtn.click();
                }
            }
        }
    };

    // ============================================================
    // SIDEBAR MANAGER
    // ============================================================

    var SidebarManager = {
        init: function() {
            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('sidebarOverlay');
            var mobileMenuBtn = document.getElementById('mobileMenuBtn');
            var sidebarToggle = document.getElementById('sidebarToggle');
            var sidebarReopenBtn = document.getElementById('sidebarReopenBtn');

            if (!sidebar) return;

            var self = this;

            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (window.innerWidth > 860) {
                        sidebar.classList.toggle('collapsed');
                        if (sidebarReopenBtn) {
                            sidebarReopenBtn.classList.toggle('visible', sidebar.classList.contains('collapsed'));
                        }
                    } else {
                        self._toggleMobile();
                    }
                });
            }

            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self._toggleMobile();
                });
            }

            if (sidebarReopenBtn) {
                sidebarReopenBtn.addEventListener('click', function() {
                    sidebar.classList.remove('collapsed');
                    sidebarReopenBtn.classList.remove('visible');
                });
            }

            if (overlay) {
                overlay.addEventListener('click', function() {
                    self._closeMobile();
                });
            }

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
                    self._closeMobile();
                }
            });

            window.addEventListener('resize', function() {
                if (window.innerWidth > 860) {
                    self._closeMobile();
                }
            });

            sidebar.querySelectorAll('.sidebar-nav a').forEach(function(link) {
                link.addEventListener('click', function() {
                    if (window.innerWidth <= 860) {
                        self._closeMobile();
                    }
                });
            });
        },

        _openMobile: function() {
            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('sidebarOverlay');
            var mobileMenuBtn = document.getElementById('mobileMenuBtn');

            if (!sidebar) return;
            sidebar.classList.add('mobile-open');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            if (mobileMenuBtn) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
                mobileMenuBtn.setAttribute('aria-label', 'Close menu');
            }
        },

        _closeMobile: function() {
            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('sidebarOverlay');
            var mobileMenuBtn = document.getElementById('mobileMenuBtn');

            if (!sidebar) return;
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';

            if (mobileMenuBtn) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                mobileMenuBtn.setAttribute('aria-label', 'Open menu');
            }
        },

        _toggleMobile: function() {
            var sidebar = document.getElementById('sidebar');
            if (!sidebar) return;

            if (sidebar.classList.contains('mobile-open')) {
                this._closeMobile();
            } else {
                this._openMobile();
            }
        }
    };

    // ============================================================
    // PROFILE UI CONTROLLER
    // ============================================================

    var ProfileUIController = {
        elements: {},
        _originalProfile: null,
        _notificationPrefs: null,

        init: function() {
            this._cacheElements();
            this._loadProfile();
            this._bindEvents();
            this._setupAvatarUpload();
            this._setupPasswordUpdate();
            this._setupDangerZone();
            this._setupLogout();
            this._setupNotifications();
            this._setupSearch();

            var self = this;
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    self._saveProfile();
                }
            });
        },

        _cacheElements: function() {
            this.elements = {
                displayName: document.getElementById('profileDisplayName'),
                displayEmail: document.getElementById('profileDisplayEmail'),
                joinedDate: document.getElementById('joinedDate'),
                userRole: document.getElementById('userRole'),

                fullName: document.getElementById('fullName'),
                email: document.getElementById('email'),
                phone: document.getElementById('phone'),
                location: document.getElementById('location'),
                bio: document.getElementById('bio'),

                avatar: document.getElementById('profileAvatar'),
                avatarPlaceholder: document.getElementById('avatarPlaceholder'),
                avatarUpload: document.getElementById('avatarUpload'),
                avatarInput: document.getElementById('avatarInput'),

                currentPassword: document.getElementById('currentPassword'),
                newPassword: document.getElementById('newPassword'),
                confirmPassword: document.getElementById('confirmPassword'),
                updatePasswordBtn: document.getElementById('updatePasswordBtn'),
                twoFactorToggle: document.getElementById('twoFactorToggle'),

                language: document.getElementById('language'),
                timezone: document.getElementById('timezone'),

                saveBtn: document.getElementById('saveProfileBtn'),
                cancelBtn: document.getElementById('cancelBtn'),
                deleteAccountBtn: document.getElementById('deleteAccountBtn'),
                confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
                logoutBtn: document.getElementById('logoutBtn'),
                searchBtn: document.getElementById('searchBtn'),
                notifBtn: document.getElementById('notifBtn'),

                dangerZone: document.querySelector('.danger-zone'),

                userNameElements: document.querySelectorAll('.user-name'),
                userEmailElements: document.querySelectorAll('.user-email'),
                userAvatarElements: document.querySelectorAll('.user-avatar')
            };

            this.elements.notificationToggles = document.querySelectorAll('.notification-group .toggle-switch input');
        },

        _loadProfile: function() {
            var profile = ProfileManager.getProfile();

            if (this.elements.fullName) this.elements.fullName.value = profile.name;
            if (this.elements.email) this.elements.email.value = profile.email;
            if (this.elements.phone) this.elements.phone.value = profile.phone || '';
            if (this.elements.location) this.elements.location.value = profile.location || '';
            if (this.elements.bio) this.elements.bio.value = profile.bio || '';

            if (this.elements.displayName) this.elements.displayName.textContent = profile.name;
            if (this.elements.displayEmail) this.elements.displayEmail.textContent = profile.email;
            if (this.elements.joinedDate) this.elements.joinedDate.textContent = profile.joinedDate || 'January 2024';

            if (this.elements.userRole) {
                var roleNames = {
                    'Admin': 'Administrator',
                    'CommunityMember': 'Community Member',
                    'Volunteer': 'Volunteer',
                    'Rescuer': 'Rescuer',
                    'OrganizationRep': 'Organization Representative',
                    'VetProvider': 'Veterinary Provider'
                };
                this.elements.userRole.textContent = roleNames[profile.role] || profile.role || 'Community Member';
            }

            var self = this;
            this.elements.userNameElements.forEach(function(el) {
                el.textContent = profile.name;
            });
            this.elements.userEmailElements.forEach(function(el) {
                el.textContent = profile.email;
            });

            if (profile.avatar) {
                if (this.elements.avatar) {
                    this.elements.avatar.src = profile.avatar;
                    this.elements.avatar.style.display = 'block';
                }
                if (this.elements.avatarPlaceholder) {
                    this.elements.avatarPlaceholder.style.display = 'none';
                }
                this.elements.userAvatarElements.forEach(function(el) {
                    if (el.tagName === 'IMG') {
                        el.src = profile.avatar;
                    }
                });
            }

            if (this.elements.language) this.elements.language.value = profile.language || 'en';
            if (this.elements.timezone) this.elements.timezone.value = profile.timezone || 'EST';
            if (this.elements.twoFactorToggle) this.elements.twoFactorToggle.checked = !!profile.twoFactor;

            this._originalProfile = deepClone(profile);
            this._loadNotificationPreferences();
        },

        _loadNotificationPreferences: function() {
            var prefs = StorageManager.get('pawssible_notification_prefs', {
                rescueReminders: true,
                healthUpdates: true,
                shelterUpdates: false,
                rescueTips: true,
                rescueAlerts: true,
                messageNotifications: true,
                reviewReminders: false
            });

            var toggles = this.elements.notificationToggles;
            if (toggles.length >= 7) {
                toggles[0].checked = prefs.rescueReminders !== false;
                toggles[1].checked = prefs.healthUpdates !== false;
                toggles[2].checked = !!prefs.shelterUpdates;
                toggles[3].checked = prefs.rescueTips !== false;
                toggles[4].checked = prefs.rescueAlerts !== false;
                toggles[5].checked = prefs.messageNotifications !== false;
                toggles[6].checked = !!prefs.reviewReminders;
            }

            this._notificationPrefs = prefs;
        },

        _saveNotificationPreferences: function() {
            var toggles = this.elements.notificationToggles;
            if (toggles.length >= 7) {
                var prefs = {
                    rescueReminders: toggles[0].checked,
                    healthUpdates: toggles[1].checked,
                    shelterUpdates: toggles[2].checked,
                    rescueTips: toggles[3].checked,
                    rescueAlerts: toggles[4].checked,
                    messageNotifications: toggles[5].checked,
                    reviewReminders: toggles[6].checked
                };
                StorageManager.set('pawssible_notification_prefs', prefs);
                this._notificationPrefs = prefs;
                ToastManager.success('Notification preferences saved!');
            }
        },

        _saveProfile: function() {
            var name = this.elements.fullName ? this.elements.fullName.value.trim() : '';
            var email = this.elements.email ? this.elements.email.value.trim() : '';

            if (!name) {
                ToastManager.error('Name is required.');
                return false;
            }

            if (!email || !isValidEmail(email)) {
                ToastManager.error('Please enter a valid email address.');
                return false;
            }

            var avatar = '';
            if (this.elements.avatar) {
                avatar = this.elements.avatar.src;
                if (avatar && avatar.startsWith('blob:')) {
                    var profile = ProfileManager.getProfile();
                    avatar = profile.avatar || '';
                }
            }

            var profileData = {
                userId: this._originalProfile ? this._originalProfile.userId : null,
                name: name,
                email: email,
                phone: this.elements.phone ? this.elements.phone.value.trim() : '',
                location: this.elements.location ? this.elements.location.value.trim() : '',
                bio: this.elements.bio ? this.elements.bio.value.trim() : '',
                avatar: avatar,
                role: this._originalProfile ? this._originalProfile.role : 'CommunityMember',
                joinedDate: this.elements.joinedDate ? this.elements.joinedDate.textContent : 'January 2024',
                language: this.elements.language ? this.elements.language.value : 'en',
                timezone: this.elements.timezone ? this.elements.timezone.value : 'EST',
                twoFactor: this.elements.twoFactorToggle ? this.elements.twoFactorToggle.checked : false
            };

            ProfileManager.saveProfile(profileData);

            if (this.elements.displayName) this.elements.displayName.textContent = name;
            if (this.elements.displayEmail) this.elements.displayEmail.textContent = email;

            var self = this;
            this.elements.userNameElements.forEach(function(el) {
                el.textContent = name;
            });
            this.elements.userEmailElements.forEach(function(el) {
                el.textContent = email;
            });

            this._saveNotificationPreferences();
            this._originalProfile = deepClone(profileData);
            ToastManager.success('Profile saved successfully!');
            return true;
        },

        _resetProfile: function() {
            if (this._originalProfile) {
                var current = {
                    name: this.elements.fullName ? this.elements.fullName.value : '',
                    email: this.elements.email ? this.elements.email.value : '',
                    phone: this.elements.phone ? this.elements.phone.value : '',
                    location: this.elements.location ? this.elements.location.value : '',
                    bio: this.elements.bio ? this.elements.bio.value : '',
                    language: this.elements.language ? this.elements.language.value : 'en',
                    timezone: this.elements.timezone ? this.elements.timezone.value : 'EST'
                };

                var original = {
                    name: this._originalProfile.name || '',
                    email: this._originalProfile.email || '',
                    phone: this._originalProfile.phone || '',
                    location: this._originalProfile.location || '',
                    bio: this._originalProfile.bio || '',
                    language: this._originalProfile.language || 'en',
                    timezone: this._originalProfile.timezone || 'EST'
                };

                var hasChanges = JSON.stringify(current) !== JSON.stringify(original);

                if (hasChanges && !confirm('Reset all changes? Unsaved changes will be lost.')) {
                    return;
                }

                this._loadProfile();
                ToastManager.info('Changes reset.');
            } else {
                this._loadProfile();
                ToastManager.info('Changes reset.');
            }
        },

        _setupAvatarUpload: function() {
            var upload = this.elements.avatarUpload;
            var input = this.elements.avatarInput;

            if (!upload || !input) return;

            var self = this;

            upload.addEventListener('click', function() {
                input.click();
            });

            input.addEventListener('change', function() {
                var file = this.files[0];
                if (!file) return;

                AvatarManager.upload(file)
                    .then(function(dataUrl) {
                        if (self.elements.avatar) {
                            self.elements.avatar.src = dataUrl;
                            self.elements.avatar.style.display = 'block';
                        }
                        if (self.elements.avatarPlaceholder) {
                            self.elements.avatarPlaceholder.style.display = 'none';
                        }
                        self.elements.userAvatarElements.forEach(function(el) {
                            if (el.tagName === 'IMG') {
                                el.src = dataUrl;
                            }
                        });
                        ToastManager.success('Avatar uploaded! Click "Save" to keep changes.');
                    })
                    .catch(function(error) {
                        ToastManager.error(error.message || 'Failed to upload avatar.');
                        input.value = '';
                    });
            });
        },

        _setupPasswordUpdate: function() {
            var btn = this.elements.updatePasswordBtn;
            if (!btn) return;

            var self = this;

            btn.addEventListener('click', function() {
                var current = self.elements.currentPassword ? self.elements.currentPassword.value : '';
                var newPwd = self.elements.newPassword ? self.elements.newPassword.value : '';
                var confirm = self.elements.confirmPassword ? self.elements.confirmPassword.value : '';

                var validation = PasswordManager.validate(current, newPwd, confirm);
                if (!validation.isValid) {
                    ToastManager.error(validation.errors.join('. '));
                    return;
                }

                // Show loading state
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

                PasswordManager.changePassword(null, current, newPwd)
                    .then(function(result) {
                        if (result.success) {
                            if (self.elements.currentPassword) self.elements.currentPassword.value = '';
                            if (self.elements.newPassword) self.elements.newPassword.value = '';
                            if (self.elements.confirmPassword) self.elements.confirmPassword.value = '';
                            ToastManager.success(result.message);
                        }
                    })
                    .catch(function(error) {
                        ToastManager.error(error.message || 'Failed to update password.');
                    })
                    .finally(function() {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-key"></i> Update Password';
                    });
            });

            var passwordFields = [
                this.elements.currentPassword,
                this.elements.newPassword,
                this.elements.confirmPassword
            ].filter(function(el) { return el; });

            passwordFields.forEach(function(field) {
                field.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        btn.click();
                    }
                });
            });
        },

        _setupDangerZone: function() {
            var deleteBtn = this.elements.deleteAccountBtn;
            var confirmBtn = this.elements.confirmDeleteBtn;

            if (!deleteBtn || !confirmBtn) return;

            var confirmed = false;

            var self = this;

            confirmBtn.addEventListener('click', function() {
                confirmed = !confirmed;
                if (confirmed) {
                    this.innerHTML = '<i class="fas fa-check-circle"></i> Confirmed - Ready to delete';
                    this.style.borderColor = 'var(--danger)';
                    this.style.background = 'var(--danger)';
                    this.style.color = '#fff';
                    ToastManager.warning('Account deletion confirmed. Click "Delete Account" to proceed.');
                } else {
                    this.innerHTML = '<i class="fas fa-check-circle"></i> I understand, confirm deletion';
                    this.style.borderColor = '';
                    this.style.background = '';
                    this.style.color = '';
                    ToastManager.info('Deletion confirmation cancelled.');
                }
            });

            deleteBtn.addEventListener('click', function() {
                if (!confirmed) {
                    ToastManager.error('Please confirm deletion first by clicking "I understand, confirm deletion".');
                    return;
                }

                if (!confirm('⚠️ WARNING: You are about to permanently delete your account. This action is IRREVERSIBLE.')) {
                    return;
                }
                if (!confirm('All your data including rescue animals, providers, operations, and reviews will be lost FOREVER. Continue?')) {
                    return;
                }

                var deleteCode = prompt('Type "DELETE" to confirm account deletion:');
                if (deleteCode !== 'DELETE') {
                    ToastManager.error('Deletion cancelled. You did not type the confirmation code.');
                    return;
                }

                ToastManager.error('🗑️ Account deletion in progress... You will be redirected shortly.');

                StorageManager.clearAppData();
                StorageManager.remove('pawssible_user_profile');
                StorageManager.remove('pawssible_notification_prefs');

                setTimeout(function() {
                    window.location.href = 'login.html';
                }, 3000);
            });
        },

        _setupLogout: function() {
            var btn = this.elements.logoutBtn;
            if (!btn) return;

            btn.addEventListener('click', function() {
                if (!confirm('Are you sure you want to logout?')) return;
                StorageManager.remove(CONFIG.STORAGE_KEYS.TOKEN);
                window.location.href = 'login.html';
            });
        },

        _setupNotifications: function() {
            var btn = this.elements.notifBtn;
            if (!btn) return;

            btn.addEventListener('click', function() {
                ToastManager.info('🔔 You have no new notifications.');
            });
        },

        _setupSearch: function() {
            var btn = this.elements.searchBtn;
            if (!btn) return;

            btn.addEventListener('click', function() {
                ToastManager.info('🔍 Search your profile content.');
            });
        },

        _bindEvents: function() {
            var self = this;

            if (this.elements.saveBtn) {
                this.elements.saveBtn.addEventListener('click', function() {
                    self._saveProfile();
                });
            }

            if (this.elements.cancelBtn) {
                this.elements.cancelBtn.addEventListener('click', function() {
                    self._resetProfile();
                });
            }

            var toggles = this.elements.notificationToggles;
            toggles.forEach(function(toggle) {
                toggle.addEventListener('change', function() {
                    setTimeout(function() {
                        self._saveNotificationPreferences();
                    }, 500);
                });
            });

            if (this.elements.twoFactorToggle) {
                this.elements.twoFactorToggle.addEventListener('change', function() {
                    var status = this.checked ? 'enabled' : 'disabled';
                    ToastManager.info('Two-factor authentication ' + status + '.');
                });
            }

            if (this.elements.language) {
                this.elements.language.addEventListener('change', function() {
                    ToastManager.info('Language preference updated. Click "Save" to keep changes.');
                });
            }

            if (this.elements.timezone) {
                this.elements.timezone.addEventListener('change', function() {
                    ToastManager.info('Timezone preference updated. Click "Save" to keep changes.');
                });
            }
        }
    };

    // ============================================================
    // INITIALIZATION
    // ============================================================

    document.addEventListener('DOMContentLoaded', function() {
        TabManager.init();
        SidebarManager.init();
        ProfileUIController.init();
        console.log('🐾 Pawssible Profile initialized successfully!');
    });

})();