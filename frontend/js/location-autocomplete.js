/**
 * HomeService Location Autocomplete v3.0
 * Uses OpenStreetMap Nominatim API
 * Consolidated from booking.js and location-autocomplete.js
 */

(function () {
    // Inject Styles for Autocomplete
    const style = document.createElement('style');
    style.textContent = `
        .geo-suggestions-container {
            position: fixed;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 2147483647; /* Max Z-Index */
            max-height: 250px;
            overflow-y: auto;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            display: none;
            box-sizing: border-box;
            width: auto;
            min-width: 250px;
        }
        .geo-suggestion-item {
            padding: 10px 14px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .geo-suggestion-item:hover {
            background-color: #f0f9ff;
        }
        .geo-suggestion-icon {
            color: #3b82f6; 
            font-size: 1.1em;
        }
        .geo-suggestion-text {
            display: flex;
            flex-direction: column;
        }
        .geo-suggestion-main {
            font-weight: 600;
            color: #111827;
        }
        .geo-suggestion-sub {
            font-size: 0.8em;
            color: #6b7280;
        }
    `;
    document.head.appendChild(style);

    class LocationAutocomplete {
        constructor(inputId) {
            this.input = document.getElementById(inputId);
            if (!this.input) return;

            // Prevent duplicates
            if (this.input.dataset.autocompleteAttached === 'true') return;
            this.input.dataset.autocompleteAttached = 'true';

            this.container = document.createElement('div');
            this.container.className = 'geo-suggestions-container';
            document.body.appendChild(this.container);

            this.debounceTimer = null;
            this.abortController = null;

            this.init();
        }

        init() {
            this.input.addEventListener('input', () => this.handleInput());
            this.input.addEventListener('focus', () => this.updatePosition());

            window.addEventListener('resize', () => this.updatePosition());
            window.addEventListener('scroll', () => this.updatePosition(), true);

            document.addEventListener('click', (e) => {
                if (e.target !== this.input && !this.container.contains(e.target)) {
                    this.hide();
                }
            });
        }

        handleInput() {
            clearTimeout(this.debounceTimer);
            const query = this.input.value.trim();
            if (query.length < 3) {
                this.hide();
                return;
            }
            this.debounceTimer = setTimeout(() => this.fetchSuggestions(query), 400);
        }

        async fetchSuggestions(query) {
            if (this.abortController) this.abortController.abort();
            this.abortController = new AbortController();

            try {
                this.input.style.borderColor = '#3b82f6'; // Loading blue border
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=in`, {
                    signal: this.abortController.signal
                });
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                this.render(data);
            } catch (err) {
                if (err.name !== 'AbortError') console.error(err);
            } finally {
                this.input.style.borderColor = '';
            }
        }

        render(data) {
            this.container.innerHTML = '';
            if (data.length === 0) {
                this.hide();
                return;
            }

            data.forEach(item => {
                const parts = item.display_name.split(',');
                const main = parts[0];
                const sub = parts.slice(1).join(',').trim();

                const el = document.createElement('div');
                el.className = 'geo-suggestion-item';
                el.innerHTML = `
                    <span class="geo-suggestion-icon">📍</span>
                    <div class="geo-suggestion-text">
                        <span class="geo-suggestion-main">${main}</span>
                        <span class="geo-suggestion-sub">${sub}</span>
                    </div>
                `;
                el.addEventListener('click', () => {
                    this.input.value = item.display_name;
                    this.hide();
                    this.input.dispatchEvent(new Event('change'));
                    this.input.dispatchEvent(new Event('input')); // Ensure both events fire
                });
                this.container.appendChild(el);
            });
            this.show();
        }

        show() {
            this.updatePosition();
            this.container.style.display = 'block';
        }

        hide() {
            this.container.style.display = 'none';
        }

        updatePosition() {
            if (this.container.style.display === 'none') return;
            const rect = this.input.getBoundingClientRect();
            this.container.style.top = (rect.bottom + 4) + 'px';
            this.container.style.left = rect.left + 'px';
            this.container.style.width = rect.width + 'px';
        }
    }

    // Expose Global Init
    window.initLocationAutocomplete = function (inputId) {
        // Delay slightly to ensure element exists if just created
        setTimeout(() => {
            new LocationAutocomplete(inputId);
        }, 100);
    };
})();
