// ============================================================
// Pawssible · Resource Library JavaScript
// Stray Animal Rescue and Assistance Management System
// Version 3.12.50
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================

    var CONFIG = {
        TOAST_DURATION: 3000,
        RESOURCES_PER_PAGE: 9,
        STORAGE_KEYS: {
            RESOURCES: 'pawssible_resources',
            FAVORITES: 'pawssible_resource_favorites',
            USER: 'user'
        },
        CATEGORIES: [
            { id: 'all', label: 'All', icon: 'fa-th-large' },
            { id: 'rescue', label: 'Rescue Tips', icon: 'fa-hand-holding-heart' },
            { id: 'health', label: 'Health & Wellness', icon: 'fa-heartbeat' },
            { id: 'training', label: 'Training', icon: 'fa-graduation-cap' },
            { id: 'adoption', label: 'Adoption', icon: 'fa-home' },
            { id: 'nutrition', label: 'Nutrition', icon: 'fa-apple-alt' },
            { id: 'emergency', label: 'Emergency', icon: 'fa-ambulance' },
            { id: 'legal', label: 'Legal', icon: 'fa-gavel' }
        ],
        SORT_OPTIONS: [
            { value: 'newest', label: 'Newest First' },
            { value: 'popular', label: 'Most Popular' },
            { value: 'title', label: 'Alphabetical' },
            { value: 'oldest', label: 'Oldest First' }
        ]
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    function escapeHTML(str) {
        if (!str) return '';
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(str).replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function truncateText(text, maxLength) {
        maxLength = maxLength || 120;
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function getCategoryLabel(id) {
        var category = CONFIG.CATEGORIES.find(function(c) { return c.id === id; });
        return category ? category.label : id;
    }

    function getCategoryIcon(id) {
        var category = CONFIG.CATEGORIES.find(function(c) { return c.id === id; });
        return category ? category.icon : 'fa-file';
    }

    function getCategoryColor(id) {
        var colors = {
            rescue: '#d1552f',
            health: '#2d7d6a',
            training: '#4a7fb5',
            adoption: '#7d5d3a',
            nutrition: '#6a8d3a',
            emergency: '#c0392b',
            legal: '#5d4a7d'
        };
        return colors[id] || '#8fa9a1';
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
    // RESOURCE MANAGER
    // ============================================================

    var ResourceManager = {
        getAll: function() {
            return StorageManager.get(CONFIG.STORAGE_KEYS.RESOURCES, []);
        },

        getById: function(id) {
            var resources = this.getAll();
            for (var i = 0; i < resources.length; i++) {
                if (resources[i].id === id) {
                    return resources[i];
                }
            }
            return null;
        },

        getByCategory: function(categoryId) {
            if (categoryId === 'all' || !categoryId) {
                return this.getAll();
            }
            var resources = this.getAll();
            return resources.filter(function(r) {
                return r.category === categoryId;
            });
        },

        search: function(query) {
            if (!query) return this.getAll();
            var q = query.toLowerCase();
            var resources = this.getAll();
            return resources.filter(function(r) {
                return (r.title && r.title.toLowerCase().includes(q)) ||
                       (r.description && r.description.toLowerCase().includes(q)) ||
                       (r.content && r.content.toLowerCase().includes(q)) ||
                       (r.tags && r.tags.some(function(tag) { return tag.toLowerCase().includes(q); }));
            });
        },

        add: function(data) {
            var resources = this.getAll();
            var resource = {
                id: generateId(),
                title: data.title || 'Untitled Resource',
                description: data.description || '',
                content: data.content || '',
                category: data.category || 'general',
                tags: data.tags || [],
                author: data.author || 'Anonymous',
                authorId: data.authorId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                views: 0,
                favorites: 0
            };
            resources.unshift(resource);
            StorageManager.set(CONFIG.STORAGE_KEYS.RESOURCES, resources);
            return resource;
        },

        update: function(id, updates) {
            var resources = this.getAll();
            var index = -1;
            for (var i = 0; i < resources.length; i++) {
                if (resources[i].id === id) {
                    index = i;
                    break;
                }
            }
            if (index === -1) return null;

            resources[index] = Object.assign({}, resources[index], updates, {
                updatedAt: new Date().toISOString()
            });
            StorageManager.set(CONFIG.STORAGE_KEYS.RESOURCES, resources);
            return resources[index];
        },

        delete: function(id) {
            var resources = this.getAll();
            var filtered = resources.filter(function(r) { return r.id !== id; });
            if (filtered.length === resources.length) return false;
            StorageManager.set(CONFIG.STORAGE_KEYS.RESOURCES, filtered);
            return true;
        },

        incrementViews: function(id) {
            var resource = this.getById(id);
            if (!resource) return null;
            return this.update(id, { views: (resource.views || 0) + 1 });
        },

        toggleFavorite: function(id) {
            var favorites = StorageManager.get(CONFIG.STORAGE_KEYS.FAVORITES, []);
            var index = favorites.indexOf(id);
            var isFavorite = index > -1;
            
            if (isFavorite) {
                favorites.splice(index, 1);
                var resource = this.getById(id);
                if (resource) {
                    this.update(id, { favorites: Math.max(0, (resource.favorites || 0) - 1) });
                }
            } else {
                favorites.push(id);
                var resource = this.getById(id);
                if (resource) {
                    this.update(id, { favorites: (resource.favorites || 0) + 1 });
                }
            }
            StorageManager.set(CONFIG.STORAGE_KEYS.FAVORITES, favorites);
            return !isFavorite;
        },

        isFavorite: function(id) {
            var favorites = StorageManager.get(CONFIG.STORAGE_KEYS.FAVORITES, []);
            return favorites.indexOf(id) > -1;
        },

        getFavorites: function() {
            var favorites = StorageManager.get(CONFIG.STORAGE_KEYS.FAVORITES, []);
            var resources = this.getAll();
            return resources.filter(function(r) {
                return favorites.indexOf(r.id) > -1;
            });
        },

        count: function(categoryId) {
            if (categoryId && categoryId !== 'all') {
                return this.getByCategory(categoryId).length;
            }
            return this.getAll().length;
        },

        seedSampleData: function() {
            if (StorageManager.get(CONFIG.STORAGE_KEYS.RESOURCES, []).length > 0) {
                return;
            }

            var now = new Date();
            var sampleResources = [
                {
                    id: generateId(),
                    title: 'How to Safely Rescue a Stray Animal',
                    description: 'Learn the proper techniques and safety measures when rescuing stray animals in need.',
                    content: 'When encountering a stray animal, approach slowly and calmly. Look for signs of injury or distress. Contact local animal control or rescue organizations for assistance. Always prioritize your safety and the animal\'s well-being.\n\nKey steps:\n1. Assess the situation from a safe distance\n2. Call for backup if needed\n3. Approach slowly and speak softly\n4. Use treats to build trust\n5. Secure the animal safely\n6. Transport to a vet or shelter',
                    category: 'rescue',
                    tags: ['rescue', 'safety', 'strays', 'how-to'],
                    author: 'Pawssible Team',
                    createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    views: 125,
                    favorites: 15
                },
                {
                    id: generateId(),
                    title: 'Vaccination Guide for Rescued Animals',
                    description: 'Essential vaccinations every rescued animal should receive and their schedules.',
                    content: 'Core vaccines for dogs include rabies, distemper, parvovirus, and hepatitis. For cats, core vaccines include rabies, feline distemper, and feline herpesvirus. Always consult with a veterinarian for personalized advice.\n\nRecommended schedule:\n- First visit: Core vaccines, deworming\n- 2-3 weeks later: Booster shots\n- Annual: Rabies booster\n- Every 3 years: Core vaccine boosters',
                    category: 'health',
                    tags: ['vaccines', 'health', 'veterinary', 'guide'],
                    author: 'Dr. Maria Santos',
                    createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
                    views: 89,
                    favorites: 22
                },
                {
                    id: generateId(),
                    title: 'Understanding Animal Behavior Basics',
                    description: 'Learn to read animal body language and understand common behaviors in rescued animals.',
                    content: 'Animals communicate through body language. A wagging tail may indicate excitement, while tucked tail suggests fear. Ears pinned back often indicate submission or fear. Understanding these signals helps build trust.\n\nCommon signals:\n- Tail wagging: Excitement or nervousness\n- Tail tucked: Fear or submission\n- Ears forward: Alert and interested\n- Ears back: Fear or submission\n- Yawning: Stress or calming signal\n- Licking lips: Stress or appeasement',
                    category: 'training',
                    tags: ['behavior', 'training', 'communication', 'body-language'],
                    author: 'Sarah Johnson',
                    createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    views: 67,
                    favorites: 8
                },
                {
                    id: generateId(),
                    title: 'Preparing Your Home for a New Pet',
                    description: 'Essential checklist for welcoming a rescued animal into your home.',
                    content: 'Prepare a safe space with food, water, and bedding. Remove hazards like toxic plants and small objects. Purchase necessary supplies: food bowls, collar, leash, and toys. Schedule a vet visit within the first week.\n\nChecklist:\n- [ ] Safe space with bed and water\n- [ ] Pet-proofed home (remove hazards)\n- [ ] Food and water bowls\n- [ ] Collar, ID tag, leash\n- [ ] Toys and enrichment items\n- [ ] Veterinary appointment scheduled\n- [ ] Pet insurance considered',
                    category: 'adoption',
                    tags: ['adoption', 'home', 'preparation', 'checklist'],
                    author: 'Pawssible Team',
                    createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    views: 156,
                    favorites: 30
                },
                {
                    id: generateId(),
                    title: 'Nutrition Basics for Rescued Animals',
                    description: 'Understanding dietary needs and proper nutrition for rescued pets.',
                    content: 'Rescued animals often come with nutritional deficiencies. Provide high-quality protein, balanced fats, and essential vitamins. Introduce new foods gradually to avoid digestive upset. Always provide fresh, clean water.\n\nKey nutrients:\n- Protein: Building blocks for muscles and organs\n- Fats: Energy source and skin/coat health\n- Carbohydrates: Energy and fiber\n- Vitamins: Immune system support\n- Minerals: Bone and teeth health\n\nTransition plan:\nDay 1-2: 25% new food, 75% old\nDay 3-4: 50% new food, 50% old\nDay 5-6: 75% new food, 25% old\nDay 7+: 100% new food',
                    category: 'nutrition',
                    tags: ['nutrition', 'food', 'diet', 'health'],
                    author: 'Dr. Mark Reyes',
                    createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    views: 78,
                    favorites: 12
                },
                {
                    id: generateId(),
                    title: 'Emergency First Aid for Animals',
                    description: 'What to do in animal emergency situations before reaching a vet.',
                    content: 'Keep a pet first aid kit handy. For bleeding, apply pressure with a clean cloth. For burns, cool with water for 10 minutes. For poisoning, contact poison control immediately. Never induce vomiting without veterinary advice.\n\nEmergency kit essentials:\n- Gauze and bandages\n- Antiseptic wipes\n- Tweezers\n- Scissors\n- Thermometer\n- Hydrogen peroxide (3%)\n- Eye wash solution\n- Blanket\n- Emergency contact numbers\n\nEmergency protocol:\n1. Stay calm and assess the situation\n2. Call your vet or emergency clinic\n3. Follow first aid instructions\n4. Transport safely to the clinic',
                    category: 'emergency',
                    tags: ['emergency', 'first-aid', 'safety', 'kit'],
                    author: 'Vet Emergency Team',
                    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    views: 234,
                    favorites: 45
                },
                {
                    id: generateId(),
                    title: 'Animal Welfare Laws and Rights',
                    description: 'Understanding animal protection laws and your rights as a rescuer.',
                    content: 'The Animal Welfare Act protects animals from cruelty and neglect. Report animal cruelty to local authorities. Know your rights when intervening in animal abuse situations. Stay informed about local ordinances.\n\nKey laws:\n- Animal Welfare Act: Federal protection\n- State anti-cruelty laws\n- Local ordinances on animal control\n- Reporting requirements\n\nYour rights as a rescuer:\n- Right to report suspected cruelty\n- Right to intervene in emergencies\n- Right to provide care for rescued animals',
                    category: 'legal',
                    tags: ['laws', 'rights', 'welfare', 'legal'],
                    author: 'Legal Aid Society',
                    createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
                    views: 45,
                    favorites: 6
                }
            ];

            StorageManager.set(CONFIG.STORAGE_KEYS.RESOURCES, sampleResources);
        }
    };

    // ============================================================
    // RESOURCE LIBRARY UI CONTROLLER
    // ============================================================

    var ResourceLibraryUI = {
        elements: {},
        currentCategory: 'all',
        currentSort: 'newest',
        currentSearch: '',
        currentPage: 1,
        totalPages: 1,
        allResources: [],

        init: function() {
            ResourceManager.seedSampleData();
            this._cacheElements();
            this._renderCategories();
            this._loadResources();
            this._bindEvents();
            this._setupSidebar();
            this._setupLogout();

            console.log('📚 Pawssible Resource Library initialized!');
            console.log('📊 Total resources: ' + ResourceManager.count());
            console.log('⭐ Favorites: ' + ResourceManager.getFavorites().length);
        },

        _cacheElements: function() {
            this.elements = {
                resourcesContainer: document.getElementById('resourcesContainer'),
                categoryFilter: document.getElementById('categoryFilter'),
                sortSelect: document.getElementById('sortSelect'),
                searchInput: document.getElementById('searchInput'),
                clearSearchBtn: document.getElementById('clearSearchBtn'),
                resultsCount: document.getElementById('resultsCount'),
                categoryCount: document.getElementById('categoryCount'),
                pagination: document.getElementById('pagination'),
                resourceModal: document.getElementById('resourceModal'),
                modalTitle: document.getElementById('modalTitle'),
                modalCategory: document.getElementById('modalCategory'),
                modalContent: document.getElementById('modalContent'),
                modalDate: document.getElementById('modalDate'),
                modalAuthor: document.getElementById('modalAuthor'),
                modalViews: document.getElementById('modalViews'),
                modalFavorites: document.getElementById('modalFavorites'),
                modalFavoriteBtn: document.getElementById('modalFavoriteBtn'),
                closeModalBtn: document.getElementById('closeModalBtn'),
                closeModalFooterBtn: document.getElementById('closeModalFooterBtn'),
                addResourceModal: document.getElementById('addResourceModal'),
                closeAddModalBtn: document.getElementById('closeAddModalBtn'),
                cancelAddBtn: document.getElementById('cancelAddBtn'),
                addResourceForm: document.getElementById('addResourceForm'),
                addResourceBtn: document.getElementById('addResourceBtn'),
                emptyAddBtn: document.getElementById('emptyAddBtn'),
                sidebar: document.getElementById('sidebar'),
                sidebarOverlay: document.getElementById('sidebarOverlay'),
                mobileMenuBtn: document.getElementById('mobileMenuBtn'),
                logoutBtn: document.getElementById('logoutBtn'),
                favoriteFilter: document.getElementById('favoriteFilter'),
                exportBtn: document.getElementById('exportBtn'),
                searchBtn: document.getElementById('searchBtn'),
                notifBtn: document.getElementById('notifBtn')
            };
        },

        _renderCategories: function() {
            var container = this.elements.categoryFilter;
            if (!container) return;

            var html = '';
            var self = this;

            CONFIG.CATEGORIES.forEach(function(category) {
                var count = ResourceManager.count(category.id);
                var activeClass = self.currentCategory === category.id ? 'active' : '';
                var color = category.id !== 'all' ? getCategoryColor(category.id) : '';
                html += 
                    '<button class="category-btn ' + activeClass + '" data-category="' + category.id + '">' +
                        '<i class="fas ' + category.icon + '"></i> ' +
                        category.label +
                        ' <span class="count">' + count + '</span>' +
                    '</button>';
            });

            container.innerHTML = html;
        },

        _loadResources: function() {
            var self = this;
            var resources = [];

            // Apply filters
            if (this.currentSearch) {
                resources = ResourceManager.search(this.currentSearch);
            } else if (this.currentCategory === 'favorites') {
                resources = ResourceManager.getFavorites();
            } else {
                resources = ResourceManager.getByCategory(this.currentCategory);
            }

            this.allResources = resources;

            // Apply sorting
            resources = this._sortResources(resources);

            // Calculate pagination
            var total = resources.length;
            var perPage = CONFIG.RESOURCES_PER_PAGE;
            this.totalPages = Math.ceil(total / perPage);
            if (this.currentPage > this.totalPages) {
                this.currentPage = Math.max(1, this.totalPages);
            }

            var start = (this.currentPage - 1) * perPage;
            var end = Math.min(start + perPage, total);
            var pageResources = resources.slice(start, end);

            // Update results count
            if (this.elements.resultsCount) {
                this.elements.resultsCount.textContent = total;
            }

            // Update category count
            if (this.elements.categoryCount) {
                var uniqueCategories = new Set();
                resources.forEach(function(r) {
                    if (r.category) uniqueCategories.add(r.category);
                });
                this.elements.categoryCount.textContent = uniqueCategories.size || '0';
            }

            // Render resources
            this._renderResources(pageResources, total, start, end);

            // Render pagination
            this._renderPagination();
        },

        _sortResources: function(resources) {
            var sorted = resources.slice();

            switch (this.currentSort) {
                case 'newest':
                    sorted.sort(function(a, b) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    });
                    break;
                case 'oldest':
                    sorted.sort(function(a, b) {
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    });
                    break;
                case 'title':
                    sorted.sort(function(a, b) {
                        return (a.title || '').localeCompare(b.title || '');
                    });
                    break;
                case 'popular':
                    sorted.sort(function(a, b) {
                        return (b.views || 0) - (a.views || 0);
                    });
                    break;
                default:
                    break;
            }

            return sorted;
        },

        _renderResources: function(resources, total, start, end) {
            var container = this.elements.resourcesContainer;
            if (!container) return;

            if (resources.length === 0) {
                container.innerHTML = this._getEmptyStateHTML();
                return;
            }

            var html = '<div class="resources-grid">';
            var self = this;

            resources.forEach(function(resource) {
                var isFavorite = ResourceManager.isFavorite(resource.id);
                var categoryLabel = getCategoryLabel(resource.category);
                var categoryIcon = getCategoryIcon(resource.category);
                var categoryColor = getCategoryColor(resource.category);
                var truncatedDesc = truncateText(resource.description, 100);

                html += 
                    '<div class="resource-card" data-id="' + resource.id + '">' +
                        '<div class="resource-card-header">' +
                            '<span class="resource-category" style="border-color: ' + categoryColor + '; color: ' + categoryColor + ';">' +
                                '<i class="fas ' + categoryIcon + '"></i> ' + categoryLabel +
                            '</span>' +
                            '<button class="favorite-btn ' + (isFavorite ? 'active' : '') + '" data-id="' + resource.id + '" aria-label="Toggle favorite">' +
                                '<i class="fas fa-heart"></i>' +
                            '</button>' +
                        '</div>' +
                        '<div class="resource-card-body">' +
                            '<h3 class="resource-title">' + escapeHTML(resource.title) + '</h3>' +
                            '<p class="resource-description">' + escapeHTML(truncatedDesc) + '</p>' +
                            '<div class="resource-card-footer">' +
                                '<span><i class="fas fa-user"></i> ' + escapeHTML(resource.author) + '</span>' +
                                '<span><i class="fas fa-calendar-alt"></i> ' + formatDate(resource.createdAt) + '</span>' +
                            '</div>' +
                            '<div class="resource-stats">' +
                                '<span><i class="fas fa-eye"></i> ' + (resource.views || 0) + '</span>' +
                                '<span><i class="fas fa-heart"></i> ' + (resource.favorites || 0) + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
            });

            html += '</div>';
            container.innerHTML = html;

            // Add event listeners to resource cards
            container.querySelectorAll('.resource-card').forEach(function(card) {
                card.addEventListener('click', function(e) {
                    if (e.target.closest('.favorite-btn')) return;
                    var id = this.dataset.id;
                    self._openResourceModal(id);
                });
            });

            // Add event listeners to favorite buttons
            container.querySelectorAll('.favorite-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = this.dataset.id;
                    var isFavorite = ResourceManager.toggleFavorite(id);
                    this.classList.toggle('active');
                    
                    // Update favorite count on card
                    var card = this.closest('.resource-card');
                    if (card) {
                        var favSpan = card.querySelector('.resource-stats span:last-child');
                        var resource = ResourceManager.getById(id);
                        if (favSpan && resource) {
                            favSpan.innerHTML = '<i class="fas fa-heart"></i> ' + (resource.favorites || 0);
                        }
                    }
                    
                    ToastManager.success(isFavorite ? 'Added to favorites!' : 'Removed from favorites.');
                    self._updateCategoryCounts();
                    
                    if (self.currentCategory === 'favorites') {
                        self._loadResources();
                    }
                });
            });
        },

        _renderPagination: function() {
            var container = this.elements.pagination;
            if (!container) return;

            if (this.totalPages <= 1) {
                container.innerHTML = '';
                return;
            }

            var html = '<div class="pagination">';
            var self = this;

            html += '<button class="page-btn" data-page="prev" ' + (this.currentPage <= 1 ? 'disabled' : '') + '>' +
                        '<i class="fas fa-chevron-left"></i>' +
                    '</button>';

            var startPage = Math.max(1, this.currentPage - 2);
            var endPage = Math.min(this.totalPages, this.currentPage + 2);

            if (startPage > 1) {
                html += '<button class="page-btn" data-page="1">1</button>';
                if (startPage > 2) {
                    html += '<span class="page-ellipsis">…</span>';
                }
            }

            for (var i = startPage; i <= endPage; i++) {
                var active = i === this.currentPage ? 'active' : '';
                html += '<button class="page-btn ' + active + '" data-page="' + i + '">' + i + '</button>';
            }

            if (endPage < this.totalPages) {
                if (endPage < this.totalPages - 1) {
                    html += '<span class="page-ellipsis">…</span>';
                }
                html += '<button class="page-btn" data-page="' + this.totalPages + '">' + this.totalPages + '</button>';
            }

            html += '<button class="page-btn" data-page="next" ' + (this.currentPage >= this.totalPages ? 'disabled' : '') + '>' +
                        '<i class="fas fa-chevron-right"></i>' +
                    '</button>';

            html += '</div>';
            container.innerHTML = html;

            container.querySelectorAll('.page-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var page = this.dataset.page;
                    if (page === 'prev') {
                        self.currentPage = Math.max(1, self.currentPage - 1);
                    } else if (page === 'next') {
                        self.currentPage = Math.min(self.totalPages, self.currentPage + 1);
                    } else {
                        self.currentPage = parseInt(page);
                    }
                    self._loadResources();
                    if (self.elements.resourcesContainer) {
                        self.elements.resourcesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        },

        _getEmptyStateHTML: function() {
            var message = 'No resources found';
            var subMessage = 'Try adjusting your search or filters';

            if (this.currentSearch) {
                message = 'No resources match your search';
                subMessage = 'Try a different search term or clear your filters';
            } else if (this.currentCategory === 'favorites') {
                message = 'No favorite resources yet';
                subMessage = 'Click the heart icon on any resource to save it here';
            }

            return '<div class="empty-state">' +
                        '<div class="empty-icon"><i class="fas fa-book-open"></i></div>' +
                        '<h3>' + message + '</h3>' +
                        '<p>' + subMessage + '</p>' +
                        '<button class="btn-primary" id="emptyAddBtn"><i class="fas fa-plus"></i> Add Resource</button>' +
                    '</div>';
        },

        _updateCategoryCounts: function() {
            var buttons = document.querySelectorAll('.category-btn');
            buttons.forEach(function(btn) {
                var category = btn.dataset.category;
                var count = ResourceManager.count(category);
                var countSpan = btn.querySelector('.count');
                if (countSpan) {
                    countSpan.textContent = count;
                }
            });
        },

        _openResourceModal: function(id) {
            var resource = ResourceManager.getById(id);
            if (!resource) {
                ToastManager.error('Resource not found.');
                return;
            }

            ResourceManager.incrementViews(id);

            var modal = this.elements.resourceModal;
            if (!modal) return;

            var isFavorite = ResourceManager.isFavorite(id);
            var categoryLabel = getCategoryLabel(resource.category);
            var categoryIcon = getCategoryIcon(resource.category);
            var categoryColor = getCategoryColor(resource.category);

            if (this.elements.modalTitle) {
                this.elements.modalTitle.textContent = resource.title;
            }

            if (this.elements.modalCategory) {
                this.elements.modalCategory.innerHTML = 
                    '<i class="fas ' + categoryIcon + '"></i> ' + categoryLabel;
                this.elements.modalCategory.style.borderColor = categoryColor;
                this.elements.modalCategory.style.color = categoryColor;
            }

            if (this.elements.modalContent) {
                var content = resource.content || resource.description || 'No content available.';
                this.elements.modalContent.textContent = content;
            }

            if (this.elements.modalDate) {
                this.elements.modalDate.textContent = formatDate(resource.createdAt);
            }

            if (this.elements.modalAuthor) {
                this.elements.modalAuthor.textContent = resource.author || 'Anonymous';
            }

            if (this.elements.modalViews) {
                this.elements.modalViews.textContent = (resource.views || 0);
            }

            if (this.elements.modalFavorites) {
                this.elements.modalFavorites.textContent = (resource.favorites || 0);
            }

            if (this.elements.modalFavoriteBtn) {
                this.elements.modalFavoriteBtn.dataset.id = id;
                this.elements.modalFavoriteBtn.innerHTML = 
                    '<i class="fas fa-heart"></i> ' +
                    (isFavorite ? 'Remove from Favorites' : 'Add to Favorites');
                this.elements.modalFavoriteBtn.classList.toggle('active', isFavorite);
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        _closeResourceModal: function() {
            var modal = this.elements.resourceModal;
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        _openAddResourceModal: function() {
            var modal = this.elements.addResourceModal;
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                if (this.elements.addResourceForm) {
                    this.elements.addResourceForm.reset();
                }
                document.getElementById('addModalTitle').textContent = 'Add Resource';
            }
        },

        _closeAddResourceModal: function() {
            var modal = this.elements.addResourceModal;
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        _handleAddResource: function(e) {
            e.preventDefault();

            var title = document.getElementById('resourceTitle')?.value?.trim();
            var category = document.getElementById('resourceCategory')?.value;
            var content = document.getElementById('resourceContent')?.value?.trim();
            var description = document.getElementById('resourceDescription')?.value?.trim();
            var author = document.getElementById('resourceAuthor')?.value?.trim();
            var tags = document.getElementById('resourceTags')?.value?.trim();

            if (!title || !category || !content) {
                ToastManager.error('Please fill in all required fields.');
                return;
            }

            var tagArray = tags ? tags.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; }) : [];

            var resource = ResourceManager.add({
                title: title,
                description: description || '',
                content: content,
                category: category,
                author: author || 'Anonymous',
                tags: tagArray
            });

            this._closeAddResourceModal();
            this._updateCategoryCounts();
            this._loadResources();
            ToastManager.success('Resource "' + resource.title + '" added successfully!');
        },

        _performSearch: function() {
            var query = this.elements.searchInput ? this.elements.searchInput.value.trim() : '';
            this.currentSearch = query;
            this.currentPage = 1;
            
            // Reset category selection
            document.querySelectorAll('.category-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            // Activate "All" category
            var allBtn = document.querySelector('.category-btn[data-category="all"]');
            if (allBtn) allBtn.classList.add('active');
            this.currentCategory = 'all';
            
            this._loadResources();
        },

        _setupSidebar: function() {
            var sidebar = this.elements.sidebar;
            var overlay = this.elements.sidebarOverlay;
            var mobileMenuBtn = this.elements.mobileMenuBtn;

            if (!sidebar) return;

            var self = this;

            mobileMenuBtn?.addEventListener('click', function(e) {
                e.stopPropagation();
                self._toggleMobileSidebar();
            });

            overlay?.addEventListener('click', function() {
                self._closeMobileSidebar();
            });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
                    self._closeMobileSidebar();
                }
            });

            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    self._closeMobileSidebar();
                }
            });

            sidebar.querySelectorAll('.sidebar-nav a').forEach(function(link) {
                link.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                        self._closeMobileSidebar();
                    }
                });
            });
        },

        _toggleMobileSidebar: function() {
            var sidebar = this.elements.sidebar;
            if (!sidebar) return;

            if (sidebar.classList.contains('mobile-open')) {
                this._closeMobileSidebar();
            } else {
                this._openMobileSidebar();
            }
        },

        _openMobileSidebar: function() {
            var sidebar = this.elements.sidebar;
            var overlay = this.elements.sidebarOverlay;
            var mobileMenuBtn = this.elements.mobileMenuBtn;

            if (!sidebar) return;
            sidebar.classList.add('mobile-open');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            if (mobileMenuBtn) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
                mobileMenuBtn.setAttribute('aria-label', 'Close menu');
            }
        },

        _closeMobileSidebar: function() {
            var sidebar = this.elements.sidebar;
            var overlay = this.elements.sidebarOverlay;
            var mobileMenuBtn = this.elements.mobileMenuBtn;

            if (!sidebar) return;
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';

            if (mobileMenuBtn) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                mobileMenuBtn.setAttribute('aria-label', 'Open menu');
            }
        },

        _setupLogout: function() {
            var btn = this.elements.logoutBtn;
            if (!btn) return;

            btn.addEventListener('click', function() {
                if (!confirm('Are you sure you want to logout?')) return;
                StorageManager.remove(CONFIG.STORAGE_KEYS.USER);
                window.location.href = 'login.html';
            });
        },

        _bindEvents: function() {
            var self = this;

            // Category filter
            if (this.elements.categoryFilter) {
                this.elements.categoryFilter.addEventListener('click', function(e) {
                    var btn = e.target.closest('.category-btn');
                    if (!btn) return;
                    
                    var category = btn.dataset.category;
                    self.currentCategory = category;
                    self.currentPage = 1;
                    self.currentSearch = '';
                    
                    document.querySelectorAll('.category-btn').forEach(function(b) {
                        b.classList.remove('active');
                    });
                    btn.classList.add('active');
                    
                    if (self.elements.searchInput) {
                        self.elements.searchInput.value = '';
                    }
                    
                    self._loadResources();
                });
            }

            // Sort select
            if (this.elements.sortSelect) {
                this.elements.sortSelect.addEventListener('change', function() {
                    self.currentSort = this.value;
                    self.currentPage = 1;
                    self._loadResources();
                });
            }

            // Search
            if (this.elements.searchInput) {
                this.elements.searchInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        self._performSearch();
                    }
                });
            }

            if (this.elements.searchBtn) {
                this.elements.searchBtn.addEventListener('click', function() {
                    self._performSearch();
                });
            }

            if (this.elements.clearSearchBtn) {
                this.elements.clearSearchBtn.addEventListener('click', function() {
                    if (self.elements.searchInput) {
                        self.elements.searchInput.value = '';
                    }
                    self.currentSearch = '';
                    self.currentPage = 1;
                    self._loadResources();
                });
            }

            // Favorite filter
            if (this.elements.favoriteFilter) {
                this.elements.favoriteFilter.addEventListener('click', function() {
                    if (self.currentCategory === 'favorites') {
                        self.currentCategory = 'all';
                        document.querySelectorAll('.category-btn').forEach(function(b) {
                            b.classList.remove('active');
                            if (b.dataset.category === 'all') {
                                b.classList.add('active');
                            }
                        });
                    } else {
                        self.currentCategory = 'favorites';
                        document.querySelectorAll('.category-btn').forEach(function(b) {
                            b.classList.remove('active');
                        });
                    }
                    self.currentPage = 1;
                    self.currentSearch = '';
                    if (self.elements.searchInput) {
                        self.elements.searchInput.value = '';
                    }
                    self._loadResources();
                });
            }

            // Add resource
            if (this.elements.addResourceBtn) {
                this.elements.addResourceBtn.addEventListener('click', function() {
                    self._openAddResourceModal();
                });
            }

            if (this.elements.emptyAddBtn) {
                this.elements.emptyAddBtn.addEventListener('click', function() {
                    self._openAddResourceModal();
                });
            }

            // Close modal buttons
            if (this.elements.closeModalBtn) {
                this.elements.closeModalBtn.addEventListener('click', function() {
                    self._closeResourceModal();
                });
            }

            if (this.elements.closeModalFooterBtn) {
                this.elements.closeModalFooterBtn.addEventListener('click', function() {
                    self._closeResourceModal();
                });
            }

            if (this.elements.closeAddModalBtn) {
                this.elements.closeAddModalBtn.addEventListener('click', function() {
                    self._closeAddResourceModal();
                });
            }

            if (this.elements.cancelAddBtn) {
                this.elements.cancelAddBtn.addEventListener('click', function() {
                    self._closeAddResourceModal();
                });
            }

            // Close modals on overlay click
            document.querySelectorAll('.modal').forEach(function(modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        if (this.id === 'resourceModal') {
                            self._closeResourceModal();
                        } else if (this.id === 'addResourceModal') {
                            self._closeAddResourceModal();
                        }
                    }
                });
            });

            // Modal favorite button
            if (this.elements.modalFavoriteBtn) {
                this.elements.modalFavoriteBtn.addEventListener('click', function() {
                    var id = this.dataset.id;
                    if (!id) return;
                    var isFavorite = ResourceManager.toggleFavorite(id);
                    this.classList.toggle('active');
                    this.innerHTML = '<i class="fas fa-heart"></i> ' + 
                        (isFavorite ? 'Remove from Favorites' : 'Add to Favorites');
                    
                    var resource = ResourceManager.getById(id);
                    if (resource && self.elements.modalFavorites) {
                        self.elements.modalFavorites.textContent = (resource.favorites || 0);
                    }
                    
                    var card = document.querySelector('.resource-card[data-id="' + id + '"]');
                    if (card) {
                        var favBtn = card.querySelector('.favorite-btn');
                        if (favBtn) {
                            favBtn.classList.toggle('active');
                        }
                        var stats = card.querySelector('.resource-stats span:last-child');
                        if (stats && resource) {
                            stats.innerHTML = '<i class="fas fa-heart"></i> ' + (resource.favorites || 0);
                        }
                    }
                    
                    ToastManager.success(isFavorite ? 'Added to favorites!' : 'Removed from favorites.');
                    self._updateCategoryCounts();
                    
                    if (self.currentCategory === 'favorites') {
                        self._loadResources();
                    }
                });
            }

            // Add resource form
            if (this.elements.addResourceForm) {
                this.elements.addResourceForm.addEventListener('submit', function(e) {
                    self._handleAddResource(e);
                });
            }

            // Export
            if (this.elements.exportBtn) {
                this.elements.exportBtn.addEventListener('click', function() {
                    var resources = ResourceManager.getAll();
                    if (resources.length === 0) {
                        ToastManager.error('No resources to export.');
                        return;
                    }
                    var dataStr = JSON.stringify(resources, null, 2);
                    var blob = new Blob([dataStr], { type: 'application/json' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'resources_' + new Date().toISOString().slice(0, 10) + '.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    ToastManager.success('Exported ' + resources.length + ' resources!');
                });
            }

            // Notification bell
            if (this.elements.notifBtn) {
                this.elements.notifBtn.addEventListener('click', function() {
                    ToastManager.info('You have ' + ResourceManager.count() + ' resources in your library.');
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (self.elements.resourceModal && self.elements.resourceModal.classList.contains('active')) {
                        self._closeResourceModal();
                    }
                    if (self.elements.addResourceModal && self.elements.addResourceModal.classList.contains('active')) {
                        self._closeAddResourceModal();
                    }
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    if (self.elements.searchInput) {
                        self.elements.searchInput.focus();
                    }
                }
            });
        }
    };

    // ============================================================
    // INITIALIZATION
    // ============================================================

    document.addEventListener('DOMContentLoaded', function() {
        ResourceLibraryUI.init();
    });

})();