/**
 * Dra. Adriana Mendoza Orozco · Ortodoncia en Madrid
 * Reusable Before & After Comparison Slider (Left: ANTES / Right: DESPUÉS)
 */

(function () {
  'use strict';

  function initBeforeAfterSliders() {
    const sliders = document.querySelectorAll('.ba-slider-container');

    sliders.forEach((container) => {
      const handle = container.querySelector('.ba-handle');
      const overlay = container.querySelector('.ba-img-before-overlay');
      const overlayImg = overlay ? overlay.querySelector('img') : null;

      if (!handle || !overlay) return;

      let isMoving = false;

      function updateSliderPosition(xPos) {
        const rect = container.getBoundingClientRect();
        let posX = xPos - rect.left;

        // Clamp boundaries (5% to 95%)
        posX = Math.max(rect.width * 0.05, Math.min(rect.width * 0.95, posX));

        const percentage = (posX / rect.width) * 100;
        overlay.style.width = `${percentage}%`;
        handle.style.left = `${percentage}%`;

        // Ensure overlaid image keeps container's full width for 1:1 pixel alignment
        if (overlayImg) {
          overlayImg.style.width = `${rect.width}px`;
        }
      }

      function onPointerDown(e) {
        isMoving = true;
        updateSliderPosition(e.pageX || (e.touches && e.touches[0].pageX));
        document.body.style.userSelect = 'none';
      }

      function onPointerMove(e) {
        if (!isMoving) return;
        const pageX = e.pageX || (e.touches && e.touches[0].pageX);
        if (pageX) updateSliderPosition(pageX);
      }

      function onPointerUp() {
        isMoving = false;
        document.body.style.userSelect = '';
      }

      // Mouse Events
      container.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      // Touch Events (Mobile/Tablet)
      container.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);

      // Window resize re-align
      window.addEventListener('resize', () => {
        if (overlayImg) {
          overlayImg.style.width = `${container.clientWidth}px`;
        }
      });

      // Initial alignment
      if (overlayImg) {
        overlayImg.style.width = `${container.clientWidth}px`;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBeforeAfterSliders);
  } else {
    initBeforeAfterSliders();
  }
})();
