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
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('is-hidden');
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

  // Desplegable "Agendar" en Ceremonia y Fiesta (Apple/Google/Office365/Outlook/Outlook.com/Yahoo)
  function pad(n) { return String(n).padStart(2, '0'); }
  function aUTC(date) {
    return date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) + 'T' +
      pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + pad(date.getUTCSeconds()) + 'Z';
  }
  function construirIcs({ title, start, end, location, desc }) {
    const escapar = s => String(s || '').replace(/,/g, '\\,').replace(/;/g, '\\;');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Juan y Natalia//Boda//ES', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@juanynatalia',
      'DTSTAMP:' + aUTC(new Date()),
      'DTSTART:' + aUTC(start),
      'DTEND:' + aUTC(end),
      'SUMMARY:' + escapar(title),
      'DESCRIPTION:' + escapar(desc),
      'LOCATION:' + escapar(location),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
  }
  document.querySelectorAll('.agendar').forEach(box => {
    const title = box.dataset.title;
    const start = new Date(box.dataset.start);
    const end = new Date(box.dataset.end);
    const location = box.dataset.location;
    const desc = box.dataset.desc || '';
    const s = aUTC(start), e = aUTC(end);

    const google = box.querySelector('[data-provider="google"]');
    if (google) google.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${s}/${e}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;

    const yahoo = box.querySelector('[data-provider="yahoo"]');
    if (yahoo) yahoo.href = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(title)}&st=${s}&et=${e}&desc=${encodeURIComponent(desc)}&in_loc=${encodeURIComponent(location)}`;

    const office365 = box.querySelector('[data-provider="office365"]');
    if (office365) office365.href = `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(location)}&body=${encodeURIComponent(desc)}`;

    const outlookcom = box.querySelector('[data-provider="outlookcom"]');
    if (outlookcom) outlookcom.href = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(location)}&body=${encodeURIComponent(desc)}`;

    box.querySelectorAll('[data-provider="ics"]').forEach(icsEl => {
      icsEl.addEventListener('click', ev => {
        ev.preventDefault();
        const blob = new Blob([construirIcs({ title, start, end, location, desc })], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'evento-boda.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        box.classList.remove('is-open');
      });
    });

    box.querySelectorAll('.agendar__opt:not([data-provider="ics"])').forEach(opt => {
      opt.addEventListener('click', () => box.classList.remove('is-open'));
    });

    box.querySelector('.agendar__btn').addEventListener('click', () => {
      document.querySelectorAll('.agendar.is-open').forEach(otro => { if (otro !== box) otro.classList.remove('is-open'); });
      box.classList.toggle('is-open');
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.agendar')) {
      document.querySelectorAll('.agendar.is-open').forEach(b => b.classList.remove('is-open'));
    }
  });

  document.getElementById('openCancion').addEventListener('click', () => openModal('cancionModal'));
  document.getElementById('openRegalos').addEventListener('click', () => openModal('regalosModal'));

  // Asistente paso a paso para Confirmar Asistencia
  const INVITADOS = ['Nombre Invitado 1', 'Nombre Invitado 2', 'Nombre Invitado 3'];
  const wizardInvitadosEl = document.getElementById('wizardInvitados');
  const wizardNombreHidden = document.getElementById('wizardNombreHidden');
  const wizardNombreLibre = document.getElementById('wizardNombreLibre');
  const wizardOtroBtn = document.getElementById('wizardOtroBtn');
  const wizardError = document.getElementById('wizardError');
  const wizardAnteriorBtn = document.getElementById('wizardAnterior');
  const wizardSiguienteBtn = document.getElementById('wizardSiguiente');
  const wizardEnviarBtn = document.getElementById('wizardEnviar');
  const wizardTotalPasos = document.querySelectorAll('.wizard-paso').length;
  let wizardPasoActual = 1;

  INVITADOS.forEach(nombre => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'wizard-pill';
    pill.textContent = nombre;
    pill.addEventListener('click', () => {
      document.querySelectorAll('.wizard-pill').forEach(p => p.classList.remove('is-seleccionado'));
      pill.classList.add('is-seleccionado');
      wizardNombreHidden.value = nombre;
      wizardNombreLibre.classList.add('is-oculto');
      wizardNombreLibre.value = '';
    });
    wizardInvitadosEl.appendChild(pill);
  });

  wizardOtroBtn.addEventListener('click', () => {
    document.querySelectorAll('.wizard-pill').forEach(p => p.classList.remove('is-seleccionado'));
    wizardNombreLibre.classList.remove('is-oculto');
    wizardNombreLibre.focus();
  });
  wizardNombreLibre.addEventListener('input', () => {
    wizardNombreHidden.value = wizardNombreLibre.value.trim();
  });

  function wizardMostrarPaso(n) {
    document.querySelectorAll('.wizard-paso').forEach(p => p.classList.remove('is-activo'));
    document.querySelector(`.wizard-paso[data-paso="${n}"]`).classList.add('is-activo');
    wizardAnteriorBtn.style.display = n === 1 ? 'none' : 'inline-flex';
    wizardSiguienteBtn.style.display = n === wizardTotalPasos ? 'none' : 'inline-flex';
    wizardEnviarBtn.style.display = n === wizardTotalPasos ? 'inline-flex' : 'none';
    wizardError.classList.remove('is-visible');
  }

  function wizardValidarPaso(n) {
    if (n === 1) return !!wizardNombreHidden.value;
    if (n === 2) return !!document.querySelector('input[name=ceremonia]:checked');
    if (n === 3) return !!document.querySelector('input[name=fiesta]:checked');
    return true;
  }

  wizardSiguienteBtn.addEventListener('click', () => {
    if (!wizardValidarPaso(wizardPasoActual)) {
      wizardError.textContent = 'Por favor completa este campo para continuar';
      wizardError.classList.add('is-visible');
      return;
    }
    wizardPasoActual++;
    wizardMostrarPaso(wizardPasoActual);
  });
  wizardAnteriorBtn.addEventListener('click', () => {
    wizardPasoActual--;
    wizardMostrarPaso(wizardPasoActual);
  });

  function wizardReset() {
    wizardPasoActual = 1;
    wizardMostrarPaso(1);
    document.querySelectorAll('.wizard-pill').forEach(p => p.classList.remove('is-seleccionado'));
    document.querySelectorAll('#rsvpForm input[type=radio]').forEach(r => r.checked = false);
    wizardNombreHidden.value = '';
    wizardNombreLibre.value = '';
    wizardNombreLibre.classList.add('is-oculto');
    document.getElementById('rsvpThanks').classList.remove('is-visible');
  }

  document.getElementById('openRsvp').addEventListener('click', () => {
    wizardReset();
    openModal('rsvpModal');
  });

  document.getElementById('rsvpForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!wizardValidarPaso(wizardPasoActual)) return;
    enviarDatos('confirmacion', e.target);
    document.getElementById('rsvpThanks').classList.add('is-visible');
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

});
