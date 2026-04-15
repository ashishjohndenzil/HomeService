/**
 * HomeService Location Autocomplete v4.0
 * Uses OpenStreetMap Nominatim API
 * Fixes: Works inside animated/transformed modals by using a RAF-based
 *        position loop while the dropdown is open, instead of relying on
 *        position:fixed which breaks when a CSS transform ancestor exists.
 */

(function () {
    // Inject Styles for Autocomplete
    const style = document.createElement('style');
    style.textContent = `
        .geo-suggestions-container {
            position: fixed;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.18);
            z-index: 2147483647;
            max-height: 260px;
            overflow-y: auto;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            display: none;
            box-sizing: border-box;
            min-width: 220px;
            pointer-events: auto;
        }
        .geo-suggestion-item {
            padding: 10px 14px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            color: #333;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            transition: background 0.15s;
        }
        .geo-suggestion-item:last-child {
            border-bottom: none;
        }
        .geo-suggestion-item:hover {
            background-color: #f0f9ff;
        }
        .geo-suggestion-icon {
            color: #3b82f6;
            font-size: 1.1em;
            margin-top: 2px;
            flex-shrink: 0;
        }
        .geo-suggestion-text {
            display: flex;
            flex-direction: column;
        }
        .geo-suggestion-main {
            font-weight: 600;
            color: #111827;
            line-height: 1.3;
        }
        .geo-suggestion-sub {
            font-size: 0.78em;
            color: #6b7280;
            margin-top: 2px;
            line-height: 1.3;
        }
        .geo-loading-item {
            padding: 12px 14px;
            color: #6b7280;
            font-size: 0.88em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .geo-loading-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #3b82f6;
            animation: geoDotBounce 0.8s infinite alternate;
        }
        .geo-loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .geo-loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes geoDotBounce {
            from { opacity: 0.3; transform: scale(0.7); }
            to   { opacity: 1;   transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);

    class LocationAutocomplete {
        constructor(inputEl) {
            // Accept either an element or an ID string
            this.input = (typeof inputEl === 'string')
                ? document.getElementById(inputEl)
                : inputEl;

            if (!this.input) return;

            // Prevent duplicates
            if (this.input.dataset.geoAttached === 'true') return;
            this.input.dataset.geoAttached = 'true';

            this.container = document.createElement('div');
            this.container.className = 'geo-suggestions-container';
            document.body.appendChild(this.container);

            this.debounceTimer = null;
            this.abortController = null;
            this._rafId = null;

            this._bindEvents();
        }

        _bindEvents() {
            this.input.addEventListener('input', () => this._handleInput());
            this.input.addEventListener('focus', () => { if (this.container.style.display !== 'none') this._startPositionLoop(); });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (e.target !== this.input && !this.container.contains(e.target)) {
                    this._hide();
                }
            }, true);

            // Reposition on all scroll events (including inside modal)
            window.addEventListener('scroll', () => this._updatePosition(), true);
            window.addEventListener('resize', () => this._updatePosition());
        }

        _handleInput() {
            clearTimeout(this.debounceTimer);
            const query = this.input.value.trim();

            if (query.length < 2) {   // trigger at 2+ chars
                this._hide();
                return;
            }

            // Show loading indicator immediately
            this._showLoading();

            this.debounceTimer = setTimeout(() => this._fetch(query), 380);
        }

        _showLoading() {
            this.container.innerHTML = `
                <div class="geo-loading-item">
                    <span class="geo-loading-dot"></span>
                    <span class="geo-loading-dot"></span>
                    <span class="geo-loading-dot"></span>
                    Searching…
                </div>`;
            this._show();
        }

        async _fetch(query) {
            if (this.abortController) this.abortController.abort();
            this.abortController = new AbortController();

            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6&countrycodes=in`;
                const res = await fetch(url, {
                    signal: this.abortController.signal,
                    headers: { 'Accept-Language': 'en' }
                });
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                this._render(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.container.innerHTML = '<div class="geo-loading-item">No results found. Try a more specific query.</div>';
                }
            }
        }

        _render(data) {
            this.container.innerHTML = '';

            if (!data || data.length === 0) {
                this.container.innerHTML = '<div class="geo-loading-item">No results found for that location.</div>';
                this._show();
                return;
            }

            data.forEach(item => {
                const parts = item.display_name.split(',');
                const main = parts[0].trim();
                const sub = parts.slice(1, 4).join(',').trim();  // show up to 3 sub parts

                const el = document.createElement('div');
                el.className = 'geo-suggestion-item';
                el.innerHTML = `
                    <span class="geo-suggestion-icon">📍</span>
                    <div class="geo-suggestion-text">
                        <span class="geo-suggestion-main">${main}</span>
                        <span class="geo-suggestion-sub">${sub}</span>
                    </div>
                `;
                el.addEventListener('mousedown', (e) => {
                    e.preventDefault();  // prevent input blur before click registers
                    this.input.value = item.display_name;
                    this._hide();
                    this.input.dispatchEvent(new Event('change', { bubbles: true }));
                    this.input.focus();
                });
                this.container.appendChild(el);
            });

            this._show();
        }

        _show() {
            this.container.style.display = 'block';
            this._updatePosition();
            this._startPositionLoop();
        }

        _hide() {
            this.container.style.display = 'none';
            this._stopPositionLoop();
        }

        // RAF loop keeps position correct while modal is animating / scrolling
        _startPositionLoop() {
            this._stopPositionLoop();
            const tick = () => {
                if (this.container.style.display === 'none') return;
                this._updatePosition();
                this._rafId = requestAnimationFrame(tick);
            };
            this._rafId = requestAnimationFrame(tick);
            // Stop the constant loop after 1 second (animation is done), 
            // rely on scroll/resize events afterwards
            setTimeout(() => this._stopPositionLoop(), 1000);
        }

        _stopPositionLoop() {
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
        }

        _updatePosition() {
            if (this.container.style.display === 'none') return;

            const rect = this.input.getBoundingClientRect();

            // If the input is offscreen / in a hidden container, hide dropdown
            if (rect.width === 0 && rect.height === 0) {
                this.container.style.display = 'none';
                return;
            }

            const spaceBelow = window.innerHeight - rect.bottom;
            const dropH = Math.min(260, this.container.scrollHeight || 260);

            if (spaceBelow >= dropH || spaceBelow >= 120) {
                // Place below
                this.container.style.top = (rect.bottom + 4) + 'px';
                this.container.style.left = rect.left + 'px';
                this.container.style.width = rect.width + 'px';
                this.container.style.bottom = 'auto';
            } else {
                // Place above
                this.container.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
                this.container.style.top = 'auto';
                this.container.style.left = rect.left + 'px';
                this.container.style.width = rect.width + 'px';
            }
        }
    }

    // ---- Global init function ----
    // Accepts either an element ID (string) or a DOM element
    window.initLocationAutocomplete = function (inputRef) {
        // Small delay to allow dynamic DOM injection to settle
        setTimeout(() => {
            const el = (typeof inputRef === 'string')
                ? document.getElementById(inputRef)
                : inputRef;

            if (!el) {
                console.warn('[LocationAutocomplete] Element not found:', inputRef);
                return;
            }
            new LocationAutocomplete(el);
        }, 150);
    };

    // Auto-init any element with data-geo-autocomplete="true" on the page
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-geo-autocomplete]').forEach(el => {
            new LocationAutocomplete(el);
        });
    });
})();
