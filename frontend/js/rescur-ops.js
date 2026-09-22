// ===== APPOINTMENTS PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
  // Sample appointments data
  const sampleAppointments = [];

  const emptyState = document.querySelector('.empty-state-container');
  const appointmentsList = document.getElementById('appointmentsList');

  if (sampleAppointments.length === 0) {
    emptyState.style.display = 'block';
    appointmentsList.style.display = 'none';
  }

  // Book appointment buttons
  document.getElementById('bookAppointmentBtn')?.addEventListener('click', function() {
    showToast('Book appointment feature coming soon');
  });

  document.getElementById('emptyBookBtn')?.addEventListener('click', function() {
    showToast('Book appointment feature coming soon');
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const filter = this.dataset.filter;
      showToast(`Filtering by: ${filter}`);
    });
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