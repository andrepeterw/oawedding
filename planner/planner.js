/* ==========================================================================
   Private wedding planner for Kev and Andre. Plain JavaScript, no
   framework. Data lives only in this browser (localStorage), nothing is sent
   anywhere. Seed tasks come from planner/tasks.js (window.SEED_TASKS).

   Future upgrade: to share one live planner between both of you, only load()
   and save() below need to change (for example to read and write a small shared
   store). Every other function reads and writes through them.
   ========================================================================== */
(() => {
'use strict';

/* ---------- constants ---------- */
const STORE_KEY = 'kp-wedding-planner-v1';   // keep: backups from the prototype restore cleanly
const LANG_KEY = 'kev-peter-wedding-lang';   // same key as the public site's language toggle
const PROVISIONAL_DATE = '2027-06-12';
const CATEGORIES = ['Venue','Catering','Attire & beauty','Rings','Photo & video','Music & sound','Decor & flowers','Traditional items','Legal & documents','Travel','Accommodation','Stationery & website','Generator & power','Staff & security','Gifts & favors','Contingency','Other'];
const EXP_STATUS = ['Estimate','Quoted','Deposit paid','Paid in full'];
const RSVP = ['Not sent','Invited','Attending','Maybe','Declined'];
const DIETS = ['No restrictions','Vegetarian','Vegan','Pescatarian','Halal','No pork','Gluten free','Lactose free','Nut allergy','Diabetic friendly','Other (see notes)'];
const COUNTRIES = ['Nigeria','Brazil','USA','Namibia','Other'];
const EVENTS = ['Lagos','Brazil','Both'];
const SIDES = ['Bride','Groom','Both'];
const PRIORITIES = ['Critical','High','Medium'];
// Rates from the couple's budget sheet (Nov 2026): N$1 = R$0.33 = ₦81. Stored as value of 1 unit in USD.
const DEFAULT_RATES = { USD: 1, NAD: 0.055, BRL: 0.055 / 0.33, NGN: 0.055 / 81, EUR: 1.08, GBP: 1.27 };
const STATE_VERSION = 2;
const SYMBOL = { USD: 'US$', BRL: 'R$', NGN: '₦', NAD: 'N$', EUR: '€', GBP: '£' };
const PRIORITY_STYLE = { Critical: 'bg-coral-soft text-coral-deep', High: 'bg-gold-soft text-gold-deep', Medium: 'bg-sage-soft text-sage-deep' };
const STATUS_STYLE = { 'Not Started': 'bg-ivory text-muted border-sand', 'Ongoing': 'bg-sea-soft text-sea-deep border-sea/30', 'Completed': 'bg-sage text-white border-sage' };
const STATUS_CYCLE = ['Not Started','Ongoing','Completed'];
const RSVP_STYLE = { 'Attending': 'text-sea-deep', 'Declined': 'text-coral-deep', 'Maybe': 'text-gold-deep' };

/* ---------- language (English and Portuguese, interface labels only) ---------- */
/* Task text, owners, workstreams and fund labels stay in English on purpose:
   they are your data and match the spreadsheet. Keys below are the English text. */
const PT = {
  // header
  'Private wedding planner': 'Planejador privado do casamento',
  'Backup & data': 'Backup e dados', 'Wedding date': 'Data do casamento', 'Progress': 'Progresso',
  'God at the center': 'Deus no centro', 'date to be set': 'data a definir',
  'days': 'dias', 'hours': 'horas', 'min': 'min', 'sec': 'seg',
  'weeks to go': 'semanas para o grande dia',
  'Provisional: counting to the planning date until you set the real one': 'Provisório: contando até a data de planejamento até você definir a data real',
  'Wedding date saved': 'Data do casamento salva', 'Date cleared': 'Data apagada',
  'done': 'concluídas', 'overdue': 'em atraso', 'critical open': 'críticas em aberto',
  'tasks done': 'tarefas concluídas', 'of': 'de',
  // tabs
  'Planner sections': 'Seções do planejador', 'Checklist': 'Tarefas', 'Budget': 'Orçamento', 'Guests': 'Convidados', 'Documents': 'Documentos',
  // checklist
  'View': 'Visualização', 'Focus': 'Foco', 'Timeline': 'Cronograma', 'By workstream': 'Por frente de trabalho',
  'Search tasks…  (press / )': 'Buscar tarefas…  (tecle / )', 'Search tasks': 'Buscar tarefas',
  '+ Add task': '+ Nova tarefa', 'Workstream': 'Frente de trabalho', 'Owner': 'Responsável', 'Status': 'Status', 'Priority': 'Prioridade',
  'All workstreams': 'Todas as frentes', 'Any owner': 'Qualquer responsável', 'Any status': 'Qualquer status', 'Not completed': 'Não concluídas',
  'Hide completed': 'Ocultar concluídas', 'Clear': 'Limpar',
  'Not Started': 'Não iniciada', 'Ongoing': 'Em andamento', 'Completed': 'Concluída',
  'Critical': 'Crítica', 'High': 'Alta', 'Medium': 'Média',
  'Overdue': 'Em atraso', 'Past the target date and not completed': 'Passou da data prevista e não foi concluída',
  'Next two weeks': 'Próximas duas semanas', 'Due within 14 days': 'Vencem em até 14 dias',
  'Coming up': 'Em breve', 'Due in 15 to 45 days': 'Vencem em 15 a 45 dias',
  'In progress': 'Em andamento', 'Ongoing tasks due later': 'Tarefas em andamento com prazo mais adiante',
  'All clear': 'Tudo em dia', 'Nothing overdue or due in the next 45 days for these filters.': 'Nada em atraso nem com prazo nos próximos 45 dias para estes filtros.',
  'No tasks match these filters.': 'Nenhuma tarefa corresponde a estes filtros.',
  'No date': 'Sem data', 'Done': 'Concluída', 'Due today': 'Vence hoje', 'Due tomorrow': 'Vence amanhã',
  'Key milestone': 'Marco importante', 'Click to change status': 'Clique para mudar o status', 'Mark complete': 'Marcar como concluída',
  'After the wedding': 'Depois do casamento',
  'Deadline': 'Prazo', 'Notes and dependencies': 'Notas e dependências',
  'Who you spoke to, quotes received, next step…': 'Com quem você falou, orçamentos recebidos, próximo passo…',
  'Delete task': 'Excluir tarefa', 'Task deleted': 'Tarefa excluída', 'Saved': 'Salvo',
  'Heads up:': 'Atenção:', 'Show me': 'Mostrar',
  'New task': 'Nova tarefa', 'Task': 'Tarefa', 'Details': 'Detalhes', 'e.g. Book hair trial': 'ex. marcar teste de cabelo',
  'Add task': 'Adicionar tarefa', 'Task added': 'Tarefa adicionada', 'Marked not started': 'Marcada como não iniciada',
  // budget
  'Total funds': 'Total de fundos', 'Planned spend': 'Gasto planejado', 'Paid so far': 'Pago até agora', 'Remaining': 'Restante',
  'Over budget by this amount, time to trim': 'Acima do orçamento por esse valor, hora de cortar', 'Funds minus planned spend': 'Fundos menos o gasto planejado',
  'Budget pots': 'Caixas do orçamento', 'Pot': 'Caixa', 'No pot': 'Sem caixa',
  'Nigeria wedding': 'Casamento na Nigéria', 'Brazil reception': 'Recepção no Brasil', 'Honeymoon': 'Lua de mel',
  'Expenses': 'Despesas', 'Category': 'Categoria', 'All categories': 'Todas as categorias',
  '+ Add expense': '+ Nova despesa', 'Quick add: e.g. Photographer deposit': 'Adição rápida: ex. sinal do fotógrafo',
  'Expense item': 'Item da despesa', 'Amount': 'Valor', 'Currency': 'Moeda', 'Add': 'Adicionar',
  'Item': 'Item', 'Estimate': 'Estimativa', 'Paid': 'Pago', 'Cur.': 'Moeda', 'Next due': 'Próximo vencimento', 'Delete': 'Excluir',
  'No expenses yet. Add your first one above, a venue quote or a deposit is a good start.': 'Ainda não há despesas. Adicione a primeira acima, um orçamento de local ou um sinal é um bom começo.',
  'Vendor / note': 'Fornecedor / nota', 'Expense added': 'Despesa adicionada', 'Expense deleted': 'Despesa excluída',
  'Funds': 'Fundos', '+ Add': '+ Adicionar', 'New source': 'Nova fonte', 'Remove': 'Remover', 'Fund removed': 'Fundo removido',
  'By category': 'Por categoria', 'Categories appear here as you add expenses.': 'As categorias aparecem aqui conforme você adiciona despesas.',
  'paid': 'pago', 'planned': 'planejado',
  'Next payments': 'Próximos pagamentos', 'Unpaid balances with a due date': 'Saldos em aberto com data de vencimento',
  'No upcoming payments with dates.': 'Nenhum pagamento futuro com data.',
  'Currency settings': 'Configuração de moedas', 'edit': 'editar', 'Show totals in': 'Mostrar totais em',
  'Value of 1 unit in USD. Defaults follow your budget sheet (N$1 = R$0.33 = ₦81, Nov 2026). Update them when you pay.': 'Valor de 1 unidade em USD. Os padrões seguem a planilha de orçamento (N$1 = R$0,33 = ₦81, nov 2026). Atualize quando pagar.',
  'New expense': 'Nova despesa', 'Item name': 'Item', 'e.g. Lagos venue hire': 'ex. aluguel do local em Lagos',
  'Vendor or note': 'Fornecedor ou nota', 'Next payment due': 'Próximo pagamento até',
  'Estimate': 'Estimativa',
  'Allocated': 'Alocado', 'not yet allocated': 'ainda não alocado', 'Over allocated by': 'Alocado a mais em',
  'Planned': 'Planejado', 'left': 'restante', 'over': 'acima',
  'source': 'fonte', 'sources': 'fontes', 'of funds allocated': 'dos fundos alocados', 'still to pay': 'ainda a pagar',
  'Total in': 'Total em', 'allocation': 'valor da caixa',
  'Quoted': 'Orçada', 'Deposit paid': 'Sinal pago', 'Paid in full': 'Pago por completo',
  // guests
  'All': 'Todos', "Bride's side": 'Lado da noiva', "Groom's side": 'Lado do noivo',
  'Search guests…': 'Buscar convidados…', 'Search guests': 'Buscar convidados',
  'RSVP': 'RSVP', 'Dietary': 'Alimentação', 'Any RSVP': 'Qualquer RSVP', 'Any diet': 'Qualquer dieta',
  'Paste list': 'Colar lista', 'Guest name': 'Nome do convidado', 'Side': 'Lado', 'From': 'Origem',
  'Name': 'Nome', 'Event': 'Evento', '+1s': '+1', 'Notes': 'Notas',
  'No guests here yet. Add one above, or use “Paste list” to drop in many names at once.': 'Ainda não há convidados aqui. Adicione um acima, ou use “Colar lista” para incluir vários nomes de uma vez.',
  'Total headcount': 'Total de pessoas', 'invitations': 'convites', 'incl. plus ones': 'com acompanhantes',
  'Bride · Groom': 'Noiva · Noivo', 'Attending': 'Confirmado', 'awaiting reply': 'aguardando resposta', 'declined': 'recusaram',
  'Dietary for caterer': 'Alimentação para o buffet', 'No restrictions recorded': 'Nenhuma restrição registrada',
  'Allergy, table, visa…': 'Alergia, mesa, visto…',
  'Paste a guest list': 'Colar uma lista de convidados',
  'One guest per line. Optional extra columns separated by commas or tabs, in this order:': 'Um convidado por linha. Colunas extras opcionais separadas por vírgula ou tab, nesta ordem:',
  'name, side, country, diet, plus ones': 'nome, lado, país, dieta, acompanhantes',
  'A copy from Excel or Google Sheets works.': 'Uma cópia do Excel ou do Google Sheets funciona.',
  'Default side': 'Lado padrão', 'Default country': 'País padrão', 'Add guests': 'Adicionar convidados',
  'Not sent': 'Não enviado', 'Invited': 'Convidado', 'Maybe': 'Talvez', 'Declined': 'Recusou',
  'No restrictions': 'Sem restrições', 'Vegetarian': 'Vegetariano', 'Vegan': 'Vegano', 'Pescatarian': 'Pescetariano', 'Halal': 'Halal',
  'No pork': 'Sem porco', 'Gluten free': 'Sem glúten', 'Lactose free': 'Sem lactose', 'Nut allergy': 'Alergia a nozes',
  'Diabetic friendly': 'Adequado a diabéticos', 'Other (see notes)': 'Outro (ver notas)',
  'Nigeria': 'Nigéria', 'Brazil': 'Brasil', 'USA': 'EUA', 'Namibia': 'Namíbia', 'Other': 'Outro',
  'Both': 'Ambos', 'Bride': 'Noiva', 'Groom': 'Noivo',
  'Venue': 'Local', 'Catering': 'Buffet', 'Attire & beauty': 'Roupas e beleza', 'Rings': 'Alianças', 'Photo & video': 'Foto e vídeo',
  'Music & sound': 'Música e som', 'Decor & flowers': 'Decoração e flores', 'Traditional items': 'Itens tradicionais',
  'Legal & documents': 'Documentos e jurídico', 'Travel': 'Viagens', 'Accommodation': 'Hospedagem', 'Stationery & website': 'Papelaria e site',
  'Generator & power': 'Gerador e energia', 'Staff & security': 'Equipe e segurança', 'Gifts & favors': 'Presentes e lembranças', 'Contingency': 'Contingência',
  // sync
  'Sync': 'Sincronizar', 'Sync between devices': 'Sincronizar entre aparelhos',
  'Sync off': 'Sincronização desligada', 'Synced': 'Sincronizado', 'Syncing…': 'Sincronizando…', 'Offline': 'Sem conexão', 'Not synced': 'Não sincronizado',
  "Right now this planner is saved only in this browser. Turn on sync to share one planner between your devices and Kev's.": 'Por enquanto este planejador fica salvo só neste navegador. Ative a sincronização para compartilhar um único planejador entre os seus aparelhos e os da Kev.',
  'Create a new sync code': 'Criar um novo código de sincronização', 'Or use a code you already have': 'Ou use um código que você já tem',
  'Paste the sync code': 'Cole o código de sincronização', 'Connect': 'Conectar',
  'Sync is on. Changes on any device that uses this code show up on the others within a few seconds.': 'A sincronização está ligada. As mudanças em qualquer aparelho que use este código aparecem nos outros em poucos segundos.',
  'Sync code': 'Código de sincronização', 'Copy invite link': 'Copiar link de convite', 'Copy code': 'Copiar código',
  'Anyone who has this code can see and change the planner. Share it only with Kev.': 'Quem tiver este código pode ver e alterar o planejador. Compartilhe só com a Kev.',
  'Sync now': 'Sincronizar agora', 'Turn off sync on this device': 'Desligar a sincronização neste aparelho', 'Last synced': 'Última sincronização',
  'You are offline. Changes are saved here and will sync when you are back online.': 'Você está sem conexão. As mudanças ficam salvas aqui e serão sincronizadas quando a conexão voltar.',
  'Sync is not set up on the server yet. Follow the setup steps, then try again.': 'A sincronização ainda não foi configurada no servidor. Siga os passos de configuração e tente de novo.',
  'Sync only works on the live website, not on this address.': 'A sincronização só funciona no site publicado, não neste endereço.',
  'Could not reach the sync service. It will try again soon.': 'Não foi possível acessar o serviço de sincronização. Vai tentar de novo em breve.',
  'Open the planner over https to use sync.': 'Abra o planejador por https para usar a sincronização.',
  'The code must be letters and numbers, at least 16 characters.': 'O código deve ter letras e números, com pelo menos 16 caracteres.',
  'This code already has planner data from another device. Load it here? What is on this device now will be replaced.': 'Este código já tem dados do planejador de outro aparelho. Carregar aqui? O que está neste aparelho agora será substituído.',
  'Planner loaded from sync': 'Planejador carregado da sincronização', 'Sync turned off on this device': 'Sincronização desligada neste aparelho',
  'This device already uses a different sync code. Turn that off first.': 'Este aparelho já usa outro código. Desligue-o primeiro.',
  'Sync is on, so this also resets the shared copy.': 'A sincronização está ligada, então isso também apaga a cópia compartilhada.',
  // documents
  'Title': 'Título', 'Link': 'Link', 'Note (optional)': 'Nota (opcional)',
  'Document title': 'Título do documento', 'Link to the document': 'Link do documento',
  'Open': 'Abrir', 'opens in a new tab': 'abre em uma nova aba', 'Check the link': 'Confira o link',
  'Please paste a full link that starts with https': 'Cole um link completo que comece com https',
  'Document added': 'Documento adicionado',
  'Paste the share link of a Google Doc, Sheet or any web page. The people who open it need access in Google as well.': 'Cole o link de compartilhamento de um Google Docs, Planilha ou qualquer página. Quem abrir também precisa ter acesso no Google.',
  'No documents yet. Paste a link above to add your first one.': 'Ainda não há documentos. Cole um link acima para adicionar o primeiro.',
  'Google Doc': 'Google Docs', 'Google Sheet': 'Google Planilhas', 'Google Slides': 'Google Apresentações', 'Google Form': 'Google Formulários',
  // backup panel and shared
  'Backup and data': 'Backup e dados',
  'Everything is saved automatically in this browser only. Make a backup to move your data to another device or share it with Kev.': 'Tudo é salvo automaticamente só neste navegador. Faça um backup para levar seus dados a outro aparelho ou compartilhar com a Kev.',
  'Full backup (JSON)': 'Backup completo (JSON)', 'Tasks as CSV': 'Tarefas em CSV', 'Guests as CSV': 'Convidados em CSV', 'Budget as CSV': 'Orçamento em CSV',
  'Copy': 'Copiar', 'Download file': 'Baixar arquivo', 'Copied': 'Copiado',
  'Selected: press Ctrl or Cmd + C': 'Selecionado: tecle Ctrl ou Cmd + C',
  'If nothing downloaded, use Copy instead': 'Se nada foi baixado, use Copiar',
  'Restore from backup': 'Restaurar de um backup', '…or paste backup JSON here': '…ou cole aqui o JSON do backup', 'Restore': 'Restaurar',
  'Backup restored': 'Backup restaurado', 'That does not look like a planner backup': 'Isso não parece um backup do planejador',
  'Reset everything…': 'Apagar tudo…',
  'Type RESET to wipe guests, expenses and task progress and return to the original spreadsheet.': 'Digite RESET para apagar convidados, despesas e o progresso das tarefas e voltar à planilha original.',
  'Reset': 'Apagar', 'Type RESET to confirm': 'Digite RESET para confirmar', 'Planner reset': 'Planejador reiniciado',
  'Close': 'Fechar', 'Undo': 'Desfazer'
};
const getLang = () => {
  const a = document.documentElement.getAttribute('data-lang');
  if (a === 'pt' || a === 'en') return a;
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'pt' || s === 'en') return s; } catch (e) {}
  return (navigator.language || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
};
const isPT = () => getLang() === 'pt';
const tr = s => (isPT() && PT[s] !== undefined ? PT[s] : s);          // translate by English key
const tx = (en, pt) => (isPT() ? pt : en);                            // translate inline
const plural = (n, en1, enN, pt1, ptN) => tx(n === 1 ? en1 : enN, n === 1 ? pt1 : ptN);
const locale = () => (isPT() ? 'pt-BR' : 'en-GB');

/* ---------- state ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
function freshState() {
  // Amounts are 0 in the website version, restore a JSON backup to load real figures.
  return {
    version: STATE_VERSION,
    weddingDate: PROVISIONAL_DATE,
    tasks: (window.SEED_TASKS || []).map(t => ({ ...t, custom: false })),
    funds: [
      { id: uid(), source: 'Kevwe · rent deposit', amount: 0, currency: 'NAD' },
      { id: uid(), source: 'Kevwe · savings', amount: 0, currency: 'NAD' },
      { id: uid(), source: 'Kevwe · P.F. / credit', amount: 0, currency: 'NAD' },
      { id: uid(), source: 'Kevwe · 13th month', amount: 0, currency: 'NAD' },
      { id: uid(), source: 'Andre · savings', amount: 0, currency: 'NAD' },
      { id: uid(), source: 'Andre · P.F. / credit', amount: 0, currency: 'NAD' }
    ],
    pots: [
      { id: 'ng', name: 'Nigeria wedding', amount: 0, currency: 'NAD' },
      { id: 'br', name: 'Brazil reception', amount: 0, currency: 'NAD' },
      { id: 'hm', name: 'Honeymoon', amount: 0, currency: 'NAD' }
    ],
    expenses: [],
    guests: [],
    docs: [
      { id: 'd1', title: 'Draft Brasil Reception Ceremony', url: 'https://docs.google.com/document/d/1BmVHfKHLijPR0S6_OIG5mO4Lh2UJbJxvhE-AbOhx_ds/edit?usp=sharing', note: '' },
      { id: 'd2', title: 'Draft Church Wedding Ceremony Order', url: 'https://docs.google.com/document/d/16pdQo_XMtGXmQe3tCAhkped5IVY9MqwylllxSLMH4Qs/edit?usp=sharing', note: '' }
    ],
    rates: { ...DEFAULT_RATES },
    baseCurrency: 'NAD',
    ui: { tab: 'checklist', view: 'focus', side: '' }
  };
}
let memoryFallback = null;
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return mergeState(JSON.parse(raw));
  } catch (e) {}
  return memoryFallback || freshState();
}
function mergeState(s) {
  const base = freshState();
  const merged = { ...base, ...s, rates: { ...base.rates, ...(s.rates || {}) }, ui: { ...base.ui, ...(s.ui || {}) } };
  // v2 migration: Lagos wedding on 12 June 2027, budget in N$ with three pots
  if (!s.version || s.version < 2) {
    merged.funds = base.funds; merged.pots = base.pots; merged.rates = { ...base.rates };
    merged.baseCurrency = 'NAD'; if (!s.weddingDate) merged.weddingDate = base.weddingDate;
    merged.version = STATE_VERSION;
  }
  if (!merged.pots) merged.pots = base.pots;
  merged.expenses = (merged.expenses || []).map(x => ({ pot: 'ng', ...x }));
  merged.tasks = merged.tasks || [];
  merged.guests = merged.guests || [];
  // older saved data has no documents yet: start with the seed links once (deleting them later sticks)
  if (!Array.isArray(merged.docs)) merged.docs = base.docs;
  // bring in any seed tasks that are missing (e.g. after a spreadsheet update)
  const have = new Set(merged.tasks.map(t => t.id));
  (window.SEED_TASKS || []).forEach(t => { if (!have.has(t.id)) merged.tasks.push({ ...t, custom: false }); });
  return merged;
}
let S = null;
function persist() {
  memoryFallback = S;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {}
}
function save() { persist(); scheduleSync(); }

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const parseD = s => { if (!s) return null; const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const fmtDate = s => { const d = parseD(s); return d ? d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };
const monthKey = s => s ? s.slice(0, 7) : '9999-99';
const monthLabel = k => { if (k === '9999-99') return tr('No date'); const [y,m] = k.split('-').map(Number); return new Date(y, m-1, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }); };
function relDue(s) {
  const d = parseD(s); if (!d) return { text: tr('No date'), cls: 'text-muted' };
  const n = daysBetween(today(), d);
  if (n < 0) return { text: tx(`${-n} day${n === -1 ? '' : 's'} overdue`, `${-n} dia${n === -1 ? '' : 's'} de atraso`), cls: 'text-coral-deep font-semibold' };
  if (n === 0) return { text: tr('Due today'), cls: 'text-coral-deep font-semibold' };
  if (n === 1) return { text: tr('Due tomorrow'), cls: 'text-gold-deep font-semibold' };
  if (n <= 14) return { text: tx(`In ${n} days`, `Em ${n} dias`), cls: 'text-gold-deep font-semibold' };
  return { text: tx(`In ${n} days`, `Em ${n} dias`), cls: 'text-muted' };
}
const toBase = (amt, cur) => (Number(amt) || 0) * (S.rates[cur] || 0) / (S.rates[S.baseCurrency] || 1);
const money = (v, cur = S.baseCurrency) => {
  const digits = Math.abs(v) >= 1000 || cur === 'NGN' ? 0 : 2;
  const sign = v < 0 ? '\u2212' : '';   // real minus sign, not a hyphen
  return `${sign}${SYMBOL[cur] || cur} ${Math.abs(Number(v)).toLocaleString(isPT() ? 'pt-BR' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits })}`;
};
// <option> list where the stored value stays English and the label is translated
const options = (list, sel) => list.map(o => `<option value="${esc(o)}" ${o === sel ? 'selected' : ''}>${esc(tr(o))}</option>`).join('');
// only plain web links are allowed, so a restored backup can never inject a script link
const safeUrl = u => { try { const x = new URL(String(u || '').trim()); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; } catch (e) { return ''; } };
const docKind = u => {
  try {
    const x = new URL(u);
    if (x.hostname === 'docs.google.com') {
      if (x.pathname.startsWith('/document')) return 'Google Doc';
      if (x.pathname.startsWith('/spreadsheets')) return 'Google Sheet';
      if (x.pathname.startsWith('/presentation')) return 'Google Slides';
      if (x.pathname.startsWith('/forms')) return 'Google Form';
    }
    if (x.hostname === 'drive.google.com') return 'Google Drive';
    return x.hostname.replace(/^www\./, '');
  } catch (e) { return 'Link'; }
};
const isOverdue = t => t.status !== 'Completed' && t.due && parseD(t.due) < today();

/* ---------- static labels ---------- */
function applyI18n() {
  const lang = getLang();
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = tr(el.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', tr(el.dataset.i18nAria)); });
  $$('#fPriority [data-p]').forEach(b => { b.textContent = tr(b.dataset.p); });
}

/* ---------- toast with undo ---------- */
let toastTimer, undoFn = null;
function toast(msg, undo) {
  $('#toastMsg').textContent = msg;
  undoFn = undo || null;
  $('#toastUndo').classList.toggle('hidden', !undo);
  $('#toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), undo ? 6000 : 2600);
}

/* ---------- modal ---------- */
let lastFocus = null;
function openModal(title, html, onMount) {
  lastFocus = document.activeElement;
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#modal').classList.remove('hidden');
  if (onMount) onMount($('#modalBody'));
  const first = $('#modalBody input, #modalBody textarea, #modalBody select');
  if (first) setTimeout(() => first.focus(), 30);
}
function closeModal() {
  $('#modal').classList.add('hidden');
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  lastFocus = null;
}

/* ---------- tabs (hash routing) ---------- */
function setTab(tab) {
  if (!['checklist','budget','guests','documents'].includes(tab)) tab = 'checklist';
  S.ui.tab = tab; save();
  $$('.tab-btn').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  $$('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab));
  if (location.hash !== '#' + tab) { try { history.replaceState(null, '', '#' + tab); } catch (e) {} }
  render();
}

/* ---------- countdown ---------- */
function targetDate() { return parseD(S.weddingDate || PROVISIONAL_DATE); }
function renderCountdown() {
  const t = targetDate(); t.setHours(16, 0, 0, 0);
  let diff = Math.max(0, t - new Date());
  const d = Math.floor(diff / 864e5); diff -= d * 864e5;
  const h = Math.floor(diff / 36e5); diff -= h * 36e5;
  const m = Math.floor(diff / 6e4); diff -= m * 6e4;
  const s = Math.floor(diff / 1e3);
  const box = (v, l) => `<div class="bg-cream/15 backdrop-blur rounded-xl px-3 py-2 min-w-[64px] text-center"><div class="font-serif text-3xl sm:text-4xl font-semibold tabular-nums">${String(v).padStart(2,'0')}</div><div class="text-[11px] uppercase tracking-widest">${tr(l)}</div></div>`;
  $('#countdown').innerHTML = box(d,'days') + box(h,'hours') + box(m,'min') + box(s,'sec');
}
function renderDateNote() {
  $('#weddingDate').value = S.weddingDate || '';
  const weeks = Math.max(0, Math.floor(daysBetween(today(), targetDate()) / 7));
  $('#dateNote').textContent = S.weddingDate
    ? `${weeks} ${tr('weeks to go')} · ${fmtDate(S.weddingDate)}`
    : `${tr('Provisional: counting to the planning date until you set the real one')} (${fmtDate(PROVISIONAL_DATE)})`;
  $('#subTitle').textContent = `Lagos · ${S.weddingDate ? fmtDate(S.weddingDate) : tr('date to be set')} · ${tr('God at the center')}`;
}

/* ---------- header stats ---------- */
function renderHeader() {
  const total = S.tasks.length, done = S.tasks.filter(t => t.status === 'Completed').length;
  const pct = total ? Math.round(done / total * 100) : 0;
  $('#ring').style.strokeDashoffset = 169.6 * (1 - pct / 100);
  $('#ringText').textContent = pct + '%';
  $('#ringLabel').textContent = `${tr('Progress')}: ${pct}%`;
  const overdue = S.tasks.filter(isOverdue).length;
  const crit = S.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed').length;
  $('#headerStats').innerHTML = `<div><b>${done}</b> ${tr('of')} ${total} ${tr('tasks done')}</div><div class="${overdue ? 'text-gold-soft font-semibold' : ''}">${overdue} ${tr('overdue')}</div><div>${crit} ${tr('critical open')}</div>`;
  $('#badgeTasks').textContent = `${total - done}`;
  const head = S.guests.reduce((a, g) => a + 1 + (Number(g.plusOnes) || 0), 0);
  $('#badgeGuests').textContent = head ? head : '';
  $('#badgeDocs').textContent = S.docs.length ? S.docs.length : '';
}

/* ================= CHECKLIST ================= */
const F = { q: '', stream: '', owner: '', status: '', pri: new Set(), hideDone: false };
function fillTaskFilters() {
  const streams = [...new Set(S.tasks.map(t => t.stream))].sort();
  const owners = [...new Set(S.tasks.map(t => t.owner))].sort();
  $('#fStream').innerHTML = `<option value="">${esc(tr('All workstreams'))}</option>` + streams.map(s => `<option value="${esc(s)}" ${s === F.stream ? 'selected' : ''}>${esc(s)}</option>`).join('');
  $('#fOwner').innerHTML = `<option value="">${esc(tr('Any owner'))}</option>` + owners.map(s => `<option value="${esc(s)}" ${s === F.owner ? 'selected' : ''}>${esc(s)}</option>`).join('');
  const st = [['', 'Any status'], ['Not Started', 'Not Started'], ['Ongoing', 'Ongoing'], ['Completed', 'Completed'], ['open', 'Not completed']];
  $('#fStatus').innerHTML = st.map(([v, l]) => `<option value="${v}" ${v === F.status ? 'selected' : ''}>${esc(tr(l))}</option>`).join('');
}
function filteredTasks() {
  const q = F.q.trim().toLowerCase();
  return S.tasks.filter(t =>
    (!q || [t.id, t.title, t.details, t.notes, t.owner, t.stream].join(' ').toLowerCase().includes(q)) &&
    (!F.stream || t.stream === F.stream) &&
    (!F.owner || t.owner === F.owner) &&
    (!F.status || (F.status === 'open' ? t.status !== 'Completed' : t.status === F.status)) &&
    (!F.pri.size || F.pri.has(t.priority)) &&
    (!F.hideDone || t.status !== 'Completed')
  ).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || a.id.localeCompare(b.id));
}
function taskCard(t) {
  const done = t.status === 'Completed';
  const r = done ? { text: tr('Done') + ' ✓', cls: 'text-sage font-semibold' } : relDue(t.due);
  return `<article class="task group bg-white rounded-xl border ${isOverdue(t) ? 'border-coral/50' : 'border-sand/70'} hover:shadow-card transition ${done ? 'done' : ''}" data-id="${esc(t.id)}">
    <div class="flex items-start gap-3 p-3">
      <input type="checkbox" class="check mt-0.5" data-act="toggle" ${done ? 'checked' : ''} aria-label="${esc(tr('Mark complete'))}: ${esc(t.title)}">
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          ${t.milestone ? `<span class="text-gold" role="img" aria-label="${esc(tr('Key milestone'))}" title="${esc(tr('Key milestone'))}">★</span>` : ''}
          <button class="task-title text-left font-medium leading-snug hover:text-sea" data-act="expand" aria-expanded="false">${esc(t.title)}</button>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span class="${r.cls}">${r.text}</span>
          <span>${fmtDate(t.due)}</span>
          <span>· ${esc(t.owner)}</span>
          <span class="hidden sm:inline">· ${esc(t.stream)}</span>
          <span class="text-[11px] tracking-wider">${esc(t.id)}</span>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
        <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[t.priority] || 'bg-ivory'}">${esc(tr(t.priority))}</span>
        <button class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[t.status] || ''}" data-act="cycle" title="${esc(tr('Click to change status'))}">${esc(tr(t.status))}</button>
      </div>
    </div>
    <div class="task-more hidden border-t border-sand/70 px-3 pb-3 pt-2 ml-9 space-y-2 text-sm">
      ${t.details ? `<p class="text-ink/80">${esc(t.details)}</p>` : ''}
      <div class="grid sm:grid-cols-3 gap-2">
        <label class="text-xs text-muted">${esc(tr('Deadline'))}<input type="date" class="field mt-1" data-field="due" value="${esc(t.due)}"></label>
        <label class="text-xs text-muted">${esc(tr('Owner'))}<input class="field mt-1" data-field="owner" value="${esc(t.owner)}"></label>
        <label class="text-xs text-muted">${esc(tr('Priority'))}<select class="field mt-1" data-field="priority">${options(PRIORITIES, t.priority)}</select></label>
      </div>
      <label class="block text-xs text-muted">${esc(tr('Notes and dependencies'))}<textarea class="field mt-1" rows="2" data-field="notes" placeholder="${esc(tr('Who you spoke to, quotes received, next step…'))}">${esc(t.notes)}</textarea></label>
      <div class="flex justify-end gap-3 text-xs">
        ${t.custom ? `<button class="text-coral-deep underline" data-act="delete">${esc(tr('Delete task'))}</button>` : ''}
      </div>
    </div>
  </article>`;
}
function groupHTML(title, sub, tasks, accent = '') {
  if (!tasks.length) return '';
  const done = tasks.filter(t => t.status === 'Completed').length;
  return `<div class="fade-in">
    <div class="flex items-end justify-between mb-2 px-1">
      <div><h3 class="font-serif text-2xl font-semibold ${accent}">${title}</h3>${sub ? `<p class="text-xs text-muted">${sub}</p>` : ''}</div>
      <div class="text-xs text-muted">${done}/${tasks.length} ${tr('done')}</div>
    </div>
    <div class="h-1.5 bg-sand/60 rounded-full mb-3 overflow-hidden"><div class="bar h-full bg-sea rounded-full" style="width:${tasks.length ? done / tasks.length * 100 : 0}%"></div></div>
    <div class="space-y-2">${tasks.map(taskCard).join('')}</div>
  </div>`;
}
function renderTasks() {
  const list = filteredTasks();
  const view = S.ui.view;
  $$('.view-btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === view));
  $('#fHideDone').checked = F.hideDone;
  $$('#fPriority [data-p]').forEach(b => b.setAttribute('aria-pressed', F.pri.has(b.dataset.p)));
  let html = '';
  if (view === 'focus') {
    const t0 = today();
    const overdue = list.filter(isOverdue);
    const soon = list.filter(t => !isOverdue(t) && t.status !== 'Completed' && t.due && daysBetween(t0, parseD(t.due)) <= 14);
    const month = list.filter(t => !isOverdue(t) && t.status !== 'Completed' && t.due && daysBetween(t0, parseD(t.due)) > 14 && daysBetween(t0, parseD(t.due)) <= 45);
    const ongoing = list.filter(t => t.status === 'Ongoing' && !overdue.includes(t) && !soon.includes(t) && !month.includes(t));
    html = groupHTML(tr('Overdue'), tr('Past the target date and not completed'), overdue, 'text-coral-deep')
      + groupHTML(tr('Next two weeks'), tr('Due within 14 days'), soon)
      + groupHTML(tr('Coming up'), tr('Due in 15 to 45 days'), month)
      + groupHTML(tr('In progress'), tr('Ongoing tasks due later'), ongoing);
    if (!html) html = `<div class="text-center py-16"><div class="font-serif text-3xl">${esc(tr('All clear'))} ✨</div><p class="text-muted text-sm mt-1">${esc(tr('Nothing overdue or due in the next 45 days for these filters.'))}</p></div>`;
  } else if (view === 'timeline') {
    const groups = {};
    list.forEach(t => (groups[monthKey(t.due)] ||= []).push(t));
    const wd = S.weddingDate || PROVISIONAL_DATE;
    html = Object.keys(groups).sort().map(k => {
      const first = parseD(k + '-01');
      const monthsOut = Math.max(0, Math.round(daysBetween(first, parseD(wd)) / 30.4));
      const sub = k === '9999-99' ? '' : (first > parseD(wd) ? tr('After the wedding') : tx(`About ${monthsOut} month${monthsOut === 1 ? '' : 's'} before the wedding`, `Cerca de ${monthsOut} ${monthsOut === 1 ? 'mês' : 'meses'} antes do casamento`));
      return groupHTML(monthLabel(k), sub, groups[k]);
    }).join('');
  } else {
    const groups = {};
    list.forEach(t => (groups[t.stream] ||= []).push(t));
    html = Object.keys(groups).sort().map(k => groupHTML(esc(k), '', groups[k])).join('');
  }
  if (!list.length) html = `<p class="text-center text-muted py-16">${esc(tr('No tasks match these filters.'))}</p>`;
  $('#taskList').innerHTML = html;

  // alert banner
  const od = S.tasks.filter(isOverdue).length;
  const wk = S.tasks.filter(t => t.status !== 'Completed' && t.due && !isOverdue(t) && daysBetween(today(), parseD(t.due)) <= 7).length;
  $('#taskAlerts').innerHTML = (od || wk) ? `<div class="rounded-2xl bg-coral-soft/60 border border-coral/30 px-4 py-3 text-sm flex flex-wrap items-center gap-2">
    <span class="font-semibold text-coral-deep">${esc(tr('Heads up:'))}</span>
    ${od ? `<span>${tx(`${od} task${od > 1 ? 's are' : ' is'} overdue.`, `${od} ${od > 1 ? 'tarefas estão' : 'tarefa está'} em atraso.`)}</span>` : ''}
    ${wk ? `<span>${tx(`${wk} due in the next 7 days.`, `${wk} ${wk > 1 ? 'vencem' : 'vence'} nos próximos 7 dias.`)}</span>` : ''}
    <button class="ml-auto text-xs underline text-coral-deep" id="goFocus">${esc(tr('Show me'))}</button></div>` : '';
  const gf = $('#goFocus'); if (gf) gf.onclick = () => { S.ui.view = 'focus'; F.hideDone = true; save(); renderTasks(); };
}

/* ================= BUDGET ================= */
const curList = () => Object.keys(S.rates);
function budgetTotals() {
  const funds = S.funds.reduce((a, f) => a + toBase(f.amount, f.currency), 0);
  const est = S.expenses.reduce((a, x) => a + toBase(x.estimate, x.currency), 0);
  const paid = S.expenses.reduce((a, x) => a + toBase(x.paid, x.currency), 0);
  return { funds, est, paid, remaining: funds - est, toPay: est - paid };
}
const potOptions = sel => S.pots.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(tr(p.name))}</option>`).join('') + `<option value="" ${!sel ? 'selected' : ''}>${esc(tr('No pot'))}</option>`;
function renderPots(fundsTotal) {
  const allocated = S.pots.reduce((a, p) => a + toBase(p.amount, p.currency), 0);
  const free = fundsTotal - allocated;
  $('#potNote').innerHTML = `${tr('Allocated')} ${money(allocated)} ${tr('of')} ${money(fundsTotal)} · <b class="${free < 0 ? 'text-coral-deep' : 'text-sea-deep'}">${free < 0 ? tr('Over allocated by') + ' ' + money(-free) : money(free) + ' ' + tr('not yet allocated')}</b>`;
  const tone = { ng: 'bg-sea', br: 'bg-coral', hm: 'bg-gold' };
  $('#potCards').innerHTML = S.pots.map(p => {
    const items = S.expenses.filter(x => x.pot === p.id);
    const cap = toBase(p.amount, p.currency);
    const est = items.reduce((a, x) => a + toBase(x.estimate, x.currency), 0);
    const paid = items.reduce((a, x) => a + toBase(x.paid, x.currency), 0);
    const left = cap - est;
    const pct = cap ? Math.min(100, est / cap * 100) : 0, ppct = cap ? Math.min(100, paid / cap * 100) : 0;
    return `<div class="rounded-xl border border-sand/70 p-3" data-pot="${p.id}">
      <div class="flex items-center justify-between gap-2"><span class="font-semibold flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full ${tone[p.id] || 'bg-sage'}" aria-hidden="true"></span>${esc(tr(p.name))}</span>
        <label class="text-xs text-muted flex items-center gap-1">${SYMBOL.NAD}<input class="cell !w-24 text-right tabular-nums" type="number" step="any" min="0" data-potamt="${p.id}" value="${p.amount}" aria-label="${esc(tr(p.name))}: ${esc(tr('allocation'))}"></label></div>
      <div class="h-2.5 bg-ivory rounded-full overflow-hidden relative mt-2" aria-hidden="true"><div class="bar absolute inset-y-0 left-0 ${left < 0 ? 'bg-coral' : 'bg-coral-soft'} rounded-full" style="width:${pct}%"></div><div class="bar absolute inset-y-0 left-0 ${tone[p.id] || 'bg-sage'} rounded-full" style="width:${ppct}%"></div></div>
      <div class="flex justify-between text-xs mt-2"><span class="text-muted">${tr('Planned')} ${money(est)} · ${tr('paid')} ${money(paid)}</span><span class="font-semibold ${left < 0 ? 'text-coral-deep' : 'text-sea-deep'}">${left < 0 ? money(-left) + ' ' + tr('over') : money(left) + ' ' + tr('left')}</span></div>
    </div>`;
  }).join('');
}
let bCat = '';
function renderBudget() {
  const T = budgetTotals();
  const card = (label, val, sub, cls = 'bg-white') => `<div class="${cls} rounded-2xl shadow-card p-4"><div class="text-xs uppercase tracking-wider">${label}</div><div class="font-serif text-2xl sm:text-3xl font-semibold mt-1 tabular-nums">${val}</div><div class="text-xs mt-0.5">${sub}</div></div>`;
  const usedPct = T.funds ? Math.min(100, T.est / T.funds * 100) : 0;
  $('#budgetCards').innerHTML =
    card(tr('Total funds'), money(T.funds), `${S.funds.length} ${S.funds.length === 1 ? tr('source') : tr('sources')}`) +
    card(tr('Planned spend'), money(T.est), `${usedPct.toFixed(0)}% ${tr('of funds allocated')}`) +
    card(tr('Paid so far'), money(T.paid), `${money(T.toPay)} ${tr('still to pay')}`) +
    card(tr('Remaining'), money(Math.abs(T.remaining)), T.remaining < 0 ? tr('Over budget by this amount, time to trim') : tr('Funds minus planned spend'), T.remaining < 0 ? 'bg-coral text-white' : 'bg-sea text-cream');

  renderPots(T.funds);
  // selects keep the current choice when the language changes
  $('#bCatFilter').innerHTML = `<option value="">${esc(tr('All categories'))}</option>` + options(CATEGORIES, bCat);
  const qf = $('#quickExpense');
  qf.pot.innerHTML = potOptions(qf.pot.value || 'ng');
  qf.category.innerHTML = options(CATEGORIES, qf.category.value || 'Venue');
  qf.currency.innerHTML = options(curList(), qf.currency.value || S.baseCurrency);

  // expense rows
  const rows = S.expenses.filter(x => !bCat || x.category === bCat);
  $('#expenseEmpty').classList.toggle('hidden', rows.length > 0);
  $('#expenseRows').innerHTML = rows.map(x => {
    const full = Number(x.paid) >= Number(x.estimate) && Number(x.estimate) > 0;
    const r = x.due && !full ? relDue(x.due) : null;
    return `<tr class="border-t border-sand/60 align-middle" data-id="${x.id}">
      <td class="py-1 px-1"><input class="cell font-medium" data-f="item" value="${esc(x.item)}" aria-label="${esc(tr('Item'))}"><input class="cell text-xs text-muted" data-f="vendor" value="${esc(x.vendor || '')}" placeholder="${esc(tr('Vendor / note'))}" aria-label="${esc(tr('Vendor / note'))}"></td>
      <td class="px-1"><select class="cell" data-f="pot" aria-label="${esc(tr('Pot'))}">${potOptions(x.pot)}</select></td>
      <td class="px-1"><select class="cell" data-f="category" aria-label="${esc(tr('Category'))}">${options(CATEGORIES, x.category)}</select></td>
      <td class="px-1"><input class="cell text-right tabular-nums" type="number" step="any" min="0" data-f="estimate" value="${esc(x.estimate)}" aria-label="${esc(tr('Estimate'))}"></td>
      <td class="px-1"><input class="cell text-right tabular-nums ${full ? 'text-sea-deep font-semibold' : ''}" type="number" step="any" min="0" data-f="paid" value="${esc(x.paid)}" aria-label="${esc(tr('Paid'))}"></td>
      <td class="px-1"><select class="cell" data-f="currency" aria-label="${esc(tr('Currency'))}">${options(curList(), x.currency)}</select></td>
      <td class="px-1"><select class="cell" data-f="status" aria-label="${esc(tr('Status'))}">${options(EXP_STATUS, x.status)}</select></td>
      <td class="px-1"><input class="cell" type="date" data-f="due" value="${esc(x.due || '')}" aria-label="${esc(tr('Next due'))}">${r ? `<div class="text-[11px] px-1 ${r.cls}">${r.text}</div>` : ''}</td>
      <td class="px-1 text-right"><button class="text-muted hover:text-coral-deep px-2" data-del title="${esc(tr('Delete'))}" aria-label="${esc(tr('Delete'))}">✕</button></td>
    </tr>`;
  }).join('');

  // funds
  $('#fundRows').innerHTML = S.funds.map(f => `<div class="rounded-xl border border-sand/60 p-1.5" data-id="${f.id}">
    <div class="flex items-center gap-1"><input class="cell font-medium" data-f="source" value="${esc(f.source)}" aria-label="${esc(tr('source'))}"><button class="text-muted hover:text-coral-deep px-1" data-del title="${esc(tr('Remove'))}" aria-label="${esc(tr('Remove'))}">✕</button></div>
    <div class="grid grid-cols-[1fr_84px] gap-1 items-center">
      <input class="cell tabular-nums" type="number" step="any" data-f="amount" value="${esc(f.amount)}" aria-label="${esc(tr('Amount'))}">
      <select class="cell" data-f="currency" aria-label="${esc(tr('Currency'))}">${options(curList(), f.currency)}</select></div>
    <div class="text-[11px] text-muted px-1.5">≈ ${money(toBase(f.amount, f.currency))}</div></div>`).join('')
    + `<div class="text-xs text-muted pt-2 border-t border-sand/60 flex justify-between"><span>${tr('Total in')} ${S.baseCurrency}</span><b class="text-ink">${money(T.funds)}</b></div>`;

  // categories
  const byCat = {};
  S.expenses.forEach(x => { const c = byCat[x.category] ||= { est: 0, paid: 0 }; c.est += toBase(x.estimate, x.currency); c.paid += toBase(x.paid, x.currency); });
  const cats = Object.entries(byCat).sort((a, b) => b[1].est - a[1].est);
  const max = Math.max(1, ...cats.map(c => c[1].est));
  $('#catBars').innerHTML = cats.length ? cats.map(([c, v]) => `<button class="block w-full text-left group" data-cat="${esc(c)}">
    <div class="flex justify-between text-xs mb-1"><span class="font-medium group-hover:text-sea">${esc(tr(c))}</span><span class="tabular-nums text-muted">${money(v.est)}</span></div>
    <div class="h-2.5 bg-ivory rounded-full overflow-hidden relative"><div class="bar absolute inset-y-0 left-0 bg-coral-soft rounded-full" style="width:${v.est / max * 100}%"></div><div class="bar absolute inset-y-0 left-0 bg-sea rounded-full" style="width:${v.paid / max * 100}%"></div></div></button>`).join('')
    + `<div class="flex gap-3 text-[11px] text-muted pt-1"><span><span class="inline-block w-2 h-2 rounded-full bg-sea mr-1"></span>${tr('paid')}</span><span><span class="inline-block w-2 h-2 rounded-full bg-coral-soft mr-1"></span>${tr('planned')}</span></div>`
    : `<p class="text-xs text-muted">${esc(tr('Categories appear here as you add expenses.'))}</p>`;

  // next payments
  const due = S.expenses.filter(x => x.due && Number(x.paid) < Number(x.estimate)).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
  $('#nextPayments').innerHTML = due.length ? due.map(x => { const r = relDue(x.due); return `<div class="flex justify-between gap-2"><div><div class="font-medium">${esc(x.item)}</div><div class="text-xs ${r.cls}">${r.text} · ${fmtDate(x.due)}</div></div><div class="text-right tabular-nums text-sm">${money(Number(x.estimate) - Number(x.paid), x.currency)}</div></div>`; }).join('') : `<p class="text-xs text-muted">${esc(tr('No upcoming payments with dates.'))}</p>`;

  // currency settings
  $('#baseCur').innerHTML = options(curList(), S.baseCurrency);
  $('#rateRows').innerHTML = curList().map(c => `<label class="text-xs flex items-center gap-2"><span class="w-10 font-semibold">${c}</span><input class="field" type="number" step="any" min="0" data-rate="${c}" value="${S.rates[c]}" ${c === 'USD' ? 'disabled' : ''}></label>`).join('');
}

/* ================= GUESTS ================= */
const G = { q: '', rsvp: '', diet: '' };
function renderGuests() {
  const all = S.guests;
  const head = g => 1 + (Number(g.plusOnes) || 0);
  const sum = arr => arr.reduce((a, g) => a + head(g), 0);
  const attending = all.filter(g => g.rsvp === 'Attending');
  const bride = all.filter(g => g.side === 'Bride'), groom = all.filter(g => g.side === 'Groom');
  const dietCounts = {};
  all.filter(g => g.rsvp !== 'Declined' && g.diet && g.diet !== 'No restrictions').forEach(g => dietCounts[g.diet] = (dietCounts[g.diet] || 0) + 1);
  const card = (label, val, sub, cls = 'bg-white') => `<div class="${cls} rounded-2xl shadow-card p-4"><div class="text-xs uppercase tracking-wider">${label}</div><div class="font-serif text-3xl font-semibold mt-1 tabular-nums">${val}</div><div class="text-xs mt-0.5">${sub}</div></div>`;
  const bPct = all.length ? Math.round(bride.length / all.length * 100) : 50;
  $('#guestCards').innerHTML =
    card(tr('Total headcount'), sum(all), `${all.length} ${tr('invitations')} · ${tr('incl. plus ones')}`) +
    `<div class="bg-white rounded-2xl shadow-card p-4"><div class="text-xs uppercase tracking-wider">${esc(tr('Bride · Groom'))}</div><div class="font-serif text-3xl font-semibold mt-1 tabular-nums">${sum(bride)} <span class="text-muted text-xl">·</span> ${sum(groom)}</div><div class="h-2 rounded-full bg-sea mt-2 overflow-hidden" aria-hidden="true"><div class="bar h-full bg-coral" style="width:${bPct}%"></div></div></div>` +
    card(tr('Attending'), sum(attending), `${all.filter(g => ['Invited','Maybe'].includes(g.rsvp)).length} ${tr('awaiting reply')} · ${all.filter(g => g.rsvp === 'Declined').length} ${tr('declined')}`, 'bg-sea text-cream') +
    `<div class="bg-white rounded-2xl shadow-card p-4"><div class="text-xs uppercase tracking-wider mb-2">${esc(tr('Dietary for caterer'))}</div><div class="flex flex-wrap gap-1">${Object.keys(dietCounts).length ? Object.entries(dietCounts).sort((a, b) => b[1] - a[1]).map(([d, n]) => `<button class="rounded-full bg-gold-soft text-gold-deep px-2 py-0.5 text-xs font-semibold" data-diet="${esc(d)}">${esc(tr(d))} ${n}</button>`).join('') : `<span class="text-xs text-muted">${esc(tr('No restrictions recorded'))}</span>`}</div></div>`;

  $$('.side-btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.side === S.ui.side));
  $('#gRsvpFilter').innerHTML = `<option value="">${esc(tr('Any RSVP'))}</option>` + RSVP.map(r => `<option value="${esc(r)}" ${r === G.rsvp ? 'selected' : ''}>${esc(tr(r))}</option>`).join('');
  $('#gDietFilter').innerHTML = `<option value="">${esc(tr('Any diet'))}</option>` + DIETS.map(r => `<option value="${esc(r)}" ${r === G.diet ? 'selected' : ''}>${esc(tr(r))}</option>`).join('');
  const qg = $('#quickGuest');
  qg.side.innerHTML = options(SIDES, qg.side.value || 'Bride');
  qg.country.innerHTML = options(COUNTRIES, qg.country.value || 'Nigeria');
  qg.diet.innerHTML = options(DIETS, qg.diet.value || 'No restrictions');
  if (S.ui.side && qg.side.value !== S.ui.side && ['Bride','Groom'].includes(S.ui.side)) qg.side.value = S.ui.side;

  const q = G.q.trim().toLowerCase();
  const rows = all.filter(g => (!S.ui.side || g.side === S.ui.side || g.side === 'Both') && (!G.rsvp || g.rsvp === G.rsvp) && (!G.diet || g.diet === G.diet) && (!q || [g.name, g.notes, g.country].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  $('#guestEmpty').classList.toggle('hidden', rows.length > 0);
  const sideDot = { Bride: 'bg-coral', Groom: 'bg-sea', Both: 'bg-gold' };
  $('#guestRows').innerHTML = rows.map(g => `<tr class="border-t border-sand/60" data-id="${g.id}">
    <td class="py-1 px-1"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full shrink-0 ${sideDot[g.side] || 'bg-gold'}" aria-hidden="true"></span><input class="cell font-medium" data-f="name" value="${esc(g.name)}" aria-label="${esc(tr('Name'))}"></div></td>
    <td class="px-1"><select class="cell" data-f="side" aria-label="${esc(tr('Side'))}">${options(SIDES, g.side)}</select></td>
    <td class="px-1"><select class="cell" data-f="country" aria-label="${esc(tr('From'))}">${options(COUNTRIES, g.country)}</select></td>
    <td class="px-1"><select class="cell" data-f="event" aria-label="${esc(tr('Event'))}">${options(EVENTS, g.event)}</select></td>
    <td class="px-1"><select class="cell font-semibold ${RSVP_STYLE[g.rsvp] || ''}" data-f="rsvp" aria-label="RSVP">${options(RSVP, g.rsvp)}</select></td>
    <td class="px-1"><select class="cell" data-f="diet" aria-label="${esc(tr('Dietary'))}">${options(DIETS, g.diet)}</select></td>
    <td class="px-1"><input class="cell text-center w-14 mx-auto" type="number" min="0" max="9" data-f="plusOnes" value="${esc(g.plusOnes || 0)}" aria-label="${esc(tr('+1s'))}"></td>
    <td class="px-1"><input class="cell text-xs" data-f="notes" value="${esc(g.notes || '')}" placeholder="${esc(tr('Allergy, table, visa…'))}" aria-label="${esc(tr('Notes'))}"></td>
    <td class="px-1 text-right"><button class="text-muted hover:text-coral-deep px-2" data-del title="${esc(tr('Remove'))}" aria-label="${esc(tr('Remove'))}">✕</button></td>
  </tr>`).join('');
}
function addGuest(d) {
  S.guests.push({ id: uid(), name: d.name.trim(), side: d.side || 'Bride', country: d.country || 'Nigeria', event: d.event || 'Lagos', rsvp: d.rsvp || 'Not sent', diet: d.diet || 'No restrictions', plusOnes: Number(d.plusOnes) || 0, notes: d.notes || '' });
}

/* ================= DOCUMENTS ================= */
function renderDocs() {
  $('#docEmpty').classList.toggle('hidden', S.docs.length > 0);
  $('#docList').innerHTML = S.docs.map(d => {
    const href = safeUrl(d.url);
    const open = href
      ? `<a class="rounded-full bg-sea text-cream px-3 py-1.5 text-xs font-semibold" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(tr('Open'))}<span class="sr-only"> (${esc(tr('opens in a new tab'))})</span></a>`
      : `<span class="text-xs text-coral-deep font-semibold">${esc(tr('Check the link'))}</span>`;
    return `<article class="doc rounded-xl border border-sand/70 bg-white p-3" data-id="${esc(d.id)}">
      <div class="flex items-start gap-3">
        <div class="flex-1 min-w-0 space-y-2">
          <div class="text-[11px] uppercase tracking-wider text-muted px-1.5">${esc(tr(docKind(href || d.url)))}</div>
          <input class="cell font-medium" data-f="title" value="${esc(d.title)}" aria-label="${esc(tr('Title'))}">
          <input class="cell text-xs text-muted" data-f="url" value="${esc(d.url)}" aria-label="${esc(tr('Link'))}">
          <input class="cell text-xs" data-f="note" value="${esc(d.note || '')}" placeholder="${esc(tr('Note (optional)'))}" aria-label="${esc(tr('Note (optional)'))}">
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          ${open}
          <button class="text-xs text-muted hover:text-coral-deep px-1" data-del>${esc(tr('Remove'))}</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

/* ================= DATA / BACKUP ================= */
function toCSV(rows, cols) {
  const q = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\n');
}
function tryDownload(name, text, type) {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) {}
}

/* ================= SYNC (optional, shared between devices) ================= */
/* Local first: the planner always works from this browser's own copy. When Sync
   is on, changes are pushed to /api/planner and other devices' changes are pulled
   and merged in. The merge is three way (last synced copy, this device, remote), per
   record and per field, so two people editing different things never overwrite
   each other. The sync code never leaves the browser, only its hash does. */
const SYNC_KEY = 'kp-wedding-planner-sync';
let SYNC = null;                          // { code, id, rev, base, last } while sync is on
try { SYNC = JSON.parse(localStorage.getItem(SYNC_KEY)) || null; } catch (e) {}
let syncState = SYNC ? 'idle' : 'off';    // off | idle | busy | error | offline
let syncProblem = '';
let syncBusy = false, syncAgain = false, syncTimer = null, pendingRender = false;
const CODE_RE = /^[A-Za-z0-9]{16,64}$/;
const saveSyncMeta = () => { try { if (SYNC) localStorage.setItem(SYNC_KEY, JSON.stringify(SYNC)); else localStorage.removeItem(SYNC_KEY); } catch (e) {} };
const clone = o => JSON.parse(JSON.stringify(o));
const stripUI = st => { const c = { ...st }; delete c.ui; return c; };   // tab and view choices stay per device
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']'
  : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  : (v === undefined ? 'undefined' : JSON.stringify(v));
const same = (a, b) => canon(a) === canon(b);
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
// Keep what changed: if only one side changed it, take that side. If both changed, this device wins.
const pickWhole = (b, l, r) => (same(b, l) ? r : l);
function mergeRecord(b, l, r) {
  if (!isObj(b) || !isObj(l) || !isObj(r)) return pickWhole(b, l, r);   // added or deleted on one side
  const out = {};
  for (const k of new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)])) {
    const v = pickWhole(b[k], l[k], r[k]);
    if (v !== undefined) out[k] = v;
  }
  return same(out, l) ? l : out;
}
function mergeList(B, L, R) {
  const idx = a => new Map((a || []).map(x => [x.id, x]));
  const b = idx(B), l = idx(L), r = idx(R);
  const order = [...(R || []).map(x => x.id), ...(L || []).map(x => x.id).filter(id => !r.has(id))];
  const out = [];
  for (const id of order) { const v = mergeRecord(b.get(id), l.get(id), r.get(id)); if (v !== undefined) out.push(v); }
  return out;
}
function mergeMap(B, L, R) {
  const out = {}; B = B || {}; L = L || {}; R = R || {};
  for (const k of new Set([...Object.keys(B), ...Object.keys(L), ...Object.keys(R)])) { const v = pickWhole(B[k], L[k], R[k]); if (v !== undefined) out[k] = v; }
  return out;
}
function merge3(B, L, R) {
  B = B || {};
  const out = { ...R };
  ['tasks', 'funds', 'pots', 'expenses', 'guests', 'docs'].forEach(k => { out[k] = mergeList(B[k], L[k], R[k]); });
  out.rates = mergeMap(B.rates, L.rates, R.rates);
  ['weddingDate', 'baseCurrency', 'version'].forEach(k => { out[k] = pickWhole(B[k], L[k], R[k]); });
  delete out.ui;
  return out;
}

