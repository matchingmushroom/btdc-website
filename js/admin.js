const ADMIN_PASSWORD = sessionStorage.getItem('adminPass') || '';

function adminLogin() {
  const pass = document.getElementById('adminPassword').value;
  const err = document.getElementById('loginError');
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminPass', pass);
    err.style.display = 'none';
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadValuations();
    return;
  }
  fetch(`${CONFIG.API_URL}?action=verifyPassword&password=${encodeURIComponent(pass)}`)
    .then(r => r.json())
    .then(data => {
      if (data.valid) {
        sessionStorage.setItem('adminPass', pass);
        err.style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadValuations();
      } else {
        err.textContent = 'Invalid password';
        err.style.display = 'block';
      }
    })
    .catch(() => {
      err.textContent = 'Connection error. Check your API URL.';
      err.style.display = 'block';
    });
}

function adminLogout() {
  sessionStorage.removeItem('adminPass');
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('adminPassword').value = '';
}

function loadValuations() {
  const pass = sessionStorage.getItem('adminPass');
  document.getElementById('loadingSpinner').style.display = 'block';
  fetch(`${CONFIG.API_URL}?action=getValuations&password=${encodeURIComponent(pass)}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('loadingSpinner').style.display = 'none';
      if (data.valuations) {
        window.valuationsData = data.valuations;
        renderAdminTable();
      }
    })
    .catch(() => {
      document.getElementById('loadingSpinner').style.display = 'none';
      document.getElementById('noRecords').style.display = 'block';
      document.getElementById('noRecords').textContent = 'Failed to load data. Check API connection.';
    });
}

function renderAdminTable() {
  const q = (document.getElementById('adminSearch').value || '').toLowerCase();
  const data = (window.valuationsData || []).filter(r =>
    !q || r.CustomerName.toLowerCase().includes(q) || r.RefNumber.toLowerCase().includes(q) || r.ValuationID.toLowerCase().includes(q) || r.PropertyAddress.toLowerCase().includes(q) || r.Status.toLowerCase().includes(q)
  );
  const tbody = document.getElementById('adminTableBody');
  const noRec = document.getElementById('noRecords');
  if (!data.length) {
    tbody.innerHTML = '';
    noRec.style.display = 'block';
    return;
  }
  noRec.style.display = 'none';
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${esc(r.ValuationID)}</td>
      <td><strong>${esc(r.CustomerName)}</strong></td>
      <td>${esc(r.RefNumber)}</td>
      <td>${esc(r.PropertyAddress)}</td>
      <td>${esc(r.ValuationType)}</td>
      <td>${esc(r.ValuationDate)}</td>
      <td>${r.ValuationAmount ? 'NPR ' + Number(r.ValuationAmount).toLocaleString('en-IN') : '-'}</td>
      <td><span class="status-badge status-${esc(r.Status.toLowerCase().replace(/\s+/g,'-'))}">${esc(r.Status)}</span></td>
      <td class="action-btns">
        <button class="btn-sm btn-edit" onclick="editValuation('${esc(r.ValuationID)}')">Edit</button>
        <button class="btn-sm btn-delete" onclick="deleteValuation('${esc(r.ValuationID)}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function showAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Valuation';
  document.getElementById('saveBtn').textContent = 'Add Valuation';
  document.getElementById('editId').value = '';
  document.getElementById('valuationForm').reset();
  document.getElementById('f_ValuationDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('addModal').style.display = 'flex';
}

function editValuation(id) {
  const rec = (window.valuationsData || []).find(r => r.ValuationID === id);
  if (!rec) return;
  document.getElementById('modalTitle').textContent = 'Edit Valuation #' + id;
  document.getElementById('saveBtn').textContent = 'Update Valuation';
  document.getElementById('editId').value = id;
  document.getElementById('f_CustomerName').value = rec.CustomerName || '';
  document.getElementById('f_RefNumber').value = rec.RefNumber || '';
  document.getElementById('f_PropertyAddress').value = rec.PropertyAddress || '';
  document.getElementById('f_ValuationType').value = rec.ValuationType || 'Residential';
  document.getElementById('f_ValuationDate').value = rec.ValuationDate || '';
  document.getElementById('f_ValuationAmount').value = rec.ValuationAmount || '';
  document.getElementById('f_Status').value = rec.Status || 'Pending';
  document.getElementById('f_InitiatedBy').value = rec.InitiatedBy || '';
  document.getElementById('f_VerifiedBy').value = rec.VerifiedBy || '';
  document.getElementById('addModal').style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function saveValuation(e) {
  e.preventDefault();
  const pass = sessionStorage.getItem('adminPass');
  const editId = document.getElementById('editId').value;
  const params = new URLSearchParams({
    password: pass,
    CustomerName: document.getElementById('f_CustomerName').value,
    RefNumber: document.getElementById('f_RefNumber').value,
    PropertyAddress: document.getElementById('f_PropertyAddress').value,
    ValuationType: document.getElementById('f_ValuationType').value,
    ValuationDate: document.getElementById('f_ValuationDate').value,
    ValuationAmount: document.getElementById('f_ValuationAmount').value,
    Status: document.getElementById('f_Status').value,
    InitiatedBy: document.getElementById('f_InitiatedBy').value,
    VerifiedBy: document.getElementById('f_VerifiedBy').value
  });
  const isEdit = !!editId;
  if (isEdit) {
    params.append('action', 'updateValuation');
    params.append('ValuationID', editId);
  } else {
    params.append('action', 'addValuation');
  }
  const btn = document.getElementById('saveBtn');
  btn.textContent = 'Saving...';
  btn.disabled = true;
  fetch(CONFIG.API_URL, { method: 'POST', body: params })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        closeModal('addModal');
        loadValuations();
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Error saving', 'error');
      }
    })
    .catch(() => showToast('Network error', 'error'))
    .finally(() => { btn.textContent = isEdit ? 'Update Valuation' : 'Add Valuation'; btn.disabled = false; });
}

function deleteValuation(id) {
  if (!confirm('Delete valuation #' + id + '?')) return;
  const pass = sessionStorage.getItem('adminPass');
  fetch(CONFIG.API_URL, {
    method: 'POST',
    body: new URLSearchParams({ action: 'deleteValuation', password: pass, ValuationID: id })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        loadValuations();
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Error deleting', 'error');
      }
    })
    .catch(() => showToast('Network error', 'error'));
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

document.addEventListener('DOMContentLoaded', function() {
  initHamburger();
  setActiveNav();
  initScrollAnimations();
  const pass = sessionStorage.getItem('adminPass');
  if (pass) { document.getElementById('loginScreen').style.display = 'none'; document.getElementById('adminDashboard').style.display = 'block'; loadValuations(); }
});
