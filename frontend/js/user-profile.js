// ===== USER PROFILE PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
  // Load user data from localStorage
  function loadUserData() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const displayName = user.name || user.fullName || 'New User';
        
        document.getElementById('profileDisplayName').textContent = displayName;
        document.getElementById('profileDisplayEmail').textContent = user.email || 'user@email.com';
        document.getElementById('fullName').value = displayName;
        document.getElementById('email').value = user.email || '';
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    }
  }
  
  loadUserData();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const tabId = this.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });

  // Save Profile
  document.getElementById('saveProfileBtn')?.addEventListener('click', function() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    
    // Update localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        user.name = fullName;
        user.email = email;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update UI
        document.getElementById('profileDisplayName').textContent = fullName;
        document.getElementById('profileDisplayEmail').textContent = email;
        
        showToast('✅ Profile updated successfully!');
      } catch (e) {
        console.error('Error saving user data:', e);
        showToast('❌ Error saving profile');
      }
    } else {
      showToast('❌ No user data found');
    }
  });

  // Cancel / Reset
  document.getElementById('cancelBtn')?.addEventListener('click', function() {
    loadUserData();
    showToast('↩️ Changes reverted');
  });

  // Change Avatar
  document.getElementById('changeAvatarBtn')?.addEventListener('click', function() {
    showToast('📸 Change avatar feature coming soon!');
  });

  // Update Password
  document.getElementById('updatePasswordBtn')?.addEventListener('click', function() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (!current || !newPass || !confirm) {
      showToast('⚠️ Please fill in all password fields');
      return;
    }
    
    if (newPass !== confirm) {
      showToast('⚠️ Passwords do not match');
      return;
    }
    
    if (newPass.length < 8) {
      showToast('⚠️ Password must be at least 8 characters');
      return;
    }
    
    showToast('🔑 Password updated successfully!');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  });

  // Delete Account
  document.getElementById('deleteAccountBtn')?.addEventListener('click', function() {
    if (confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!')) {
      if (confirm('⚠️ All your data will be permanently removed. Are you absolutely sure?')) {
        showToast('🗑️ Account deletion requested. You will be redirected...');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'login.html';
        }, 2000);
      }
    }
  });

  // Dark Mode Toggle (preview)
  document.getElementById('darkModeToggle')?.addEventListener('change', function() {
    if (this.checked) {
      document.body.style.background = '#121a1a';
      document.body.style.color = '#d4e0d4';
      showToast('🌙 Dark mode enabled (preview)');
    } else {
      document.body.style.background = '';
      document.body.style.color = '';
      showToast('☀️ Light mode enabled');
    }
  });

  // Toast notification
  function showToast(message) {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `
      <i class="fas fa-info-circle"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});