/**
 * Dra. Adriana Mendoza Orozco · Ortodoncia en Madrid
 * Global Navigation, Shared Footer Loader, Mobile Menu, Map, Accordion & Full Image Protection
 */

(function () {
  'use strict';

  function applyMediaProtection(root) {
    const scope = root || document;
    scope.querySelectorAll('img, canvas').forEach((el) => {
      el.setAttribute('draggable', 'false');
      el.style.userSelect = 'none';
      el.style.webkitUserSelect = 'none';
      el.style.webkitUserDrag = 'none';
      el.style.webkitTouchCallout = 'none';
    });
  }

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
          const loadedFooter = document.querySelector('footer.site-footer');
          if (loadedFooter) applyMediaProtection(loadedFooter);
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

    // 4. Protección total de imágenes, logos y lienzo 3D por coordenadas (PC y Móvil)
    applyMediaProtection(document);

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
        return;
      }

      const x = e.clientX;
      const y = e.clientY;
      const mediaElements = document.querySelectorAll('img, canvas');
      for (let i = 0; i < mediaElements.length; i++) {
        const el = mediaElements[i];
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 &&
            x >= rect.left && x <= rect.right &&
            y >= rect.top && y <= rect.bottom) {
          e.preventDefault();
          return;
        }
      }
    });

    document.addEventListener('dragstart', (e) => {
      if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'CANVAS')) {
        e.preventDefault();
      }
    });
  });
})();
