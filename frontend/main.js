import './style.css'
import { supabase } from './src/lib/supabase.js'

// --- View Containers ---
const loginView = document.getElementById('login-view');
const setupModal = document.getElementById('setup-modal');
const appContainer = document.getElementById('app-container');
const clientsView = document.getElementById('clients-view');
const clientDetailsView = document.getElementById('client-details-view');
const auditExecView = document.getElementById('audit-exec-view');

// --- Global App State ---
let currentUser = null;
let APP_STATE = {
  currentProfile: null,
  currentClient: null,
  currentAudit: null,
  currentProcess: null,
  segments: []
};

// --- Utils ---
function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('pt-BR');
}

document.getElementById('header-date').textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());

// WhatsApp Mask for Setup
document.getElementById('profile-whatsapp').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, "($1)$2");
  if (v.length > 8) v = v.replace(/(\d{5})(\d)/, "$1-$2");
  else if (v.length > 7 && v.length <= 8) v = v.replace(/(\d{4})(\d)/, "$1-$2");
  e.target.value = v;
});

// --- View Router ---
function switchView(viewElement) {
  loginView.classList.add('hidden');
  appContainer.classList.add('hidden');
  clientsView.classList.add('hidden');
  clientDetailsView.classList.add('hidden');
  auditExecView.classList.add('hidden');

  if (viewElement === loginView) {
    loginView.classList.remove('hidden');
    document.body.classList.replace('items-stretch', 'items-center');
  } else {
    appContainer.classList.remove('hidden');
    appContainer.classList.add('flex');
    viewElement.classList.remove('hidden');
    document.body.classList.replace('items-center', 'items-stretch');
  }
}

// --- Auth & Init ---
async function initApp() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadInitialData();
  } else {
    switchView(loginView);
  }
}

async function loadInitialData() {
  // Load Segments
  const { data: segs } = await supabase.from('segments').select('*');
  APP_STATE.segments = segs || [];
  
  // Populate segments in modal
  const segSelect = document.getElementById('client-segment');
  segSelect.innerHTML = '<option value="" disabled selected>Selecione um segmento...</option>';
  APP_STATE.segments.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    segSelect.appendChild(opt);
  });

  // Check Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  if (!profile) {
    setupModal.classList.remove('hidden');
  } else {
    APP_STATE.currentProfile = profile;
    document.getElementById('user-name').textContent = profile.full_name;
    switchView(clientsView);
    await loadClients();
  }
}

// Auth Listeners
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = document.getElementById('submit-btn');
  const errDiv = document.getElementById('auth-error');
  btn.disabled = true; errDiv.classList.add('hidden');
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errDiv.textContent = error.message;
    errDiv.classList.remove('hidden');
    btn.disabled = false;
  } else {
    window.location.reload();
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut(); window.location.reload();
});

document.getElementById('setup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('profile-name').value;
  const what = document.getElementById('profile-whatsapp').value;
  try {
    await supabase.from('profiles').insert({ id: currentUser.id, full_name: name, whatsapp: what });
    setupModal.classList.add('hidden');
    await loadInitialData();
  } catch (err) { alert(err.message); }
});

// --- MODULE 1: Clients ---
async function loadClients() {
  const container = document.getElementById('clients-container');
  const empty = document.getElementById('clients-empty');
  container.innerHTML = '';
  
  const { data: clients } = await supabase.from('clients').select('*, segments(name)').order('created_at', { ascending: false });
  if (!clients || clients.length === 0) {
    empty.classList.remove('hidden'); return;
  }
  empty.classList.add('hidden');
  
  clients.forEach(c => {
    const div = document.createElement('div');
    div.className = 'bg-white p-6 rounded-xl border border-secondary shadow-sm hover:shadow-md transition cursor-pointer';
    div.innerHTML = `
      <h3 class="text-xl font-bold text-dark mb-1">${c.name}</h3>
      <span class="inline-block bg-primary/20 text-primary-dark font-bold text-xs px-2 py-1 rounded">${c.segments?.name || 'Geral'}</span>
      <p class="text-xs text-secondary mt-4">Criado em: ${formatDate(c.created_at)}</p>
    `;
    div.addEventListener('click', () => openClientDetails(c));
    container.appendChild(div);
  });
}

