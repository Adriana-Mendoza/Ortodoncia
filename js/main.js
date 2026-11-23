/**
 * Dra. Adriana Mendoza Orozco · Ortodoncia en Madrid
 * Global Navigation, Mobile Menu, Map & Accordion Interactivity
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileDrawer = document.getElementById('mobileNavDrawer');

    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener('click', () => {
        const isOpen = mobileDrawer.classList.toggle('is-open');
        mobileToggle.setAttribute('aria-expanded', isOpen);
        mobileToggle.textContent = isOpen ? '✕' : '☰';
      });

      // Close drawer on link click
      mobileDrawer.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          mobileDrawer.classList.remove('is-open');
          mobileToggle.setAttribute('aria-expanded', 'false');
          mobileToggle.textContent = '☰';
        });
      });
    }

    // 2. Interactive Map Embed
    const btnShowMap = document.getElementById('btnShowInteractiveMap');
    const mapContainer = document.getElementById('mapInteractiveContainer');
    const mapFrame = document.getElementById('mapInteractiveFrame');

    if (btnShowMap && mapContainer && mapFrame) {
      btnShowMap.addEventListener('click', () => {
        const isHidden = mapContainer.style.display === 'none' || !mapContainer.style.display;
        if (isHidden) {
          mapFrame.src = 'https://maps.google.com/maps?q=Paseo+del+Marqu%C3%A9s+de+Zafra+15+28028+Madrid&t=&z=16&ie=UTF8&iwloc=&output=embed';
          mapContainer.style.display = 'block';
          btnShowMap.textContent = 'Ocultar mapa interactivo';
        } else {
          mapContainer.style.display = 'none';
          btnShowMap.textContent = 'Ver ubicación en Google Maps ↗';
        }
      });
    }

    // 3. FAQ Accordions
    const accordionTriggers = document.querySelectorAll('.faq-accordion-trigger');
    accordionTriggers.forEach((btn) => {
      btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        const icon = btn.querySelector('.accordion-icon');
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        btn.setAttribute('aria-expanded', !isOpen);
        if (body) {
          body.style.display = isOpen ? 'none' : 'block';
        }
        if (icon) {
          icon.textContent = isOpen ? '＋' : '－';
        }
      });
    });
  });
})();
