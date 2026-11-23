/**
 * Dra. Adriana Mendoza Orozco · Ortodoncia en Madrid
 * Appointment Booking & Dynamic WhatsApp Conversion Funnel
 */

(function () {
  'use strict';

  function initBookingWidget() {
    const bookingForm = document.getElementById('quickBookingForm');
    const waFunnelBtn = document.getElementById('waFunnelBtn');
    const selectTreatment = document.getElementById('bookingTreatment');
    const selectSlot = document.getElementById('bookingSlot');
    const inputDate = document.getElementById('bookingDate');

    // Default min date to tomorrow
    if (inputDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      inputDate.min = `${yyyy}-${mm}-${dd}`;
    }

    // Dynamic WhatsApp Funnel Link Updater
    function updateWhatsAppUrl() {
      if (!waFunnelBtn) return;
      const treatment = selectTreatment ? selectTreatment.value : 'Ortodoncia';
      const slot = selectSlot ? selectSlot.value : 'Sin preferencia';
      const dateVal = inputDate && inputDate.value ? inputDate.value : 'próximos días';

      const baseText = `Hola Dra. Adriana Mendoza. Quisiera solicitar mi primera cita de valoración de ${treatment} en Centro Médico Caduceo (Madrid) para la fecha aproximada de ${dateVal} en horario ${slot}.`;
      const encoded = encodeURIComponent(baseText);
      waFunnelBtn.href = `https://wa.me/34679623610?text=${encoded}`;
    }

    if (selectTreatment) selectTreatment.addEventListener('change', updateWhatsAppUrl);
    if (selectSlot) selectSlot.addEventListener('change', updateWhatsAppUrl);
    if (inputDate) inputDate.addEventListener('change', updateWhatsAppUrl);
    updateWhatsAppUrl();

    // Form Submission Handling
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('bookingName');
        const email = document.getElementById('bookingEmail');
        const consent = document.getElementById('bookingConsent');
        const feedbackBox = document.getElementById('bookingFeedback');

        if (!name || !name.value.trim()) {
          alert('Por favor, indica tu nombre completo.');
          if (name) name.focus();
          return;
        }

        if (!email || !email.value.includes('@')) {
          alert('Por favor, indica un correo electrónico válido.');
          if (email) email.focus();
          return;
        }

        if (!consent || !consent.checked) {
          alert('Es necesario aceptar la política de privacidad para gestionar la cita.');
          if (consent) consent.focus();
          return;
        }

        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Procesando cita...';
        }

        setTimeout(() => {
          bookingForm.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmar Cita de Valoración ↗';
          }
          if (feedbackBox) {
            feedbackBox.style.display = 'block';
            feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 800);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookingWidget);
  } else {
    initBookingWidget();
  }
})();