document.getElementById('btn-new-client').onclick = () => document.getElementById('new-client-modal').classList.remove('hidden');
document.getElementById('close-client-modal').onclick = () => document.getElementById('new-client-modal').classList.add('hidden');

document.getElementById('new-client-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('client-name').value;
  const segId = document.getElementById('client-segment').value;
  
  const cnpj = document.getElementById('client-cnpj').value;
  const address = document.getElementById('client-address').value;
  const phone = document.getElementById('client-phone').value;
  const resp = document.getElementById('client-resp').value;
  const dpo = document.getElementById('client-dpo').value;
  
  const btn = document.getElementById('client-submit-btn');
  btn.disabled = true;

  try {
    const { error } = await supabase.from('clients').insert({ 
      name, 
      segment_id: parseInt(segId),
      cnpj: cnpj,
      address: address,
      contact_phone: phone,
      responsible_name: resp,
      dpo_name: dpo
    });
    if (error) throw error;
    document.getElementById('new-client-modal').classList.add('hidden');
    e.target.reset();
    await loadClients();
  } catch(err) {
    alert("Erro ao criar cliente: " + err.message);
  } finally {
    btn.disabled = false;
  }
});

// --- MODULE 2: Client Details & Audits ---
async function openClientDetails(client) {
  APP_STATE.currentClient = client;
  document.getElementById('detail-client-name').textContent = client.name;
  document.getElementById('detail-client-segment').textContent = "Segmento: " + (client.segments?.name || 'Geral');
  
  switchView(clientDetailsView);
  await loadAudits();
}

document.getElementById('back-to-clients').onclick = () => switchView(clientsView);

async function loadAudits() {
  const container = document.getElementById('audits-container');
  const empty = document.getElementById('audits-empty');
  container.innerHTML = '';
  
  const { data: audits } = await supabase.from('audits').select('*').eq('client_id', APP_STATE.currentClient.id).order('created_at', { descending: true });
  if (!audits || audits.length === 0) {
    empty.classList.remove('hidden'); return;
  }
  empty.classList.add('hidden');

  audits.forEach(a => {
    const div = document.createElement('div');
    div.className = 'flex justify-between items-center bg-white p-4 rounded border border-secondary hover:bg-gray-50 cursor-pointer shadow-sm';
    div.innerHTML = `
      <div><h4 class="font-bold text-dark">${a.audit_name}</h4><span class="text-xs text-secondary">${formatDate(a.created_at)}</span></div>
      <button class="bg-primary text-dark font-bold px-4 py-2 rounded text-sm shadow">Executar &rarr;</button>
    `;
    div.addEventListener('click', () => openAuditExecution(a));
    container.appendChild(div);
  });
}

document.getElementById('btn-new-audit').onclick = () => document.getElementById('new-audit-modal').classList.remove('hidden');
document.getElementById('close-audit-modal').onclick = () => document.getElementById('new-audit-modal').classList.add('hidden');

document.getElementById('new-audit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('audit-name').value;
  try {
    const { error } = await supabase.from('audits').insert({ 
      tenant_id: APP_STATE.currentProfile.tenant_id,
      client_id: APP_STATE.currentClient.id, 
      audit_name: name 
    });
    if (error) throw error;
    document.getElementById('new-audit-modal').classList.add('hidden');
    e.target.reset();
    await loadAudits();
  } catch(err) {
    alert("Erro ao criar auditoria: " + err.message);
  }
});


// --- MODULE 3 & 4: Audit Execution (Checklist / ROPA) ---
const tabChecklistBtn = document.getElementById('tab-checklist');
const tabRopaBtn = document.getElementById('tab-ropa');
const contentChecklist = document.getElementById('content-checklist');
const contentRopa = document.getElementById('content-ropa');

function switchAuditTab(tab) {
  if (tab === 'checklist') {
    contentChecklist.classList.replace('hidden', 'block');
    contentRopa.classList.replace('block', 'hidden');
    tabChecklistBtn.className = "px-4 py-2 rounded text-sm font-bold bg-primary text-dark shadow";
    tabRopaBtn.className = "px-4 py-2 rounded text-sm font-bold text-secondary hover:text-white";
  } else {
    contentRopa.classList.replace('hidden', 'block');
    contentChecklist.classList.replace('block', 'hidden');
    tabRopaBtn.className = "px-4 py-2 rounded text-sm font-bold bg-primary text-dark shadow";
    tabChecklistBtn.className = "px-4 py-2 rounded text-sm font-bold text-secondary hover:text-white";
  }
}

