// Beautiful toast notification system
(function() {
  // Inject toast styles once
  const style = document.createElement('style');
  style.textContent = `
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toast {
      min-width: 300px;
      max-width: 400px;
      padding: 16px 20px;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      transform: translateX(450px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      border-left: 5px solid #6366f1;
    }
    .toast.show {
      transform: translateX(0);
      opacity: 1;
    }
    .toast.hide {
      transform: translateX(450px);
      opacity: 0;
    }
    .toast-icon {
      font-size: 22px;
      flex-shrink: 0;
      animation: toastPulse 0.6s ease;
    }
    @keyframes toastPulse {
      0% { transform: scale(0.5); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    .toast-success { border-left-color: #10b981; }
    .toast-success .toast-icon { color: #10b981; }
    .toast-error { border-left-color: #ef4444; }
    .toast-error .toast-icon { color: #ef4444; }
    .toast-info { border-left-color: #6366f1; }
    .toast-info .toast-icon { color: #6366f1; }
    .toast.shake {
      animation: toastShake 0.4s ease;
    }
    @keyframes toastShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);

  // Create container
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);

  // Sound effect (short beep using Web Audio API)
  function playSound(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.08;
      if (type === 'success') {
        osc.frequency.value = 880;
        osc.type = 'sine';
      } else if (type === 'error') {
        osc.frequency.value = 220;
        osc.type = 'square';
      } else {
        osc.frequency.value = 660;
        osc.type = 'sine';
      }
      osc.start();
      setTimeout(() => osc.stop(), 150);
    } catch (e) { /* ignore if audio blocked */ }
  }

  window.showToast = function(message, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Play sound
    playSound(type);

    // Shake on error
    if (type === 'error') {
      setTimeout(() => toast.classList.add('shake'), 400);
    }

    // Auto-dismiss after 3.5s
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  };
})();