async function hashCode(code) {
  if (!(window.crypto && crypto.subtle)) { const e = new Error('no_crypto'); e.code = 'no_crypto'; throw e; }
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kp-planner-sync:' + code));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function newCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';   // no look alike characters
  let out = '';
  while (out.length < 24) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    for (const b of bytes) { if (b < 228 && out.length < 24) out += alphabet[b % alphabet.length]; }   // 228 = 4 x 57, no bias
  }
  return out;
}
async function api(method, id, body) {
  const opt = { method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' };
  let url = '/api/planner';
  if (method === 'GET') url += '?id=' + id;
  else { const payload = JSON.stringify({ id, ...body }); opt.body = payload; opt.keepalive = payload.length < 60000; }
  const res = await fetch(url, opt);
  const json = await res.json().catch(() => ({}));
  if (res.status === 409) return { ok: false, rev: json.rev, data: json.data };
  if (!res.ok) { const e = new Error(json.error || ('http_' + res.status)); e.code = json.error || ('http_' + res.status); throw e; }
  return { ok: true, ...json };
}

function setSyncState(state, problem) {
  syncState = state; syncProblem = problem || '';
  renderSyncBadge(); renderSyncPanel();
}
function renderSyncBadge() {
  if (!$('#btnSync')) return;
  const labels = { off: 'Sync off', idle: 'Synced', busy: 'Syncing…', offline: 'Offline', error: 'Not synced' };
  $('#syncLabel').textContent = tr(labels[syncState] || labels.off);
  $('#syncDot').className = 'sync-dot sync-' + syncState;
}
// true only while the person is really typing in a visible field (a hidden one that kept focus does not count)
const isEditing = () => { const a = document.activeElement; return !!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#app') && a.offsetParent !== null); };
// a screen refresh postponed because someone was typing happens as soon as they stop
function flushPending() { if (pendingRender && !isEditing()) { pendingRender = false; renderEverything(); } }
function applyMerged(merged) {
  const before = canon(stripUI(S));
  Object.assign(S, merged);
  persist();
  if (canon(stripUI(S)) !== before) { if (isEditing()) pendingRender = true; else renderEverything(); }
}
function scheduleSync(delay = 1200) {
  if (!SYNC) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), delay);
}
async function syncNow() {
  if (!SYNC) return;
  if (navigator.onLine === false) { setSyncState('offline'); return; }
  if (syncBusy) { syncAgain = true; return; }
  syncBusy = true; setSyncState('busy');
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const remote = await api('GET', SYNC.id);
      if (remote.rev !== SYNC.rev) {                                   // someone saved since our last sync
        applyMerged(remote.data ? merge3(SYNC.base, S, remote.data) : stripUI(S));
        SYNC.rev = remote.rev; SYNC.base = clone(remote.data || {});
      }
      const mine = stripUI(S);
      if (same(mine, SYNC.base)) { SYNC.last = Date.now(); saveSyncMeta(); setSyncState('idle'); return; }
      const put = await api('PUT', SYNC.id, { baseRev: SYNC.rev, data: mine });
      if (put.ok) { SYNC.rev = put.rev; SYNC.base = clone(mine); SYNC.last = Date.now(); saveSyncMeta(); setSyncState('idle'); return; }
      // 409: the other device saved in between, loop again to pull and merge
    }
    throw new Error('busy');
  } catch (e) {
    setSyncState(navigator.onLine === false ? 'offline' : 'error', e.code || e.message);
  } finally {
    syncBusy = false;
    if (syncAgain) { syncAgain = false; scheduleSync(300); }
  }
}
// Turn sync on for this device with a code (new or existing).
async function connectCode(code, { create = false, silent = false } = {}) {
  code = String(code || '').trim();
  if (!CODE_RE.test(code)) { toast(tr('The code must be letters and numbers, at least 16 characters.')); return false; }
  setSyncState('busy');
  try {
    const id = await hashCode(code);
    const remote = await api('GET', id);
    if (remote.data && !create) {
      if (!silent && !confirm(tr('This code already has planner data from another device. Load it here? What is on this device now will be replaced.'))) { setSyncState(SYNC ? 'idle' : 'off'); return false; }
      Object.assign(S, mergeState({ ...remote.data, ui: S.ui }));
      SYNC = { code, id, rev: remote.rev, base: clone(remote.data), last: Date.now() };
      persist(); saveSyncMeta(); renderEverything();
      toast(tr('Planner loaded from sync'));
    } else {
      SYNC = { code, id, rev: remote.rev, base: remote.data ? clone(remote.data) : {}, last: 0 };
      saveSyncMeta();
    }
    await syncNow();
    return true;
  } catch (e) {
    SYNC = SYNC && SYNC.id ? SYNC : null;
    setSyncState(SYNC ? 'error' : 'off', e.code || e.message);
    return false;
  }
}
function syncStatusLine() {
  if (syncState === 'busy') return tr('Syncing…');
  if (syncState === 'offline') return tr('You are offline. Changes are saved here and will sync when you are back online.');
  if (syncState === 'error' || (syncState === 'off' && syncProblem)) {
    if (syncProblem === 'not_configured') return tr('Sync is not set up on the server yet. Follow the setup steps, then try again.');
    if (syncProblem === 'no_crypto') return tr('Open the planner over https to use sync.');
    if (/^http_(404|405)$/.test(syncProblem)) return tr('Sync only works on the live website, not on this address.');
    return tr('Could not reach the sync service. It will try again soon.');
  }
  if (SYNC && SYNC.last) return `${tr('Last synced')}: ${new Date(SYNC.last).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}`;
  return '';
}
async function copyText(text, inputEl) {
  try { await navigator.clipboard.writeText(text); toast(tr('Copied')); }
  catch (e) { if (inputEl) { inputEl.select(); toast(tr('Selected: press Ctrl or Cmd + C')); } }
}
function renderSyncPanel() {
  const box = $('#syncPanel'); if (!box) return;
  if (SYNC) {
    const bad = syncState === 'error' || syncState === 'offline';
    box.innerHTML = `<p class="text-muted">${esc(tr('Sync is on. Changes on any device that uses this code show up on the others within a few seconds.'))}</p>
      <div class="rounded-xl bg-ivory/60 p-3 space-y-2">
        <label class="block text-xs uppercase tracking-wider text-muted" for="syncCodeShow">${esc(tr('Sync code'))}</label>
        <input id="syncCodeShow" class="field font-mono text-sm" readonly value="${esc(SYNC.code)}">
        <div class="flex flex-wrap gap-2">
          <button id="syncCopyInvite" class="rounded-full bg-ink text-cream px-4 py-2 text-sm font-semibold">${esc(tr('Copy invite link'))}</button>
          <button id="syncCopyCode" class="rounded-full border border-sand px-4 py-2 text-sm font-semibold">${esc(tr('Copy code'))}</button>
        </div>
        <p class="text-xs text-muted">${esc(tr('Anyone who has this code can see and change the planner. Share it only with Kev.'))}</p>
      </div>
      <p id="syncStatus" class="text-xs ${bad ? 'text-coral-deep font-semibold' : 'text-muted'}" role="status">${esc(syncStatusLine())}</p>
      <div class="flex flex-wrap gap-2">
        <button id="syncNowBtn" class="rounded-full border border-sand px-4 py-2 text-sm font-semibold">${esc(tr('Sync now'))}</button>
        <button id="syncOffBtn" class="rounded-full border border-sand px-4 py-2 text-sm font-semibold text-coral-deep">${esc(tr('Turn off sync on this device'))}</button>
      </div>`;
    $('#syncCopyInvite', box).onclick = () => copyText(`${location.origin}/planner/#sync=${SYNC.code}`, $('#syncCodeShow', box));
    $('#syncCopyCode', box).onclick = () => copyText(SYNC.code, $('#syncCodeShow', box));
    $('#syncNowBtn', box).onclick = () => syncNow();
    $('#syncOffBtn', box).onclick = () => { SYNC = null; saveSyncMeta(); setSyncState('off'); toast(tr('Sync turned off on this device')); };
  } else {
    box.innerHTML = `<p class="text-muted">${esc(tr("Right now this planner is saved only in this browser. Turn on sync to share one planner between your devices and Kev's."))}</p>
      <button id="syncCreate" class="w-full rounded-full bg-coral text-white py-2.5 font-semibold">${esc(tr('Create a new sync code'))}</button>
      <hr class="border-sand">
      <label class="block text-xs" for="syncCodeIn">${esc(tr('Or use a code you already have'))}</label>
      <input id="syncCodeIn" class="field font-mono text-sm" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(tr('Paste the sync code'))}">
      <button id="syncUse" class="w-full rounded-full bg-sea text-cream py-2 font-semibold">${esc(tr('Connect'))}</button>
      <p id="syncStatus" class="text-xs ${syncProblem ? 'text-coral-deep font-semibold' : 'text-muted'}" role="status">${esc(syncStatusLine())}</p>`;
    $('#syncCreate', box).onclick = () => connectCode(newCode(), { create: true });
    $('#syncUse', box).onclick = () => connectCode($('#syncCodeIn', box).value);
  }
}

