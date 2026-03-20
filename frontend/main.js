import './style.css'
import { supabase } from './src/lib/supabase.js'

// --- DOM Elements ---
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const inventoryView = document.getElementById('inventory-view');

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const btnSubmit = document.getElementById('submit-btn');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');
const headerDateSpan = document.getElementById('header-date');

// Dashboard Elements
const setupModal = document.getElementById('setup-modal');
const setupForm = document.getElementById('setup-form');
const profileNameInput = document.getElementById('profile-name');
const profileWhatsappInput = document.getElementById('profile-whatsapp');
const auditsContainer = document.getElementById('audits-container');
const auditsEmpty = document.getElementById('audits-empty');
const btnNewAudit = document.getElementById('btn-new-audit');
const newAuditModal = document.getElementById('new-audit-modal');
const closeAuditModal = document.getElementById('close-audit-modal');
const newAuditForm = document.getElementById('new-audit-form');
const auditTitleInput = document.getElementById('audit-title');
const auditSegmentSelect = document.getElementById('audit-segment');

// Inventory Elements
const backToDashboardBtn = document.getElementById('back-to-dashboard');
const auditNameDisplay = document.getElementById('audit-name-display');
const btnNewProcess = document.getElementById('btn-new-process');
const processesContainer = document.getElementById('processes-container');
const processesEmpty = document.getElementById('processes-empty');
const newProcessModal = document.getElementById('new-process-modal');
const closeProcessModal = document.getElementById('close-process-modal');
const newProcessForm = document.getElementById('new-process-form');
const processNameInput = document.getElementById('process-name');
const legalBasisSelect = document.getElementById('legal-basis');
const hasMinorDataCheck = document.getElementById('has-minor-data');
const hasSensitiveDataCheck = document.getElementById('has-sensitive-data');
const minorDataAlert = document.getElementById('minor-data-alert');
const processDescInput = document.getElementById('process-desc');

// Global State
let currentUser = null;
let currentProfile = null;
let currentAudit = null;

// --- Utils ---
function setHeaderDate() {
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  headerDateSpan.textContent = formatter.format(new Date());
}

profileWhatsappInput.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, "($1)$2");
  if (v.length > 8) v = v.replace(/(\d{5})(\d)/, "$1-$2");
  else if (v.length > 7 && v.length <= 8) v = v.replace(/(\d{4})(\d)/, "$1-$2");
  e.target.value = v;
});

// --- UI State ---
function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  inventoryView.classList.add('hidden');
  setupModal.classList.add('hidden');
  newAuditModal.classList.add('hidden');
  document.body.classList.replace('items-stretch', 'items-center');
}

async function showDashboard(user) {
  currentUser = user;
  loginView.classList.add('hidden');
  inventoryView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  document.body.classList.replace('items-center', 'items-stretch');
  
  setHeaderDate();
  await loadSegments();
  await checkProfile();
}

async function showInventory(audit) {
  currentAudit = audit;
  dashboardView.classList.add('hidden');
  inventoryView.classList.remove('hidden');
  
  auditNameDisplay.textContent = `${audit.title} (${audit.segments?.name || 'Geral'})`;
  await loadProcesses();
}

// --- App Logic ---
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showDashboard(session.user);
  } else {
    showLogin();
  }
}

async function loadSegments() {
  const { data, error } = await supabase.from('segments').select('*');
  if (!error && data) {
    auditSegmentSelect.innerHTML = '<option value="" disabled selected>Selecione uma opção...</option>';
    data.forEach(seg => {
      const opt = document.createElement('option');
      opt.value = seg.id;
      opt.textContent = seg.name;
      auditSegmentSelect.appendChild(opt);
    });
  }
}

async function checkProfile() {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error || !profile) {
    setupModal.classList.remove('hidden');
    userNameSpan.textContent = currentUser.email;
  } else {
    currentProfile = profile;
    userNameSpan.textContent = profile.full_name || currentUser.email;
    loadAudits();
  }
}

