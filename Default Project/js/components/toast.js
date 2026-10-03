/**
 * High-end neon toast notification system
 */

export class ToastManager {
    constructor() {
        this.container = document.querySelector('.toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a beautiful glassmorphic toast notification
     * @param {string} message - Notification text
     * @param {'success' | 'info' | 'warning' | 'error'} type - Style type
     * @param {number} duration - Time to live in ms
     */
    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'info-circle';
        let color = 'var(--accent)';
        if (type === 'success') {
            icon = 'check-circle';
            color = '#39ff14';
        } else if (type === 'warning') {
            icon = 'exclamation-triangle';
            color = '#ffb300';
        } else if (type === 'error') {
            icon = 'exclamation-circle';
            color = '#ff3b30';
        }

        toast.style.borderLeftColor = color;
        toast.innerHTML = `
            <i class="fas fa-${icon}" style="color: ${color}; font-size: 1.1rem; text-shadow: 0 0 10px ${color}55;"></i>
            <div style="flex-grow: 1; font-weight: 500;">${message}</div>
            <button class="toast-close" style="background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: color 0.2s;">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Click close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        // Play feedback sound if enabled
        this._playFeedbackSound(type);
    }

    remove(toast) {
        if (toast.classList.contains('removing')) return;
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }

    _playFeedbackSound(type) {
        // Safe play Web Audio API sound (if settings allow)
        try {
            const audioFeedback = localStorage.getItem('hub_audio_feedback') !== 'false';
            if (!audioFeedback) return;

            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'success') {
                // Happy high double beep
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08, now + 0.08); // E5
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'error') {
                // Lower descending warning buzz
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(120, now + 0.2);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            } else {
                // Subtle standard UI blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now); // A4
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            // Audio context not initialized or blocked
        }
    }
}
export const toast = new ToastManager();
export default toast;
