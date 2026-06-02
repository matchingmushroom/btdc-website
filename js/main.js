const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec',
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID'
};

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initContactForm();
  initValuationForm();
  initScrollAnimations();
});

function initHamburger() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('header') && nav.classList.contains('open')) {
        nav.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const formData = new FormData(form);
    formData.append('action', 'contact');

    try {
      const res = await fetch(CONFIG.API_URL, { method: 'POST', body: new URLSearchParams(formData) });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Message sent successfully!', 'success');
        form.reset();
      } else {
        showToast(data.message || 'Failed to send message.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

function initValuationForm() {
  const form = document.getElementById('valuationForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn');
    const originalText = btn.textContent;
    btn.textContent = 'Calculating...';
    btn.disabled = true;

    const formData = new FormData(form);
    formData.append('action', 'valuation');

    try {
      const res = await fetch(CONFIG.API_URL, { method: 'POST', body: new URLSearchParams(formData) });
      const data = await res.json();
      if (data.success && data.estimate) {
        displayValuationResult(data);
      } else {
        showToast(data.message || 'Failed to get valuation.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

function displayValuationResult(data) {
  const resultDiv = document.getElementById('valuationResult');
  if (!resultDiv) return;
  const low = Number(data.estimate.low).toLocaleString('en-IN');
  const high = Number(data.estimate.high).toLocaleString('en-IN');
  resultDiv.innerHTML = `
    <div class="amount">NPR ${low} - ${high}</div>
    <div class="range">Estimated Value Range</div>
    <div class="disclaimer">Based on ${data.propertyType} property in ${data.location} area (${data.landArea} sqft land, ${data.builtUpArea} sqft built-up, ${data.condition} condition). This is a preliminary estimate. Contact us for a professional valuation.</div>
  `;
  resultDiv.style.animation = 'fadeIn 0.5s ease';
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', padding: '16px 28px',
    borderRadius: '8px', color: '#fff', fontSize: '0.95rem', zIndex: '9999',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
    maxWidth: '400px'
  });
  toast.style.background = type === 'success' ? '#28a745' : '#dc3545';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function initScrollAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .fade-in.visible { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.service-card, .mv-card, .team-card, .section-title, .service-detail-card').forEach(el => {
    el.classList.add('fade-in'); observer.observe(el);
  });
}

function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}