tabChecklistBtn.onclick = () => switchAuditTab('checklist');
tabRopaBtn.onclick = () => switchAuditTab('ropa');
document.getElementById('btn-save-checklist').onclick = () => switchAuditTab('ropa');
document.getElementById('back-to-client-details').onclick = () => switchView(clientDetailsView);

async function openAuditExecution(audit) {
  APP_STATE.currentAudit = audit;
  document.getElementById('exec-audit-name').textContent = audit.audit_name;
  document.getElementById('exec-client-info').textContent = `${APP_STATE.currentClient.name} • ${APP_STATE.currentClient.segments?.name || 'Geral'}`;
  
  switchView(auditExecView);
  switchAuditTab('checklist');
  
  await loadChecklistQuestions();
  await loadProcesses();
}

async function loadChecklistQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '<p>Carregando perguntas dinâmicas...</p>';
  
  // Fetch questions (Global AND specific to the client's segment)
  const segmentId = APP_STATE.currentClient.segment_id;
  
  let query = supabase.from('questions').select('*').or(`segment_id.eq.${segmentId},segment_id.is.null`).order('category');
  const { data: questions } = await query;
  
  // Fetch existing answers (if any)
  const { data: answers } = await supabase.from('audit_answers').select('*').eq('audit_id', APP_STATE.currentAudit.id);
  const answersMap = {};
  if (answers) answers.forEach(a => answersMap[a.question_id] = a);

  container.innerHTML = '';
  if (!questions || questions.length === 0) {
    container.innerHTML = '<p class="text-secondary">Nenhuma pergunta encontrada no banco.</p>';
    return;
  }

  // Group by category visually
  let currentCategory = '';
  questions.forEach(q => {
    if (q.category !== currentCategory) {
      currentCategory = q.category;
      const catHeader = document.createElement('h4');
      catHeader.className = 'font-bold text-dark mt-6 mb-2 capitalize text-lg';
      catHeader.textContent = currentCategory;
      container.appendChild(catHeader);
    }
    
    const ans = answersMap[q.id];
    const currentResp = ans?.response || '';
    
    const div = document.createElement('div');
    div.className = 'bg-gray-50 border border-secondary p-4 rounded mb-2 shadow-sm';
    div.innerHTML = `
      <p class="font-bold text-sm text-dark mb-3">${q.segment_id ? '<span class="text-red-600 mr-1" title="Regra Específica do Segmento">★</span>' : ''}${q.question_text}</p>
      <div class="flex flex-wrap gap-4 items-center">
        <label class="flex items-center gap-1 cursor-pointer">
          <input type="radio" name="q_${q.id}" value="Conforme" ${currentResp === 'Conforme' ? 'checked' : ''} class="w-4 h-4 text-green-600 focus:ring-green-500">
          <span class="text-sm font-medium">Conforme</span>
        </label>
        <label class="flex items-center gap-1 cursor-pointer">
          <input type="radio" name="q_${q.id}" value="Não Conforme" ${currentResp === 'Não Conforme' ? 'checked' : ''} class="w-4 h-4 text-red-600 focus:ring-red-500">
          <span class="text-sm font-medium">Não Conforme</span>
        </label>
        <label class="flex items-center gap-1 cursor-pointer">
          <input type="radio" name="q_${q.id}" value="N/A" ${currentResp === 'N/A' ? 'checked' : ''} class="w-4 h-4 text-gray-400 focus:ring-gray-400">
          <span class="text-sm font-medium text-gray-500">N/A</span>
        </label>
        <input type="text" id="note_${q.id}" placeholder="Observações e Evidências..." value="${ans?.notes || ''}" class="flex-grow px-3 py-1 text-sm border border-secondary rounded outline-none focus:border-primary ml-auto max-w-sm">
      </div>
    `;

    // Add onChange listener to auto-save answers
    const saveAnswer = async (e) => {
      const respVal = document.querySelector(`input[name="q_${q.id}"]:checked`)?.value;
      const notesVal = document.getElementById(`note_${q.id}`).value;
      
      if(!respVal && e.target.type !== 'text') return; // Do not save if radio is not checked but note changes early
      
      await supabase.from('audit_answers').upsert({
        audit_id: APP_STATE.currentAudit.id,
        question_id: q.id,
        response: respVal,
        notes: notesVal
      }, { onConflict: 'audit_id, question_id' });
    };

    div.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', saveAnswer));
    div.querySelector('input[type="text"]').addEventListener('blur', saveAnswer);

    container.appendChild(div);
  });
}

