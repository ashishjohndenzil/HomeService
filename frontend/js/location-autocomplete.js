/**
 * OpenStreetMap Address Autocomplete
 * Uses Nominatim API to fetch address suggestions
 */

/**
 * Setup address autocomplete for a given input field and suggestions list
 * @param {string} inputId - The ID of the input field
 * @param {string} listId - The ID of the ul/div to show suggestions
 */
function setupAddressAutocomplete(inputId, listId) {
    const addrInput = document.getElementById(inputId);
    const addrList = document.getElementById(listId);
    let addrDebounce;

    if (!addrInput || !addrList) {
        // console.warn(`Autocomplete: Elements not found for ${inputId} or ${listId}`);
        return;
    }

    // Add CSS class if not present to ensure styling
    if (!addrList.classList.contains('suggestions-list')) {
        addrList.classList.add('suggestions-list');
    }

    // Ensure basic styles are present if not in CSS
    if (!addrList.style.position) {
        addrList.style.position = 'absolute';
        addrList.style.zIndex = '1000';
        addrList.style.backgroundColor = 'white';
        addrList.style.width = '100%';
        addrList.style.maxHeight = '200px';
        addrList.style.overflowY = 'auto';
        addrList.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        addrList.style.listStyle = 'none';
        addrList.style.padding = '0';
        addrList.style.margin = '0';
    }

    let currentController = null;

    addrInput.addEventListener('input', function () {
        const query = this.value;
        clearTimeout(addrDebounce);

        if (query.length < 2) {
            addrList.style.display = 'none';
            return;
        }

        addrDebounce = setTimeout(() => {
            // Cancel previous request if active
            if (currentController) {
                currentController.abort();
            }
            currentController = new AbortController();
            const signal = currentController.signal;

            // Hide list while searching (or show if desired, but user asked to hide status)
            // addrList.style.display = 'none';

            console.log('Fetching address for:', query);
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=in`, { signal })
                .then(res => {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.json();
                })
                .then(data => {
                    console.log('Address results:', data.length);
                    addrList.innerHTML = '';
                    if (data.length > 0) {
                        data.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = item.display_name;
                            li.style.padding = '10px';
                            li.style.cursor = 'pointer';
                            li.style.borderBottom = '1px solid #eee';
                            li.style.fontSize = '0.9rem';

                            // Hover effects
                            li.addEventListener('mouseenter', () => li.style.backgroundColor = '#f0f0f0');
                            li.addEventListener('mouseleave', () => li.style.backgroundColor = 'white');

                            li.addEventListener('click', () => {
                                addrInput.value = item.display_name;
                                addrList.style.display = 'none';

                                // Trigger change event
                                addrInput.dispatchEvent(new Event('change'));
                                addrInput.dispatchEvent(new Event('input'));
                            });
                            addrList.appendChild(li);
                        });
                        addrList.style.display = 'block';
                    } else {
                        addrList.style.display = 'none';
                    }
                })
                .catch(err => {
                    if (err.name === 'AbortError') return; // Ignore aborts
                    console.error('Error fetching address:', err);
                    addrList.style.display = 'none';
                })
                .finally(() => {
                    currentController = null;
                });
        }, 300); // Debounce set to 300ms
    });

    // Hide on click outside
    document.addEventListener('click', function (e) {
        if (e.target !== addrInput && e.target !== addrList) {
            addrList.style.display = 'none';
        }
    });
}

// Global export
window.setupAddressAutocomplete = setupAddressAutocomplete;