async function loadAudits() {
  auditsContainer.innerHTML = '';
  auditsEmpty.classList.add('hidden');

  const { data: audits, error } = await supabase
    .from('audits')
    .select('*, segments(name)')
    .eq('tenant_id', currentProfile.tenant_id)
    .order('created_at', { ascending: false });

  if (error || !audits || audits.length === 0) {
    auditsEmpty.classList.remove('hidden');
    return;
  }

  audits.forEach(audit => {
    const card = document.createElement('div');
    card.className = 'bg-surface p-6 rounded-xl border border-secondary shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <h4 class="font-bold text-lg text-dark mb-1">${audit.title}</h4>
        <div class="inline-block bg-primary-light text-dark px-2 py-1 rounded text-xs font-semibold mb-4">
          ${audit.segments?.name || 'Geral'}
        </div>
      </div>
      <div class="flex justify-between items-center mt-4 pt-4 border-t border-secondary text-sm">
        <span class="text-secondary font-medium">${new Date(audit.created_at).toLocaleDateString()}</span>
        <span class="text-primary-dark font-bold">${audit.status}</span>
      </div>
    `;
    card.addEventListener('click', () => {
      showInventory(audit);
    });
    auditsContainer.appendChild(card);
  });
}

async function loadProcesses() {
  processesContainer.innerHTML = '';
  processesEmpty.classList.add('hidden');

  const { data: processes, error } = await supabase
    .from('inventories')
    .select('*')
    .eq('audit_id', currentAudit.id)
    .order('created_at', { ascending: false });

  if (error || !processes || processes.length === 0) {
    processesEmpty.classList.remove('hidden');
    return;
  }

  processes.forEach(proc => {
    const card = document.createElement('div');
    card.className = 'bg-surface p-6 rounded-xl border border-secondary shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4';
    card.innerHTML = `
      <div class="flex-1">
        <h4 class="font-bold text-lg text-dark mb-1">${proc.process_name}</h4>
        <p class="text-sm text-secondary mb-2">${proc.description || 'Sem descrição.'}</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <span class="bg-primary/20 text-primary-dark px-2 py-1 rounded text-xs font-semibold">Base: ${proc.legal_basis}</span>
          ${proc.has_minor_data ? '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Menores</span>' : ''}
          ${proc.has_sensitive_data ? '<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Sensível</span>' : ''}
        </div>
      </div>
    `;
    processesContainer.appendChild(card);
  });
}

// --- Event Listeners ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;
  
  authError.classList.add('hidden');
  authSuccess.classList.add('hidden');
  btnSubmit.disabled = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      window.location.reload(); 
    }
  } catch (err) {
    authError.textContent = err.message || 'Erro na autenticação';
    authError.classList.remove('hidden');
  } finally {
    btnSubmit.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

setupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pName = profileNameInput.value;
  const pWhat = profileWhatsappInput.value;
  const btn = document.getElementById('setup-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Configurando...';

  try {
    let { data: tenant } = await supabase.from('tenants').select('*').eq('name', 'DataFacil Compliance').maybeSingle();
    
    if (!tenant) {
      const { data: newTenant, error: tErr } = await supabase.from('tenants').insert({ name: 'DataFacil Compliance' }).select().single();
      if (tErr) throw tErr;
      tenant = newTenant;
    }

    const { error: pErr } = await supabase.from('profiles').insert({
      id: currentUser.id,
      tenant_id: tenant.id,
      full_name: pName,
      whatsapp: pWhat
    });
    if (pErr) throw pErr;

    setupModal.classList.add('hidden');
    await checkProfile();
  } catch(err) {
    alert('Erro ao configurar perfil: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Concluir';
  }
});

btnNewAudit.addEventListener('click', () => {
  newAuditModal.classList.remove('hidden');
});
closeAuditModal.addEventListener('click', () => {
  newAuditModal.classList.add('hidden');
});

newAuditForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('audit-submit-btn');
  btn.disabled = true;
  
  try {
    const { error } = await supabase.from('audits').insert({
      tenant_id: currentProfile.tenant_id,
      title: auditTitleInput.value,
      segment_id: parseInt(auditSegmentSelect.value, 10)
    });
    if (error) throw error;
    
    newAuditModal.classList.add('hidden');
    newAuditForm.reset();
    await loadAudits();
  } catch(err) {
    alert('Erro ao criar auditoria: ' + err.message);
  } finally {
    btn.disabled = false;
  }
});

// Inventory Listeners
backToDashboardBtn.addEventListener('click', () => {
  inventoryView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  currentAudit = null;
});

btnNewProcess.addEventListener('click', () => {
  newProcessModal.classList.remove('hidden');
  // Dynamic business rule: check if sector is "Educação" when checking "minor-data"
  minorDataAlert.classList.add('hidden');
});
closeProcessModal.addEventListener('click', () => {
  newProcessModal.classList.add('hidden');
});

hasMinorDataCheck.addEventListener('change', (e) => {
  if (e.target.checked && currentAudit?.segments?.name === 'Educação') {
    minorDataAlert.classList.remove('hidden');
  } else {
    minorDataAlert.classList.add('hidden');
  }
});

newProcessForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('process-submit-btn');
  btn.disabled = true;
  
  try {
    // Validate Business Rule: Legal Basis MUST be selected (handled by 'required' in HTML, but good to be safe)
    if (!legalBasisSelect.value) {
      throw new Error('Base legal é obrigatória!');
    }

    const { error } = await supabase.from('inventories').insert({
      audit_id: currentAudit.id,
      process_name: processNameInput.value,
      legal_basis: legalBasisSelect.value,
      has_minor_data: hasMinorDataCheck.checked,
      has_sensitive_data: hasSensitiveDataCheck.checked,
      description: processDescInput.value
    });
    if (error) throw error;
    
    newProcessModal.classList.add('hidden');
    newProcessForm.reset();
    minorDataAlert.classList.add('hidden');
    await loadProcesses();
  } catch(err) {
    alert('Erro ao salvar processo: ' + err.message);
  } finally {
    btn.disabled = false;
  }
});

// --- Initialize App ---
checkUser();
