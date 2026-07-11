document.addEventListener('DOMContentLoaded', () => {

  const vistaLogin = document.getElementById('vistaLogin');
  const vistaPanel = document.getElementById('vistaPanel');
  const vistaSinConfig = document.getElementById('vistaSinConfig');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    vistaLogin.style.display = 'none';
    vistaSinConfig.style.display = 'flex';
    return;
  }

  const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let confirmaciones = [];
  let canciones = [];

  function mostrarPanel() {
    vistaLogin.style.display = 'none';
    vistaPanel.style.display = 'block';
    cargarDatos();
  }
  function mostrarLogin() {
    vistaPanel.style.display = 'none';
    vistaLogin.style.display = 'flex';
  }

  // Si ya hay sesión guardada, entrar directo
  db.auth.getSession().then(({ data }) => {
    if (data.session) mostrarPanel();
  });

  document.getElementById('formLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const error = document.getElementById('loginError');
    error.style.display = 'none';
    const { error: err } = await db.auth.signInWithPassword({
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPass').value
    });
    if (err) { error.style.display = 'block'; return; }
    mostrarPanel();
  });

  document.getElementById('btnSalir').addEventListener('click', async () => {
    await db.auth.signOut();
    mostrarLogin();
  });

  document.getElementById('btnActualizar').addEventListener('click', cargarDatos);

  async function cargarDatos() {
    const [conf, canc] = await Promise.all([
      db.from('confirmaciones').select('*').order('creado', { ascending: false }),
      db.from('canciones').select('*').order('creado', { ascending: false })
    ]);
    confirmaciones = conf.data || [];
    canciones = canc.data || [];
    pintarEstadisticas();
    pintarTablas();
  }

  function pintarEstadisticas() {
    document.getElementById('stTotal').textContent = confirmaciones.length;
    document.getElementById('stCeremonia').textContent = confirmaciones.filter(c => c.ceremonia === 'si').length;
    document.getElementById('stFiesta').textContent = confirmaciones.filter(c => c.fiesta === 'si').length;
    document.getElementById('stNo').textContent = confirmaciones.filter(c => c.ceremonia === 'no' && c.fiesta === 'no').length;
    document.getElementById('stCanciones').textContent = canciones.length;
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fecha = iso => new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  const asiste = v => v === 'si' ? '<span class="si">Sí</span>' : v === 'no' ? '<span class="no">No</span>' : '—';

  function pintarTablas() {
    const tc = document.getElementById('tbodyConfirmaciones');
    tc.innerHTML = confirmaciones.length === 0
      ? '<tr><td class="vacio" colspan="6">Sin datos todavía</td></tr>'
      : confirmaciones.map(c => `<tr>
          <td>${fecha(c.creado)}</td>
          <td><strong>${esc(c.nombre)}</strong></td>
          <td>${asiste(c.ceremonia)}</td>
          <td>${asiste(c.fiesta)}</td>
          <td>${esc(c.restricciones) || '—'}</td>
          <td>${esc(c.mensaje) || '—'}</td>
        </tr>`).join('');

    const tk = document.getElementById('tbodyCanciones');
    tk.innerHTML = canciones.length === 0
      ? '<tr><td class="vacio" colspan="4">Sin datos todavía</td></tr>'
      : canciones.map(c => `<tr>
          <td>${fecha(c.creado)}</td>
          <td><strong>${esc(c.nombre)}</strong></td>
          <td>${esc(c.cancion)}</td>
          <td>${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener">Abrir</a>` : '—'}</td>
        </tr>`).join('');
  }

  document.getElementById('btnExportar').addEventListener('click', () => {
    const filas = [['Fecha', 'Nombre', 'Ceremonia', 'Fiesta', 'Restricciones', 'Mensaje']];
    confirmaciones.forEach(c => filas.push([
      fecha(c.creado), c.nombre, c.ceremonia, c.fiesta, c.restricciones || '', c.mensaje || ''
    ]));
    const csv = filas.map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'confirmaciones-boda.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

});
