/**
 * Dra. Adriana Mendoza Orozco · Ortodoncia en Madrid
 * Global Navigation, Shared Footer Loader, Mobile Menu, Map, Accordion & Image Protection
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // 0. Load Shared Footer (footer.html)
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      fetch('footer.html')
        .then((response) => {
          if (!response.ok) throw new Error('Error al cargar footer.html');
          return response.text();
        })
        .then((html) => {
          footerPlaceholder.outerHTML = html;
        })
        .catch((err) => {
          console.error('No se pudo cargar el pie de página común:', err);
        });
    }

    // 1. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileDrawer = document.getElementById('mobileNavDrawer') || document.getElementById('mobileDrawer');

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

    // 3. FAQ Collapsible Accordions (Preguntas Frecuentes)
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach((btn) => {
      btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        const icon = btn.querySelector('.faq-icon-sign');
        const isOpen = body.classList.contains('is-open');

        if (isOpen) {
          body.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          if (icon) icon.textContent = '＋';
        } else {
          body.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          if (icon) icon.textContent = '－';
        }
      });
    });

    // 4. Protección disuasoria de imágenes, logos y lienzo 3D (Clic derecho y arrastre)
    const protectedContainers = [
      'img',
      'canvas',
      '.header-brand',
      '.hero-image-wrap',
      '.treatment-card-img-wrap',
      '.ba-slider-container',
      '.canvas-3d-container',
      '.facility-vertical-card',
      '.footer-brand-col'
    ].join(', ');

    document.addEventListener('contextmenu', (e) => {
      if (e.target && e.target.closest && e.target.closest(protectedContainers)) {
        e.preventDefault();
      }
    });

    document.addEventListener('dragstart', (e) => {
      if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'CANVAS')) {
        e.preventDefault();
      }
    });
  });
})();
