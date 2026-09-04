// ===== PROVIDERS PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
  // Category filtering
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const category = this.textContent.trim();
      if (category !== 'All') {
        showToast(`Showing ${category}`);
      } else {
        showToast('Showing all providers');
      }
    });
  });

  // Search
  document.querySelector('.search-bar button')?.addEventListener('click', function() {
    const query = this.closest('.search-bar').querySelector('input').value;
    if (query) {
      showToast(`Searching for "${query}"...`);
    }
  });

  document.querySelector('.search-bar input')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      this.closest('.search-bar').querySelector('button').click();
    }
  });

  // View Profile buttons
  document.querySelectorAll('.btn-view-profile').forEach(btn => {
    btn.addEventListener('click', function() {
      showToast('Viewing provider profile');
    });
  });

  // Book buttons
  document.querySelectorAll('.btn-book').forEach(btn => {
    btn.addEventListener('click', function() {
      showToast('Book appointment with this provider');
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