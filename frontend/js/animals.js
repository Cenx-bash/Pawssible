// ========================================
// PETCARECONNECT - PET MANAGEMENT
// ========================================

(function () {

    "use strict";

    // ========================================
    // STORAGE
    // ========================================

    const STORAGE_KEY = "petcare_pets";


    // ========================================
    // ELEMENTS
    // ========================================

    const petGrid = document.getElementById("petsGrid");
    const emptyState = document.getElementById("emptyState");
    const noResults = document.getElementById("noResults");

    const addPetBtn = document.getElementById("addPetBtn");
    const addFirstPetBtn = document.getElementById("addFirstPetBtn");

    const petModal = document.getElementById("petModal");
    const closePetModal = document.getElementById("closePetModal");
    const cancelPetBtn = document.getElementById("cancelPetBtn");

    const petForm = document.getElementById("petForm");
    const petModalTitle = document.getElementById("petModalTitle");

    const petFormMessage = document.getElementById("petFormMessage");

    const petPhoto = document.getElementById("petPhoto");
    const photoPreview = document.getElementById("photoPreview");
    const photoPreviewImage = document.getElementById("photoPreviewImage");

    const petName = document.getElementById("petName");
    const petSpecies = document.getElementById("petSpecies");
    const petBreed = document.getElementById("petBreed");
    const petSex = document.getElementById("petSex");
    const petBirthDate = document.getElementById("petBirthDate");
    const petColor = document.getElementById("petColor");
    const petNotes = document.getElementById("petNotes");

    const searchInput = document.getElementById("petSearch");
    const searchButton = document.getElementById("searchPetBtn");

    const viewPetModal = document.getElementById("viewPetModal");
    const closeViewPetModal = document.getElementById("closeViewPetModal");
    const closeViewPetBtn = document.getElementById("closeViewPetBtn");

    const viewPetName = document.getElementById("viewPetName");
    const viewPetSubtitle = document.getElementById("viewPetSubtitle");
    const viewPetContent = document.getElementById("viewPetContent");


    // ========================================
    // STATE
    // ========================================

    let editingPetId = null;
    let currentPhoto = "";


    // ========================================
    // GET CURRENT USER
    // ========================================

    function getCurrentUser() {

        try {

            const userData = localStorage.getItem("user");

            if (!userData) {
                return null;
            }

            return JSON.parse(userData);

        } catch (error) {

            console.error(
                "Unable to read user data:",
                error
            );

            return null;
        }
    }


    // ========================================
    // GET USER IDENTIFIER
    // ========================================

    function getUserIdentifier() {

        const user = getCurrentUser();

        if (!user) {
            return "guest";
        }

        return String(
            user.id ||
            user.user_id ||
            user.email ||
            user.name ||
            "guest"
        ).toLowerCase();
    }


    // ========================================
    // LOAD ALL PETS
    // ========================================

    function getAllPets() {

        try {

            const data =
                localStorage.getItem(STORAGE_KEY);

            if (!data) {
                return [];
            }

            const pets = JSON.parse(data);

            if (!Array.isArray(pets)) {
                return [];
            }

            return pets;

        } catch (error) {

            console.error(
                "Failed to load pets:",
                error
            );

            return [];
        }
    }


    // ========================================
    // SAVE ALL PETS
    // ========================================

    function saveAllPets(pets) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(pets)
            );

            return true;

        } catch (error) {

            console.error(
                "Failed to save pets:",
                error
            );

            if (
                error.name === "QuotaExceededError"
            ) {

                showFormMessage(
                    "The photo is too large. Please use a smaller image.",
                    "error"
                );

            }

            return false;
        }
    }


    // ========================================
    // GET PETS FOR CURRENT USER
    // ========================================

    function getUserPets() {

        const userId =
            getUserIdentifier();

        return getAllPets().filter(
            pet => pet.ownerId === userId
        );
    }


    // ========================================
    // CREATE UNIQUE ID
    // ========================================

    function createPetId() {

        return (
            "pet_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }


    // ========================================
    // ESCAPE HTML
    // ========================================

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ========================================
    // OPEN ADD PET MODAL
    // ========================================

    function openAddPetModal() {

        editingPetId = null;
        currentPhoto = "";

        petModalTitle.textContent =
            "Add New Pet";

        petForm.reset();

        photoPreview.classList.remove("active");
        photoPreviewImage.src = "";

        hideFormMessage();

        petModal.classList.add("active");

        document.body.style.overflow = "hidden";

        setTimeout(() => {
            petName.focus();
        }, 100);
    }


    // ========================================
    // CLOSE ADD/EDIT MODAL
    // ========================================

    function closePetModalFunction() {

        petModal.classList.remove("active");

        document.body.style.overflow = "";

        editingPetId = null;
        currentPhoto = "";

        petForm.reset();

        photoPreview.classList.remove("active");
        photoPreviewImage.src = "";

        hideFormMessage();
    }


    // ========================================
    // OPEN EDIT PET
    // ========================================

    function openEditPetModal(id) {

        const pet =
            getUserPets().find(
                item => item.id === id
            );

        if (!pet) {
            return;
        }

        editingPetId = id;

        petModalTitle.textContent =
            "Edit Pet";

        petName.value =
            pet.name || "";

        petSpecies.value =
            pet.species || "";

        petBreed.value =
            pet.breed || "";

        petSex.value =
            pet.sex || "";

        petBirthDate.value =
            pet.birthDate || "";

        petColor.value =
            pet.color || "";

        petNotes.value =
            pet.notes || "";

        currentPhoto =
            pet.photo || "";

        if (currentPhoto) {

            photoPreviewImage.src =
                currentPhoto;

            photoPreview.classList.add(
                "active"
            );

        } else {

            photoPreview.classList.remove(
                "active"
            );
        }

        hideFormMessage();

        petModal.classList.add("active");

        document.body.style.overflow =
            "hidden";
    }


    // ========================================
    // PHOTO VALIDATION
    // ========================================

    function validatePhoto(file) {

        if (!file) {
            return true;
        }

        const allowedTypes = [
            "image/png",
            "image/jpeg"
        ];

        if (!allowedTypes.includes(file.type)) {

            showFormMessage(
                "Invalid photo. Only PNG and JPEG/JPG images are allowed.",
                "error"
            );

            return false;
        }

        // Limit to 5 MB
        const maxSize =
            5 * 1024 * 1024;

        if (file.size > maxSize) {

            showFormMessage(
                "Photo is too large. Maximum size is 5 MB.",
                "error"
            );

            return false;
        }

        return true;
    }


    // ========================================
    // READ PHOTO
    // ========================================

    function readPhoto(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();

                reader.onload = function () {
                    resolve(
                        reader.result
                    );
                };

                reader.onerror = function () {
                    reject(
                        new Error(
                            "Unable to read photo."
                        )
                    );
                };

                reader.readAsDataURL(file);
            }
        );
    }


    // ========================================
    // PHOTO INPUT
    // ========================================

    if (petPhoto) {

        petPhoto.addEventListener(
            "change",
            async function () {

                const file =
                    this.files[0];

                if (!file) {
                    return;
                }

                if (!validatePhoto(file)) {

                    this.value = "";

                    return;
                }

                try {

                    currentPhoto =
                        await readPhoto(file);

                    photoPreviewImage.src =
                        currentPhoto;

                    photoPreview.classList.add(
                        "active"
                    );

                    hideFormMessage();

                } catch (error) {

                    console.error(error);

                    showFormMessage(
                        "Unable to load the selected photo.",
                        "error"
                    );
                }
            }
        );
    }


    // ========================================
    // FORM MESSAGE
    // ========================================

    function showFormMessage(
        message,
        type
    ) {

        if (!petFormMessage) {
            return;
        }

        petFormMessage.textContent =
            message;

        petFormMessage.className =
            "pet-form-message " +
            type;
    }


    function hideFormMessage() {

        if (!petFormMessage) {
            return;
        }

        petFormMessage.textContent = "";

        petFormMessage.className =
            "pet-form-message";
    }


    // ========================================
    // SAVE PET
    // ========================================

    if (petForm) {

        petForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                hideFormMessage();


                const name =
                    petName.value.trim();

                const species =
                    petSpecies.value;

                const breed =
                    petBreed.value.trim();

                const sex =
                    petSex.value;

                const birthDate =
                    petBirthDate.value;

                const color =
                    petColor.value.trim();

                const notes =
                    petNotes.value.trim();


                // ----------------------------
                // VALIDATION
                // ----------------------------

                if (!name) {

                    showFormMessage(
                        "Please enter your pet's name.",
                        "error"
                    );

                    petName.focus();

                    return;
                }


                if (!species) {

                    showFormMessage(
                        "Please select your pet's species.",
                        "error"
                    );

                    petSpecies.focus();

                    return;
                }


                const user =
                    getCurrentUser();

                if (!user) {

                    showFormMessage(
                        "You must be logged in to add a pet.",
                        "error"
                    );

                    return;
                }


                // ----------------------------
                // GET ALL PETS
                // ----------------------------

                const allPets =
                    getAllPets();


                // ----------------------------
                // EDIT
                // ----------------------------

                if (editingPetId) {

                    const index =
                        allPets.findIndex(
                            pet =>
                                pet.id ===
                                editingPetId &&
                                pet.ownerId ===
                                getUserIdentifier()
                        );

                    if (index === -1) {

                        showFormMessage(
                            "Pet could not be found.",
                            "error"
                        );

                        return;
                    }


                    allPets[index] = {

                        ...allPets[index],

                        name,
                        species,
                        breed,
                        sex,
                        birthDate,
                        color,
                        notes,

                        photo:
                            currentPhoto ||
                            allPets[index].photo ||
                            "",

                        updatedAt:
                            new Date().toISOString()
                    };


                    if (
                        !saveAllPets(
                            allPets
                        )
                    ) {
                        return;
                    }


                    showFormMessage(
                        "Pet updated successfully!",
                        "success"
                    );

                }

                // ----------------------------
                // ADD NEW PET
                // ----------------------------

                else {

                    const newPet = {

                        id:
                            createPetId(),

                        ownerId:
                            getUserIdentifier(),

                        name,
                        species,
                        breed,
                        sex,
                        birthDate,
                        color,
                        notes,

                        photo:
                            currentPhoto || "",

                        createdAt:
                            new Date().toISOString(),

                        updatedAt:
                            new Date().toISOString()
                    };


                    allPets.push(newPet);


                    if (
                        !saveAllPets(
                            allPets
                        )
                    ) {
                        return;
                    }


                    showFormMessage(
                        "Pet added successfully!",
                        "success"
                    );
                }


                // ----------------------------
                // REFRESH
                // ----------------------------

                renderPets();

                updateDashboardPetCount();


                // Close after success
                setTimeout(() => {

                    closePetModalFunction();

                }, 700);
            }
        );
    }


    // ========================================
    // RENDER PETS
    // ========================================

    function renderPets(
        searchTerm = ""
    ) {

        if (!petGrid) {
            return;
        }

        const pets =
            getUserPets();

        const search =
            searchTerm
                .trim()
                .toLowerCase();


        const filteredPets =
            pets.filter(pet => {

                if (!search) {
                    return true;
                }

                return (

                    (pet.name || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    (pet.species || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    (pet.breed || "")
                        .toLowerCase()
                        .includes(search)

                    ||

                    (pet.color || "")
                        .toLowerCase()
                        .includes(search)
                );
            });


        petGrid.innerHTML = "";


        // ----------------------------
        // NO PETS
        // ----------------------------

        if (pets.length === 0) {

            emptyState.style.display =
                "block";

            petGrid.style.display =
                "none";

            noResults.style.display =
                "none";

            return;
        }


        // ----------------------------
        // HAS PETS
        // ----------------------------

        emptyState.style.display =
            "none";

        petGrid.style.display =
            "grid";


        // ----------------------------
        // SEARCH NO RESULTS
        // ----------------------------

        if (
            filteredPets.length === 0
        ) {

            petGrid.style.display =
                "none";

            noResults.style.display =
                "block";

            return;
        }


        noResults.style.display =
            "none";


        // ----------------------------
        // CREATE CARDS
        // ----------------------------

        filteredPets.forEach(
            pet => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "pet-card";


                let photoHTML;

                if (pet.photo) {

                    photoHTML = `
                        <img
                            src="${pet.photo}"
                            alt="${escapeHTML(pet.name)}"
                            class="pet-card-photo"
                        >
                    `;

                } else {

                    photoHTML = `
                        <div class="pet-card-photo-placeholder">
                            <i class="fas fa-paw"></i>
                        </div>
                    `;
                }


                const breed =
                    pet.breed
                        ? escapeHTML(
                            pet.breed
                        )
                        : "Breed not specified";


                const sex =
                    pet.sex
                        ? escapeHTML(
                            pet.sex
                        )
                        : "Sex not specified";


                card.innerHTML = `

                    ${photoHTML}

                    <div class="pet-card-content">

                        <h3 class="pet-card-name">
                            ${escapeHTML(pet.name)}
                        </h3>

                        <div class="pet-card-meta">
                            <i class="fas fa-paw"></i>
                            ${escapeHTML(pet.species)}
                        </div>

                        <div class="pet-card-meta">
                            <i class="fas fa-dna"></i>
                            ${breed}
                        </div>

                        <div class="pet-card-meta">
                            <i class="fas fa-venus-mars"></i>
                            ${sex}
                        </div>

                        ${
                            pet.notes
                                ? `
                                    <p class="pet-card-notes">
                                        ${escapeHTML(
                                            pet.notes
                                        )}
                                    </p>
                                  `
                                : ""
                        }

                        <div class="pet-card-actions">

                            <button
                                class="pet-view-btn"
                                data-action="view"
                                data-id="${pet.id}"
                            >
                                <i class="fas fa-eye"></i>
                                View
                            </button>

                            <button
                                class="pet-edit-btn"
                                data-action="edit"
                                data-id="${pet.id}"
                            >
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>

                            <button
                                class="pet-delete-btn"
                                data-action="delete"
                                data-id="${pet.id}"
                            >
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>

                        </div>

                    </div>
                `;


                petGrid.appendChild(card);
            }
        );
    }


    // ========================================
    // PET CARD BUTTONS
    // ========================================

    if (petGrid) {

        petGrid.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "button[data-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.action;

                const id =
                    button.dataset.id;


                if (action === "view") {

                    viewPet(id);

                }


                if (action === "edit") {

                    openEditPetModal(id);

                }


                if (action === "delete") {

                    deletePet(id);

                }

            }
        );
    }


    // ========================================
    // VIEW PET
    // ========================================

    function viewPet(id) {

        const pet =
            getUserPets().find(
                item =>
                    item.id === id
            );

        if (!pet) {
            return;
        }


        viewPetName.textContent =
            pet.name;


        viewPetSubtitle.textContent =
            `${pet.species}${
                pet.breed
                    ? " • " + pet.breed
                    : ""
            }`;


        const photoHTML =
            pet.photo
                ? `
                    <img
                        src="${pet.photo}"
                        alt="${escapeHTML(pet.name)}"
                        style="
                            width:180px;
                            height:180px;
                            object-fit:cover;
                            border-radius:18px;
                            display:block;
                            margin:0 auto 25px;
                        "
                    >
                  `
                : `
                    <div style="
                        width:180px;
                        height:180px;
                        border-radius:18px;
                        background:#eef3f3;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        margin:0 auto 25px;
                        font-size:4rem;
                        color:#7d8e8e;
                    ">
                        <i class="fas fa-paw"></i>
                    </div>
                  `;


        viewPetContent.innerHTML = `

            ${photoHTML}

            <div style="
                display:grid;
                gap:13px;
            ">

                <div>
                    <strong>Pet Name</strong>
                    <p style="margin:4px 0;">
                        ${escapeHTML(pet.name)}
                    </p>
                </div>

                <div>
                    <strong>Species</strong>
                    <p style="margin:4px 0;">
                        ${escapeHTML(pet.species)}
                    </p>
                </div>

                <div>
                    <strong>Breed</strong>
                    <p style="margin:4px 0;">
                        ${escapeHTML(
                            pet.breed ||
                            "Not specified"
                        )}
                    </p>
                </div>

                <div>
                    <strong>Sex</strong>
                    <p style="margin:4px 0;">
                        ${escapeHTML(
                            pet.sex ||
                            "Not specified"
                        )}
                    </p>
                </div>

                <div>
                    <strong>Birth Date</strong>
                    <p style="margin:4px 0;">
                        ${escapeHTML(
                            pet.birthDate ||
                            "Not specified"
                        )}
                    </p>
                </div>

                <div>
                    <strong>Color / Markings</strong>
                    <p style="margin:4px 0;">
                        ${escapeHTML(
                            pet.color ||
                            "Not specified"
                        )}
                    </p>
                </div>

                <div>
                    <strong>Notes</strong>
                    <p style="margin:4px 0;">
                        ${escapeHTML(
                            pet.notes ||
                            "No notes"
                        )}
                    </p>
                </div>

            </div>
        `;


        viewPetModal.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";
    }


    // ========================================
    // CLOSE VIEW PET
    // ========================================

    function closeViewPet() {

        viewPetModal.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";
    }


    // ========================================
    // DELETE PET
    // ========================================

    function deletePet(id) {

        const pets =
            getUserPets();

        const pet =
            pets.find(
                item =>
                    item.id === id
            );

        if (!pet) {
            return;
        }


        const confirmed =
            confirm(
                `Are you sure you want to delete ${pet.name}? This cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        const allPets =
            getAllPets().filter(
                item =>
                    item.id !== id ||
                    item.ownerId !==
                        getUserIdentifier()
            );


        if (
            saveAllPets(
                allPets
            )
        ) {

            renderPets();

            updateDashboardPetCount();

            showToast(
                `${pet.name} was deleted.`
            );
        }
    }


    // ========================================
    // SEARCH
    // ========================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                renderPets(
                    this.value
                );
            }
        );
    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            function () {

                renderPets(
                    searchInput.value
                );

            }
        );
    }


    // ========================================
    // TOP SEARCH BUTTON
    // ========================================

    const topSearchBtn =
        document.getElementById(
            "topSearchBtn"
        );

    if (topSearchBtn) {

        topSearchBtn.addEventListener(
            "click",
            function () {

                if (searchInput) {

                    searchInput.focus();

                    searchInput.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            }
        );
    }


    // ========================================
    // ADD BUTTONS
    // ========================================

    if (addPetBtn) {

        addPetBtn.addEventListener(
            "click",
            openAddPetModal
        );
    }


    if (addFirstPetBtn) {

        addFirstPetBtn.addEventListener(
            "click",
            openAddPetModal
        );
    }


    // ========================================
    // CLOSE MODAL BUTTONS
    // ========================================

    if (closePetModal) {

        closePetModal.addEventListener(
            "click",
            closePetModalFunction
        );
    }


    if (cancelPetBtn) {

        cancelPetBtn.addEventListener(
            "click",
            closePetModalFunction
        );
    }


    if (closeViewPetModal) {

        closeViewPetModal.addEventListener(
            "click",
            closeViewPet
        );
    }


    if (closeViewPetBtn) {

        closeViewPetBtn.addEventListener(
            "click",
            closeViewPet
        );
    }


    // ========================================
    // CLICK OUTSIDE MODALS
    // ========================================

    if (petModal) {

        petModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    petModal
                ) {

                    closePetModalFunction();
                }
            }
        );
    }


    if (viewPetModal) {

        viewPetModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    viewPetModal
                ) {

                    closeViewPet();
                }
            }
        );
    }


    // ========================================
    // ESCAPE KEY
    // ========================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closePetModalFunction();

                closeViewPet();
            }
        }
    );


    // ========================================
    // SIDEBAR
    // ========================================

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );

    const sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );

    const mobileMenuBtn =
        document.getElementById(
            "mobileMenuBtn"
        );


    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "collapsed"
                );
            }
        );
    }


    if (mobileMenuBtn) {

        mobileMenuBtn.addEventListener(
            "click",
            function () {

                sidebar.classList.add(
                    "mobile-open"
                );

                sidebarOverlay.classList.add(
                    "active"
                );

                document.body.style.overflow =
                    "hidden";
            }
        );
    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            function () {

                sidebar.classList.remove(
                    "mobile-open"
                );

                sidebarOverlay.classList.remove(
                    "active"
                );

                document.body.style.overflow =
                    "";
            }
        );
    }


    // ========================================
    // LOGOUT
    // ========================================

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function () {

                if (
                    typeof window.logout ===
                    "function"
                ) {

                    window.logout();

                } else {

                    localStorage.removeItem(
                        "token"
                    );

                    localStorage.removeItem(
                        "user"
                    );

                    window.location.href =
                        "login.html";
                }
            }
        );
    }


    // ========================================
    // UPDATE USER INFO
    // ========================================

    function updateUserInfo() {

        const user =
            getCurrentUser();

        if (!user) {
            return;
        }


        const displayName =
            user.name ||
            user.fullName ||
            `${user.first_name || ""} ${
                user.last_name || ""
            }`.trim() ||
            "User";


        document
            .querySelectorAll(
                ".user-name"
            )
            .forEach(
                element => {

                    element.textContent =
                        displayName;
                }
            );


        document
            .querySelectorAll(
                ".user-email"
            )
            .forEach(
                element => {

                    element.textContent =
                        user.email || "";
                }
            );
    }


    // ========================================
    // DASHBOARD PET COUNT
    // ========================================

    function updateDashboardPetCount() {

        /*
         * This broadcasts an event so the
         * dashboard can update immediately
         * if it is open in the same tab.
         */

        window.dispatchEvent(
            new CustomEvent(
                "petsUpdated",
                {
                    detail: {
                        count:
                            getUserPets()
                                .length
                    }
                }
            )
        );
    }


    // ========================================
    // TOAST
    // ========================================

    function showToast(message) {

        const existing =
            document.querySelector(
                ".pet-toast"
            );

        if (existing) {
            existing.remove();
        }


        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            "pet-toast";


        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${escapeHTML(message)}</span>
        `;


        Object.assign(
            toast.style,
            {
                position: "fixed",
                bottom: "30px",
                left: "50%",
                transform:
                    "translateX(-50%)",
                background: "#243333",
                color: "#fff",
                padding:
                    "13px 20px",
                borderRadius:
                    "12px",
                display: "flex",
                alignItems:
                    "center",
                gap: "9px",
                zIndex: "5000",
                boxShadow:
                    "0 10px 35px rgba(0,0,0,.2)",
                fontFamily:
                    "Inter, sans-serif",
                fontSize:
                    "14px"
            }
        );


        document.body.appendChild(
            toast
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transition =
                    "opacity .3s";

                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            2500
        );
    }


    // ========================================
    // AUTH CHECK
    // ========================================

    function checkAuthentication() {

        const token =
            localStorage.getItem(
                "token"
            );

        const user =
            localStorage.getItem(
                "user"
            );


        if (!token || !user) {

            window.location.href =
                "login.html";

            return false;
        }


        return true;
    }


    // ========================================
    // STORAGE EVENT
    //
    // Allows another browser tab/page
    // to see newly-added pets.
    // ========================================

    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key ===
                STORAGE_KEY
            ) {

                renderPets(
                    searchInput
                        ? searchInput.value
                        : ""
                );

                updateDashboardPetCount();
            }
        }
    );


    // ========================================
    // INITIALIZE
    // ========================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            if (
                !checkAuthentication()
            ) {
                return;
            }


            updateUserInfo();

            renderPets();

            updateDashboardPetCount();

        }
    );


    // ========================================
    // MAKE FUNCTIONS AVAILABLE
    // ========================================

    window.PetCareConnectPets = {

        getPets:
            getUserPets,

        addPet:
            openAddPetModal,

        render:
            renderPets,

        deletePet:
            deletePet

    };

})();



    