// ROPA + Risks (Reused code adapted)
async function loadProcesses() {
  const container = document.getElementById('processes-container');
  container.innerHTML = '';
  document.getElementById('processes-empty').classList.add('hidden');

  const { data: processes } = await supabase.from('inventories').select('*').eq('audit_id', APP_STATE.currentAudit.id).order('created_at', { ascending: false });

  if (!processes || processes.length === 0) {
    document.getElementById('processes-empty').classList.remove('hidden'); return;
  }

  processes.forEach(proc => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-xl border border-secondary shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4';
    card.innerHTML = `
      <div class="flex-1">
        <h4 class="font-bold text-lg text-dark mb-1">${proc.process_name}</h4>
        <div class="flex flex-wrap gap-2 mt-2">
          <span class="bg-primary/20 text-primary-dark px-2 py-1 rounded text-xs font-semibold">Base: ${proc.legal_basis}</span>
          ${proc.has_minor_data ? '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Menores</span>' : ''}
          ${proc.has_sensitive_data ? '<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Sensível</span>' : ''}
        </div>
      </div>
      <div><button class="btn-manage-risks bg-dark text-primary-light text-sm font-bold px-4 py-2 rounded shadow">Riscos / RIPD</button></div>
    `;
    card.querySelector('.btn-manage-risks').addEventListener('click', () => {
      APP_STATE.currentProcess = proc;
      document.getElementById('risk-process-name').textContent = proc.process_name;
      document.getElementById('risks-modal').classList.remove('hidden');
      loadRisks();
    });
    container.appendChild(card);
  });
}

// Modals toggles
document.getElementById('btn-new-process').onclick = () => document.getElementById('new-process-modal').classList.remove('hidden');
document.getElementById('close-process-modal').onclick = () => document.getElementById('new-process-modal').classList.add('hidden');
document.getElementById('close-risks-modal').onclick = () => document.getElementById('risks-modal').classList.add('hidden');

// Submit forms
document.getElementById('new-process-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await supabase.from('inventories').insert({
    audit_id: APP_STATE.currentAudit.id,
    process_name: document.getElementById('process-name').value,
    legal_basis: document.getElementById('legal-basis').value,
    has_minor_data: document.getElementById('has-minor-data').checked,
    has_sensitive_data: document.getElementById('has-sensitive-data').checked,
    description: document.getElementById('process-desc').value
  });
  document.getElementById('new-process-modal').classList.add('hidden');
  e.target.reset();
  await loadProcesses();
});

async function loadRisks() {
  const container = document.getElementById('risks-container');
  container.innerHTML = '';
  const { data: risks } = await supabase.from('risks').select('*').eq('inventory_id', APP_STATE.currentProcess.id);
  
  (risks || []).forEach(risk => {
    const isHigh = risk.risk_level >= 6;
    const badge = isHigh ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800';
    const div = document.createElement('div');
    div.innerHTML = `<div class="bg-gray-50 p-2 border border-secondary text-sm rounded flex justify-between"><b>${risk.description}</b> <span class="${badge} px-1 rounded">Score: ${risk.risk_level}</span></div>`;
    container.appendChild(div);
  });
}

document.getElementById('new-risk-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await supabase.from('risks').insert({
    inventory_id: APP_STATE.currentProcess.id,
    description: document.getElementById('risk-desc').value,
    probability: parseInt(document.getElementById('risk-prob').value),
    impact: parseInt(document.getElementById('risk-impact').value)
  });
  e.target.reset();
  await loadRisks();
});

// Starts App
initApp();
