// Envía las respuestas de los formularios a Supabase vía funciones RPC
function enviarDatos(tipo, formEl) {
  const datos = Object.fromEntries(new FormData(formEl).entries());
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase no configurado (js/config.js); la respuesta no se guardó:', datos);
    return Promise.resolve(false);
  }
  const funcion = tipo === 'cancion' ? 'sugerir_cancion' : 'confirmar_asistencia';
  const body = tipo === 'cancion'
    ? { p_nombre: datos.nombre, p_cancion: datos.cancion, p_link: datos.link || null }
    : { p_nombre: datos.nombre, p_ceremonia: datos.ceremonia, p_fiesta: datos.fiesta,
        p_restricciones: datos.restricciones || null, p_mensaje: datos.mensaje || null };
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcion}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then(r => r.ok).catch(() => false);
}

window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('is-hidden');
  }, 1200);
});

document.addEventListener('DOMContentLoaded', () => {

  const musicModal = document.getElementById('musicModal');
  const bgMusic = document.getElementById('bgMusic');
  const musicFab = document.getElementById('musicFab');

  function playMusic() {
    bgMusic.play().then(() => musicFab.classList.add('is-playing')).catch(() => {});
  }
  function pauseMusic() {
    bgMusic.pause();
    musicFab.classList.remove('is-playing');
  }

  document.getElementById('enterWithMusic').addEventListener('click', () => {
    playMusic();
    musicModal.classList.add('is-hidden');
  });
  document.getElementById('enterWithoutMusic').addEventListener('click', () => {
    musicModal.classList.add('is-hidden');
  });
  musicFab.addEventListener('click', () => {
    if (bgMusic.paused) playMusic(); else pauseMusic();
  });

  const countdownEl = document.getElementById('countdown');
  const targetDate = new Date(countdownEl.dataset.weddingDate).getTime();
  const els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    min: document.getElementById('cd-min'),
    sec: document.getElementById('cd-sec'),
  };
  function updateCountdown() {
    const diff = targetDate - Date.now();
    if (diff <= 0) {
      els.days.textContent = els.hours.textContent = els.min.textContent = els.sec.textContent = '00';
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    els.days.textContent = String(days).padStart(2, '0');
    els.hours.textContent = String(hours).padStart(2, '0');
    els.min.textContent = String(min).padStart(2, '0');
    els.sec.textContent = String(sec).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  function openModal(id) {
    document.getElementById(id).classList.add('is-open');
  }
  function closeModal(modalEl) {
    modalEl.classList.remove('is-open');
  }
  document.querySelectorAll('.js-open-modal').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modal));
  });
  document.querySelectorAll('.js-close-modal').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  });

  document.getElementById('openRsvp').addEventListener('click', () => openModal('rsvpModal'));
  document.getElementById('openCancion').addEventListener('click', () => openModal('cancionModal'));
  document.getElementById('openRegalos').addEventListener('click', () => openModal('regalosModal'));

  document.getElementById('rsvpForm').addEventListener('submit', e => {
    e.preventDefault();
    enviarDatos('confirmacion', e.target);
    document.getElementById('rsvpThanks').classList.add('is-visible');
    e.target.reset();
    setTimeout(() => closeModal(document.getElementById('rsvpModal')), 2000);
  });

  document.getElementById('cancionForm').addEventListener('submit', e => {
    e.preventDefault();
    enviarDatos('cancion', e.target);
    document.getElementById('cancionThanks').classList.add('is-visible');
    e.target.reset();
    setTimeout(() => closeModal(document.getElementById('cancionModal')), 2000);
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  document.querySelectorAll('.js-lightbox').forEach(item => {
    item.addEventListener('click', () => {
      const bg = item.style.backgroundImage.slice(5, -2);
      lightboxImg.src = bg;
      lightbox.classList.add('is-open');
    });
  });
  document.querySelector('.js-close-lightbox').addEventListener('click', () => {
    lightbox.classList.remove('is-open');
  });
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('is-open'); });

  document.querySelectorAll('.js-agendar').forEach(btn => {
    btn.addEventListener('click', () => {
      const { title, start, end, location } = btn.dataset;
      const fmt = d => d.replace(/[-:]/g, '').replace('.000', '');
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&location=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    });
  });

});
