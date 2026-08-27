// ===== REVIEWS PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
  // Write review buttons
  document.getElementById('writeReviewBtn')?.addEventListener('click', function() {
    showToast('Write review feature coming soon');
  });

  document.getElementById('emptyWriteReviewBtn')?.addEventListener('click', function() {
    showToast('Write review feature coming soon');
  });

  // Helpful buttons
  document.querySelectorAll('.btn-helpful').forEach(btn => {
    btn.addEventListener('click', function() {
      const count = this.querySelector('.count');
      if (count) {
        const current = parseInt(count.textContent) || 0;
        count.textContent = current + 1;
        showToast('Thank you for your feedback!');
      }
    });
  });

  // Report buttons
  document.querySelectorAll('.btn-report').forEach(btn => {
    btn.addEventListener('click', function() {
      showToast('Report submitted. We\'ll review it shortly.');
    });
  });

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