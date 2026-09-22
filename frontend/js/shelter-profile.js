// ===== PROVIDER PROFILE PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
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

  // Browse Providers button
  document.getElementById('browseProvidersBtn')?.addEventListener('click', function() {
    window.location.href = 'providers.html';
  });

  // Book Appointment
  document.getElementById('bookWithProviderBtn')?.addEventListener('click', function() {
    showToast('📅 Book appointment with this provider - coming soon!');
  });

  // Contact Provider
  document.getElementById('contactProviderBtn')?.addEventListener('click', function() {
    showToast('📞 Connecting you with Happy Paws Veterinary Clinic...');
  });

  // Get Directions
  document.getElementById('getDirectionsBtn')?.addEventListener('click', function() {
    showToast('🗺️ Opening directions in Google Maps...');
  });

  // Write Review
  document.getElementById('writeReviewBtn')?.addEventListener('click', function() {
    showToast('✍️ Write a review - coming soon!');
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