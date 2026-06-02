function trackValuation() {
  const q = document.getElementById('trackQuery').value.trim();
  const resultsDiv = document.getElementById('trackResults');
  const errorDiv = document.getElementById('trackError');
  const loadingDiv = document.getElementById('trackLoading');
  const btn = document.getElementById('trackBtn');

  if (!q) {
    errorDiv.textContent = 'Please enter a name, reference number, or valuation ID.';
    errorDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    return;
  }

  errorDiv.style.display = 'none';
  resultsDiv.style.display = 'none';
  loadingDiv.style.display = 'block';
  btn.disabled = true;
  btn.textContent = 'Searching...';

  fetch(`${CONFIG.API_URL}?action=getValuation&q=${encodeURIComponent(q)}`)
    .then(r => r.json())
    .then(data => {
      loadingDiv.style.display = 'none';
      btn.disabled = false;
      btn.textContent = 'Search';

      if (data.error) {
        errorDiv.textContent = data.error;
        errorDiv.style.display = 'block';
        return;
      }

      const vals = data.valuations || [];
      if (!vals.length) {
        resultsDiv.innerHTML = `
          <div style="text-align:center;padding:40px;background:var(--white);border-radius:8px;box-shadow:var(--shadow);">
            <div style="font-size:3rem;margin-bottom:16px;opacity:0.3;">&#x1F50D;</div>
            <h3 style="color:var(--primary);margin-bottom:8px;">No Records Found</h3>
            <p style="color:var(--text-light);">We couldn't find any valuation matching "${esc(q)}". If you believe this is an error, please contact us.</p>
          </div>
        `;
        resultsDiv.style.display = 'block';
        return;
      }

      resultsDiv.innerHTML = `
        <p style="margin-bottom:16px;color:var(--text-light);">Found <strong>${vals.length}</strong> record${vals.length > 1 ? 's' : ''}:</p>
        ${vals.map(r => {
          const statusClass = (r.Status || '').toLowerCase().replace(/\s+/g, '-');
          return `
            <div class="track-card">
              <div class="track-card-header">
                <span class="status-badge status-${esc(statusClass)}">${esc(r.Status)}</span>
                <span style="font-size:0.85rem;color:var(--text-light);">ID: ${esc(r.ValuationID)}</span>
              </div>
              <div class="track-card-body">
                <div class="track-field"><strong>Customer:</strong> ${esc(r.CustomerName)}</div>
                <div class="track-field"><strong>Ref Number:</strong> ${esc(r.RefNumber)}</div>
                <div class="track-field"><strong>Property:</strong> ${esc(r.PropertyAddress)}</div>
                <div class="track-field"><strong>Type:</strong> ${esc(r.ValuationType)}</div>
                <div class="track-field"><strong>Date:</strong> ${esc(r.ValuationDate)}</div>
                ${r.ValuationAmount ? `<div class="track-field"><strong>Amount:</strong> NPR ${Number(r.ValuationAmount).toLocaleString('en-IN')}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      `;
      resultsDiv.style.display = 'block';
    })
    .catch(err => {
      loadingDiv.style.display = 'none';
      btn.disabled = false;
      btn.textContent = 'Search';
      errorDiv.textContent = 'Connection error. Please try again later.';
      errorDiv.style.display = 'block';
    });
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

document.addEventListener('DOMContentLoaded', function() {
  initHamburger();
  setActiveNav();
  document.getElementById('trackQuery').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') trackValuation();
  });
});