/* ---------- render ---------- */
function render() {
  renderHeader();
  if (S.ui.tab === 'checklist') renderTasks();
  if (S.ui.tab === 'budget') renderBudget();
  if (S.ui.tab === 'guests') renderGuests();
  if (S.ui.tab === 'documents') renderDocs();
}
function renderEverything() {
  applyI18n();
  renderSyncBadge();
  fillTaskFilters();
  renderDateNote();
  renderCountdown();
  render();
}

/* ---------- wiring (runs once) ---------- */
let started = false;
function startApp() {
  if (started) return;
  started = true;
  let firstVisit = true;
  try { firstVisit = !localStorage.getItem(STORE_KEY); } catch (e) {}
  S = load();
  applyI18n();

  $('#toastUndo').addEventListener('click', () => { if (undoFn) { undoFn(); undoFn = null; } $('#toast').classList.add('hidden'); });
  $('#modal').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $('#modal').classList.contains('hidden')) {
      e.preventDefault();
      const map = { checklist: '#taskSearch', guests: '#guestSearch' };
      const el = $(map[S.ui.tab] || '#taskSearch'); if (el) el.focus();
    }
  });

  $$('.tab-btn').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  window.addEventListener('hashchange', () => setTab(location.hash.slice(1)));

  $('#weddingDate').addEventListener('change', e => { S.weddingDate = e.target.value; save(); renderDateNote(); renderCountdown(); toast(S.weddingDate ? tr('Wedding date saved') : tr('Date cleared')); });

  /* checklist */
  $('#taskList').addEventListener('click', e => {
    const card = e.target.closest('.task'); if (!card) return;
    const t = S.tasks.find(x => x.id === card.dataset.id); if (!t) return;
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'expand') {
      const more = $('.task-more', card); more.classList.toggle('hidden');
      e.target.closest('[data-act]').setAttribute('aria-expanded', String(!more.classList.contains('hidden')));
      return;
    }
    if (act === 'cycle') {
      const prev = t.status;
      t.status = STATUS_CYCLE[(STATUS_CYCLE.indexOf(t.status) + 1) % 3];
      save(); render();
      toast(`${t.id} → ${tr(t.status)}`, () => { t.status = prev; save(); render(); });
    }
    if (act === 'delete') {
      const idx = S.tasks.indexOf(t); S.tasks.splice(idx, 1); save(); render();
      toast(tr('Task deleted'), () => { S.tasks.splice(idx, 0, t); save(); render(); });
    }
  });
  $('#taskList').addEventListener('change', e => {
    const card = e.target.closest('.task'); if (!card) return;
    const t = S.tasks.find(x => x.id === card.dataset.id); if (!t) return;
    if (e.target.dataset.act === 'toggle') {
      const prev = t.status;
      t.status = e.target.checked ? 'Completed' : 'Not Started';
      save();
      if (t.status === 'Completed') { const ring = $('#ring').parentNode; ring.classList.remove('pop'); void ring.offsetWidth; ring.classList.add('pop'); }
      setTimeout(render, 180);
      toast(t.status === 'Completed' ? `${tr('Done')}: ${t.title.slice(0, 40)}${t.title.length > 40 ? '…' : ''}` : tr('Marked not started'), () => { t.status = prev; save(); render(); });
      return;
    }
    const f = e.target.dataset.field;
    if (f && f !== 'notes') { t[f] = e.target.value; save(); fillTaskFilters(); render(); toast(tr('Saved')); }
  });
  $('#taskList').addEventListener('input', e => {
    if (e.target.dataset.field !== 'notes') return;
    const t = S.tasks.find(x => x.id === e.target.closest('.task').dataset.id);
    t.notes = e.target.value; save();
  });
  $$('.view-btn').forEach(b => b.addEventListener('click', () => { S.ui.view = b.dataset.view; save(); renderTasks(); }));
  $('#taskSearch').addEventListener('input', e => { F.q = e.target.value; renderTasks(); });
  $('#fStream').addEventListener('change', e => { F.stream = e.target.value; renderTasks(); });
  $('#fOwner').addEventListener('change', e => { F.owner = e.target.value; renderTasks(); });
  $('#fStatus').addEventListener('change', e => { F.status = e.target.value; renderTasks(); });
  $('#fHideDone').addEventListener('change', e => { F.hideDone = e.target.checked; renderTasks(); });
  $$('#fPriority [data-p]').forEach(b => b.addEventListener('click', () => { const p = b.dataset.p; F.pri.has(p) ? F.pri.delete(p) : F.pri.add(p); renderTasks(); }));
  $('#btnClearFilters').addEventListener('click', () => {
    Object.assign(F, { q: '', stream: '', owner: '', status: '', hideDone: false }); F.pri.clear();
    $('#taskSearch').value = ''; fillTaskFilters(); renderTasks();
  });
  $('#btnAddTask').addEventListener('click', () => {
    const streams = [...new Set(S.tasks.map(t => t.stream))].sort();
    openModal(tr('New task'), `<form id="fNewTask" class="space-y-3 text-sm">
      <label class="block">${esc(tr('Task'))}<input name="title" class="field mt-1" required placeholder="${esc(tr('e.g. Book hair trial'))}"></label>
      <label class="block">${esc(tr('Details'))}<textarea name="details" class="field mt-1" rows="2"></textarea></label>
      <div class="grid grid-cols-2 gap-2">
        <label>${esc(tr('Deadline'))}<input type="date" name="due" class="field mt-1" required></label>
        <label>${esc(tr('Priority'))}<select name="priority" class="field mt-1">${options(PRIORITIES, 'High')}</select></label>
        <label>${esc(tr('Owner'))}<input name="owner" class="field mt-1" value="Couple" list="ownersList"></label>
        <label>${esc(tr('Workstream'))}<input name="stream" class="field mt-1" list="streamsList" value="Overall coordination"></label>
      </div>
      <datalist id="ownersList">${[...new Set(S.tasks.map(t => t.owner))].map(o => `<option value="${esc(o)}">`).join('')}</datalist>
      <datalist id="streamsList">${streams.map(o => `<option value="${esc(o)}">`).join('')}</datalist>
      <button class="w-full rounded-full bg-coral text-white py-2.5 font-semibold">${esc(tr('Add task'))}</button></form>`, body => {
      $('#fNewTask', body).addEventListener('submit', e => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target));
        const n = S.tasks.filter(t => t.custom).length + 1;
        S.tasks.push({ id: 'C' + String(n).padStart(3, '0') + uid().slice(0, 2).toUpperCase(), ...d, status: 'Not Started', notes: '', custom: true, milestone: false });
        save(); fillTaskFilters(); closeModal(); render(); toast(tr('Task added'));
      });
    });
  });

  /* budget */
  $('#potCards').addEventListener('change', e => {
    const id = e.target.dataset.potamt; if (!id) return;
    const p = S.pots.find(x => x.id === id); p.amount = Number(e.target.value) || 0; p.currency = 'NAD'; save(); render(); toast(tx(`${tr(p.name)} allocation updated`, `Valor da caixa ${tr(p.name)} atualizado`));
  });
  $('#quickExpense').addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    S.expenses.unshift({ id: uid(), item: d.item, vendor: '', pot: d.pot, category: d.category, estimate: Number(d.estimate) || 0, paid: 0, currency: d.currency, status: 'Estimate', due: '' });
    save(); e.target.item.value = ''; e.target.estimate.value = ''; e.target.item.focus(); render(); toast(tr('Expense added'));
  });
  $('#btnAddExpense').addEventListener('click', () => {
    openModal(tr('New expense'), `<form id="fNewExp" class="space-y-3 text-sm">
      <label class="block">${esc(tr('Item name'))}<input name="item" class="field mt-1" required placeholder="${esc(tr('e.g. Lagos venue hire'))}"></label>
      <label class="block">${esc(tr('Vendor or note'))}<input name="vendor" class="field mt-1"></label>
      <div class="grid grid-cols-2 gap-2">
        <label>${esc(tr('Pot'))}<select name="pot" class="field mt-1">${potOptions('ng')}</select></label>
        <label>${esc(tr('Category'))}<select name="category" class="field mt-1">${options(CATEGORIES, 'Venue')}</select></label>
        <label class="col-span-2">${esc(tr('Status'))}<select name="status" class="field mt-1">${options(EXP_STATUS, 'Quoted')}</select></label>
        <label>${esc(tr('Estimate'))}<input name="estimate" type="number" step="any" min="0" class="field mt-1" required></label>
        <label>${esc(tr('Paid so far'))}<input name="paid" type="number" step="any" min="0" class="field mt-1" value="0"></label>
        <label>${esc(tr('Currency'))}<select name="currency" class="field mt-1">${options(curList(), S.baseCurrency)}</select></label>
        <label>${esc(tr('Next payment due'))}<input name="due" type="date" class="field mt-1"></label>
      </div>
      <button class="w-full rounded-full bg-coral text-white py-2.5 font-semibold">${esc(tr('+ Add expense'))}</button></form>`, body => {
      $('#fNewExp', body).addEventListener('submit', e => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target));
        S.expenses.unshift({ id: uid(), ...d, estimate: Number(d.estimate) || 0, paid: Number(d.paid) || 0 });
        save(); closeModal(); render(); toast(tr('Expense added'));
      });
    });
  });
  $('#expenseRows').addEventListener('change', e => {
    const tr_ = e.target.closest('tr'); const x = S.expenses.find(v => v.id === tr_.dataset.id); const f = e.target.dataset.f; if (!x || !f) return;
    x[f] = ['estimate','paid'].includes(f) ? Number(e.target.value) || 0 : e.target.value;
    if (f === 'paid' && x.paid >= x.estimate && x.estimate > 0) x.status = 'Paid in full';
    else if (f === 'paid' && x.paid > 0 && x.status !== 'Paid in full') x.status = 'Deposit paid';
    save(); render();
  });
  $('#expenseRows').addEventListener('click', e => {
    if (!e.target.closest('[data-del]')) return;
    const id = e.target.closest('tr').dataset.id; const idx = S.expenses.findIndex(v => v.id === id); const [x] = S.expenses.splice(idx, 1);
    save(); render(); toast(tr('Expense deleted'), () => { S.expenses.splice(idx, 0, x); save(); render(); });
  });
  $('#fundRows').addEventListener('change', e => {
    const row = e.target.closest('[data-id]'); const f = S.funds.find(v => v.id === row.dataset.id); const k = e.target.dataset.f; if (!f || !k) return;
    f[k] = k === 'amount' ? Number(e.target.value) || 0 : e.target.value; save(); render();
  });
  $('#fundRows').addEventListener('click', e => {
    if (!e.target.closest('[data-del]')) return;
    const id = e.target.closest('[data-id]').dataset.id; const idx = S.funds.findIndex(v => v.id === id); const [x] = S.funds.splice(idx, 1);
    save(); render(); toast(tr('Fund removed'), () => { S.funds.splice(idx, 0, x); save(); render(); });
  });
  $('#btnAddFund').addEventListener('click', () => { S.funds.push({ id: uid(), source: tr('New source'), amount: 0, currency: S.baseCurrency }); save(); render(); const inputs = $$('#fundRows input[data-f="source"]'); inputs[inputs.length - 1]?.select(); });
  $('#catBars').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { bCat = bCat === b.dataset.cat ? '' : b.dataset.cat; renderBudget(); } });
  $('#bCatFilter').addEventListener('change', e => { bCat = e.target.value; renderBudget(); });
  $('#baseCur').addEventListener('change', e => { S.baseCurrency = e.target.value; save(); render(); });
  $('#rateRows').addEventListener('change', e => { const c = e.target.dataset.rate; if (!c) return; S.rates[c] = Number(e.target.value) || S.rates[c]; save(); render(); toast(tx(`${c} rate updated`, `Cotação de ${c} atualizada`)); });

  /* guests */
  $('#quickGuest').addEventListener('submit', e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); if (!d.name.trim()) return;
    addGuest(d); save(); e.target.name.value = ''; e.target.name.focus(); render(); toast(tx(`${d.name} added`, `${d.name} adicionado`));
  });
  $('#guestRows').addEventListener('change', e => {
    const row = e.target.closest('tr'); const g = S.guests.find(v => v.id === row.dataset.id); const f = e.target.dataset.f; if (!g || !f) return;
    g[f] = f === 'plusOnes' ? Math.max(0, Number(e.target.value) || 0) : e.target.value; save(); render();
  });
  $('#guestRows').addEventListener('click', e => {
    if (!e.target.closest('[data-del]')) return;
    const id = e.target.closest('tr').dataset.id; const idx = S.guests.findIndex(v => v.id === id); const [g] = S.guests.splice(idx, 1);
    save(); render(); toast(tx(`${g.name} removed`, `${g.name} removido`), () => { S.guests.splice(idx, 0, g); save(); render(); });
  });
  $$('.side-btn').forEach(b => b.addEventListener('click', () => { S.ui.side = b.dataset.side; save(); renderGuests(); }));
  $('#guestSearch').addEventListener('input', e => { G.q = e.target.value; renderGuests(); });
  $('#gRsvpFilter').addEventListener('change', e => { G.rsvp = e.target.value; renderGuests(); });
  $('#gDietFilter').addEventListener('change', e => { G.diet = e.target.value; renderGuests(); });
  $('#guestCards').addEventListener('click', e => { const b = e.target.closest('[data-diet]'); if (b) { G.diet = G.diet === b.dataset.diet ? '' : b.dataset.diet; renderGuests(); } });
  $('#btnBulkGuests').addEventListener('click', () => {
    openModal(tr('Paste a guest list'), `<form id="fBulk" class="space-y-3 text-sm">
      <p class="text-muted">${esc(tr('One guest per line. Optional extra columns separated by commas or tabs, in this order:'))} <b>${esc(tr('name, side, country, diet, plus ones'))}</b>. ${esc(tr('A copy from Excel or Google Sheets works.'))}</p>
      <textarea name="list" rows="8" class="field font-mono text-xs" aria-label="${esc(tr('Paste a guest list'))}" placeholder="Tejiri Akpokiniovo, Bride, Nigeria&#10;Maria Souza, Groom, Brazil, Vegetarian, 1"></textarea>
      <div class="grid grid-cols-2 gap-2"><label>${esc(tr('Default side'))}<select name="side" class="field mt-1">${options(SIDES, S.ui.side || 'Bride')}</select></label>
      <label>${esc(tr('Default country'))}<select name="country" class="field mt-1">${options(COUNTRIES, 'Nigeria')}</select></label></div>
      <button class="w-full rounded-full bg-coral text-white py-2.5 font-semibold">${esc(tr('Add guests'))}</button></form>`, body => {
      $('#fBulk', body).addEventListener('submit', e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
        const match = (v, list) => list.find(x => x.toLowerCase() === String(v || '').trim().toLowerCase());
        let n = 0;
        d.list.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
          const c = line.split(/\t|,/).map(s => s.trim());
          if (/^name$/i.test(c[0])) return;
          addGuest({ name: c[0], side: match(c[1], SIDES) || d.side, country: match(c[2], COUNTRIES) || d.country, diet: match(c[3], DIETS) || 'No restrictions', plusOnes: c[4] || 0 });
          n++;
        });
        save(); closeModal(); render(); toast(tx(`${n} guest${n === 1 ? '' : 's'} added`, `${n} convidado${n === 1 ? '' : 's'} adicionado${n === 1 ? '' : 's'}`));
      });
    });
  });

  /* documents */
  const BAD_LINK = 'Please paste a full link that starts with https';
  $('#quickDoc').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target.elements;
    const url = safeUrl(f.url.value);
    if (!url) { toast(tr(BAD_LINK)); f.url.focus(); return; }
    S.docs.push({ id: uid(), title: f.doctitle.value.trim() || tr(docKind(url)), url, note: f.note.value.trim() });
    save(); e.target.reset(); f.doctitle.focus(); render(); toast(tr('Document added'));
  });
  $('#docList').addEventListener('change', e => {
    const row = e.target.closest('[data-id]'); const d = S.docs.find(v => v.id === row.dataset.id); const k = e.target.dataset.f; if (!d || !k) return;
    if (k === 'url') {
      const u = safeUrl(e.target.value);
      if (!u) { toast(tr(BAD_LINK)); e.target.value = d.url; return; }
      d.url = u;
    } else { d[k] = e.target.value.trim(); }
    save(); render();
  });
  $('#docList').addEventListener('click', e => {
    if (!e.target.closest('[data-del]')) return;
    const id = e.target.closest('[data-id]').dataset.id; const idx = S.docs.findIndex(v => v.id === id); const [d] = S.docs.splice(idx, 1);
    save(); render(); toast(tx(`${d.title} removed`, `${d.title} removido`), () => { S.docs.splice(idx, 0, d); save(); render(); });
  });

  /* backup and data */
  $('#btnData').addEventListener('click', () => {
    openModal(tr('Backup and data'), `<div class="space-y-4 text-sm">
      <p class="text-muted">${esc(tr('Everything is saved automatically in this browser only. Make a backup to move your data to another device or share it with Kev.'))}</p>
      <div class="grid grid-cols-2 gap-2">
        <button class="rounded-xl border border-sand bg-white px-3 py-3 font-semibold hover:bg-ivory" data-exp="json">${esc(tr('Full backup (JSON)'))}</button>
        <button class="rounded-xl border border-sand bg-white px-3 py-3 font-semibold hover:bg-ivory" data-exp="tasks">${esc(tr('Tasks as CSV'))}</button>
        <button class="rounded-xl border border-sand bg-white px-3 py-3 font-semibold hover:bg-ivory" data-exp="guests">${esc(tr('Guests as CSV'))}</button>
        <button class="rounded-xl border border-sand bg-white px-3 py-3 font-semibold hover:bg-ivory" data-exp="budget">${esc(tr('Budget as CSV'))}</button>
      </div>
      <div id="expOut" class="hidden space-y-2">
        <textarea id="expText" rows="6" class="field font-mono text-[11px]" readonly aria-label="Export"></textarea>
        <div class="flex gap-2"><button id="expCopy" class="flex-1 rounded-full bg-ink text-cream py-2 font-semibold">${esc(tr('Copy'))}</button><button id="expDl" class="flex-1 rounded-full border border-sand py-2 font-semibold">${esc(tr('Download file'))}</button></div>
      </div>
      <hr class="border-sand">
      <div class="space-y-2">
        <div class="font-semibold">${esc(tr('Restore from backup'))}</div>
        <input type="file" id="impFile" accept=".json,application/json" class="text-xs" aria-label="${esc(tr('Restore from backup'))}">
        <textarea id="impText" rows="3" class="field font-mono text-[11px]" aria-label="${esc(tr('Restore from backup'))}" placeholder="${esc(tr('…or paste backup JSON here'))}"></textarea>
        <button id="impGo" class="w-full rounded-full bg-sea text-cream py-2 font-semibold">${esc(tr('Restore'))}</button>
      </div>
      <hr class="border-sand">
      <details><summary class="cursor-pointer text-coral-deep text-xs font-semibold">${esc(tr('Reset everything…'))}</summary>
        <p class="text-xs text-muted mt-2">${esc(tr('Type RESET to wipe guests, expenses and task progress and return to the original spreadsheet.'))}${SYNC ? ' ' + esc(tr('Sync is on, so this also resets the shared copy.')) : ''}</p>
        <div class="flex gap-2 mt-2"><input id="resetTxt" class="field" placeholder="RESET" aria-label="RESET"><button id="resetGo" class="rounded-full bg-coral text-white px-4 font-semibold">${esc(tr('Reset'))}</button></div>
      </details>
    </div>`, body => {
      let current = { name: '', text: '', type: '' };
      $$('[data-exp]', body).forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.exp; const stamp = new Date().toISOString().slice(0, 10);
        if (k === 'json') current = { name: `wedding-planner-backup-${stamp}.json`, text: JSON.stringify(S, null, 1), type: 'application/json' };
        if (k === 'tasks') current = { name: `wedding-tasks-${stamp}.csv`, text: toCSV(S.tasks, ['id','due','title','details','owner','priority','status','stream','notes']), type: 'text/csv' };
        if (k === 'guests') current = { name: `wedding-guests-${stamp}.csv`, text: toCSV(S.guests, ['name','side','country','event','rsvp','diet','plusOnes','notes']), type: 'text/csv' };
        if (k === 'budget') current = { name: `wedding-budget-${stamp}.csv`, text: toCSV(S.expenses, ['item','vendor','pot','category','estimate','paid','currency','status','due']), type: 'text/csv' };
        $('#expText', body).value = current.text; $('#expOut', body).classList.remove('hidden');
      }));
      $('#expCopy', body).addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(current.text); toast(tr('Copied')); }
        catch (e) { const t = $('#expText', body); t.select(); toast(tr('Selected: press Ctrl or Cmd + C')); }
      });
      $('#expDl', body).addEventListener('click', () => { tryDownload(current.name, current.text, current.type); toast(tr('If nothing downloaded, use Copy instead')); });
      $('#impFile', body).addEventListener('change', async e => { const f = e.target.files[0]; if (f) $('#impText', body).value = await f.text(); });
      $('#impGo', body).addEventListener('click', () => {
        try {
          const data = JSON.parse($('#impText', body).value);
          if (!data.tasks || !data.guests) throw new Error('bad');
          const prev = S; S = mergeState(data); save(); closeModal(); renderEverything();
          toast(tr('Backup restored'), () => { S = prev; save(); renderEverything(); });
        } catch (e) { toast(tr('That does not look like a planner backup')); }
      });
      $('#resetGo', body).addEventListener('click', () => {
        if ($('#resetTxt', body).value.trim() !== 'RESET') { toast(tr('Type RESET to confirm')); return; }
        const prev = S; S = freshState(); save(); closeModal(); renderEverything();
        toast(tr('Planner reset'), () => { S = prev; save(); renderEverything(); });
      });
    });
  });

  /* sync */
  $('#btnSync').addEventListener('click', () => openModal(tr('Sync between devices'), '<div id="syncPanel" class="space-y-3 text-sm"></div>', () => renderSyncPanel()));
  document.addEventListener('focusout', () => setTimeout(flushPending, 80));
  document.addEventListener('visibilitychange', () => { if (SYNC) syncNow(); });
  window.addEventListener('online', () => { if (SYNC) syncNow(); });
  window.addEventListener('offline', () => { if (SYNC) setSyncState('offline'); });
  setInterval(() => { if (SYNC && document.visibilityState === 'visible') syncNow(); }, 20000);

  /* language switch from the shared toggle (js/main.js sets html[data-lang]) */
  new MutationObserver(() => { renderEverything(); renderSyncPanel(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

  /* boot */
  renderEverything();
  setInterval(() => { renderCountdown(); flushPending(); }, 1000);
  // an invite link (#sync=CODE) connects this device, then the code is removed from the address bar
  const invite = location.hash.match(/^#sync=([A-Za-z0-9]{16,64})$/);
  if (invite) {
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    if (!SYNC) connectCode(invite[1], { silent: firstVisit });
    else if (SYNC.code !== invite[1]) toast(tr('This device already uses a different sync code. Turn that off first.'));
  }
  setTab(location.hash.slice(1) || S.ui.tab);
  if (SYNC) syncNow();
}

/* ---------- offline support (see planner/sw.js) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/planner/sw.js', { scope: '/planner/' }).catch(() => {}); });
}

const boot = () => startApp();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
