// ==========================================================================
// BUCU Orbital Action Wheel — High Performance Dual-Ring NUI Engine
// ==========================================================================

const container = document.getElementById('radial-container');
const svg = document.getElementById('radial-svg');
const innerRingEl = document.getElementById('inner-ring');
const satelliteRingEl = document.getElementById('satellite-ring');
const centerBtn = document.getElementById('radial-center');

// Center Hub Elements
const centerAmbientEl = document.getElementById('center-ambient');
const centerPreviewEl = document.getElementById('center-preview');
const timeEl = document.getElementById('center-time');
const dateEl = document.getElementById('center-date');
const statValEl = document.getElementById('center-stat-val');
const gaugeFillEl = document.getElementById('gauge-fill');
const hpValEl = document.getElementById('center-hp-val');
const armourValEl = document.getElementById('center-armour-val');

// Preview Elements
const previewIconEl = document.getElementById('preview-icon');
const previewLabelEl = document.getElementById('preview-label');
const previewCategoryEl = document.getElementById('preview-category');
const previewHintEl = document.getElementById('preview-hint');

// State
let fullMenu = [];
let availableCategories = [];
let inVehicle = false;
let currentHealth = 100;
let currentArmour = 100;

let activeCatIndex = -1;
let activeSubIndex = -1;

let innerSliceGroups = [];
let satelliteSliceGroups = [];
let satelliteItems = [];
let satelliteFanStart = 0;
let satelliteSubStep = 0;

// Dimensions & Geometry
const CX = 300;
const CY = 300;
const R_INNER = 104;
const R_OUTER = 178;
const R_SUB_INNER = 190;
const R_SUB_OUTER = 264;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 88; // ~552.92

// Close Radial and notify FiveM client
function closeRadial() {
    container.classList.add('hidden');
    activeCatIndex = -1;
    activeSubIndex = -1;
    satelliteRingEl.innerHTML = '';
    showAmbientMode();

    fetch(`https://${GetParentResourceName()}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

// Polar to Cartesian coordinate converter
function polarToCartesian(cx, cy, r, angleRad) {
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad)
    };
}

// Generate SVG arc path for a segmented slice
function createSlicePath(startAngle, endAngle, rInner, rOuter) {
    const p1 = polarToCartesian(CX, CY, rOuter, startAngle);
    const p2 = polarToCartesian(CX, CY, rOuter, endAngle);
    const p3 = polarToCartesian(CX, CY, rInner, endAngle);
    const p4 = polarToCartesian(CX, CY, rInner, startAngle);

    const largeArcFlag = (endAngle - startAngle) <= Math.PI ? "0" : "1";

    return [
        "M", p1.x.toFixed(2), p1.y.toFixed(2),
        "A", rOuter, rOuter, 0, largeArcFlag, 1, p2.x.toFixed(2), p2.y.toFixed(2),
        "L", p3.x.toFixed(2), p3.y.toFixed(2),
        "A", rInner, rInner, 0, largeArcFlag, 0, p4.x.toFixed(2), p4.y.toFixed(2),
        "Z"
    ].join(" ");
}

// Update Real-Time Clock & Telemetry
function updateTelemetry() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    if (timeEl) timeEl.textContent = `${hh}:${mm}`;

    const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dd = String(now.getDate()).padStart(2, '0');
    const mon = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    if (dateEl) dateEl.textContent = `${day}, ${dd} ${mon}`;

    // Update Circular Gauge
    if (statValEl) statValEl.textContent = `${currentHealth}%`;
    if (hpValEl) hpValEl.textContent = `${currentHealth}%`;
    if (armourValEl) armourValEl.textContent = `${currentArmour}%`;

    if (gaugeFillEl) {
        const offset = GAUGE_CIRCUMFERENCE - (GAUGE_CIRCUMFERENCE * (currentHealth / 100));
        gaugeFillEl.style.strokeDasharray = `${GAUGE_CIRCUMFERENCE}`;
        gaugeFillEl.style.strokeDashoffset = `${offset}`;
    }
}

// Toggle Center Modes
function showAmbientMode() {
    if (centerAmbientEl) centerAmbientEl.classList.remove('hidden');
    if (centerPreviewEl) centerPreviewEl.classList.add('hidden');
}

function showPreviewMode(icon, title, category, hint) {
    if (centerAmbientEl) centerAmbientEl.classList.add('hidden');
    if (centerPreviewEl) {
        centerPreviewEl.classList.remove('hidden');
        previewIconEl.textContent = getIconEmoji(icon);
        previewLabelEl.textContent = title || '';
        previewCategoryEl.textContent = category || 'BUCU CORE';
        previewHintEl.textContent = hint || 'RELEASE F1 TO EXECUTE';
    }
}

// Filter Root Categories
function getAvailableRootCategories() {
    return fullMenu.filter(cat => {
        if (cat.requiresVehicle && !inVehicle) return false;
        return true;
    });
}

// Render Inner Ring (Categories)
function renderInnerRing() {
    innerRingEl.innerHTML = '';
    satelliteRingEl.innerHTML = '';
    innerSliceGroups = [];
    activeCatIndex = -1;
    activeSubIndex = -1;

    availableCategories = getAvailableRootCategories();
    const total = availableCategories.length;
    if (total === 0) return;

    const angleStep = (2 * Math.PI) / total;
    const gap = total > 1 ? 0.03 : 0;

    availableCategories.forEach((cat, index) => {
        const midAngle = index * angleStep - Math.PI / 2;
        const startAngle = midAngle - angleStep / 2 + gap;
        const endAngle = midAngle + angleStep / 2 - gap;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "inner-item");
        g.setAttribute("data-index", index);

        // Arc Path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", createSlicePath(startAngle, endAngle, R_INNER, R_OUTER));
        path.setAttribute("class", "inner-slice");

        // Icon
        const iconRadius = R_INNER + (R_OUTER - R_INNER) * 0.40;
        const iconPos = polarToCartesian(CX, CY, iconRadius, midAngle);
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
        icon.setAttribute("x", iconPos.x.toFixed(2));
        icon.setAttribute("y", iconPos.y.toFixed(2));
        icon.setAttribute("class", "inner-icon");
        icon.textContent = getIconEmoji(cat.icon);

        // Label
        const textRadius = R_INNER + (R_OUTER - R_INNER) * 0.74;
        const labelPos = polarToCartesian(CX, CY, textRadius, midAngle);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", labelPos.x.toFixed(2));
        text.setAttribute("y", labelPos.y.toFixed(2));
        text.setAttribute("class", "inner-text");

        let displayLabel = cat.label || cat.id || '';
        if (displayLabel.length > 14) displayLabel = displayLabel.substring(0, 12) + '..';
        text.textContent = displayLabel;

        g.appendChild(path);
        g.appendChild(icon);
        g.appendChild(text);

        // Outward Chevron Arrow if has sub-items
        if (cat.items && cat.items.length > 0) {
            const chevRadius = R_OUTER - 8;
            const chevPos = polarToCartesian(CX, CY, chevRadius, midAngle);
            const chev = document.createElementNS("http://www.w3.org/2000/svg", "text");
            chev.setAttribute("x", chevPos.x.toFixed(2));
            chev.setAttribute("y", chevPos.y.toFixed(2));
            chev.setAttribute("class", "inner-chevron");
            chev.textContent = "›";
            g.appendChild(chev);
        }

        // Click on category
        g.addEventListener('click', (e) => {
            e.stopPropagation();
            if (cat.items && cat.items.length > 0) {
                setActiveCategory(index, true);
            } else {
                executeAction(cat);
            }
        });

        innerRingEl.appendChild(g);
        innerSliceGroups.push(g);
    });
}

// Render Outer Satellite Ring (Sub-Menu Arc)
function renderSatelliteRing(catIndex) {
    satelliteRingEl.innerHTML = '';
    satelliteSliceGroups = [];
    activeSubIndex = -1;

    const cat = availableCategories[catIndex];
    if (!cat || !cat.items || cat.items.length === 0) return;

    satelliteItems = cat.items;
    const M = satelliteItems.length;

    const totalCategories = availableCategories.length;
    const catAngleStep = (2 * Math.PI) / totalCategories;
    const catMidAngle = catIndex * catAngleStep - Math.PI / 2;

    // Sub-menu fan angle (smoothly spreads around category)
    const fanAngle = Math.min(Math.PI * 0.95, Math.max(catAngleStep * 1.35, M * 0.26));
    satelliteFanStart = catMidAngle - fanAngle / 2;
    satelliteSubStep = fanAngle / M;
    const subGap = M > 1 ? 0.025 : 0;

    satelliteItems.forEach((subItem, j) => {
        const subMidAngle = satelliteFanStart + (j + 0.5) * satelliteSubStep;
        const subStartAngle = subMidAngle - satelliteSubStep / 2 + subGap;
        const subEndAngle = subMidAngle + satelliteSubStep / 2 - subGap;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "satellite-item");
        g.setAttribute("data-sub-index", j);

        // Arc Path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", createSlicePath(subStartAngle, subEndAngle, R_SUB_INNER, R_SUB_OUTER));
        path.setAttribute("class", "satellite-slice");

        // Icon
        const iconRadius = R_SUB_INNER + (R_SUB_OUTER - R_SUB_INNER) * 0.40;
        const iconPos = polarToCartesian(CX, CY, iconRadius, subMidAngle);
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
        icon.setAttribute("x", iconPos.x.toFixed(2));
        icon.setAttribute("y", iconPos.y.toFixed(2));
        icon.setAttribute("class", "satellite-icon");
        icon.textContent = getIconEmoji(subItem.icon);

        // Label
        const textRadius = R_SUB_INNER + (R_SUB_OUTER - R_SUB_INNER) * 0.74;
        const labelPos = polarToCartesian(CX, CY, textRadius, subMidAngle);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", labelPos.x.toFixed(2));
        text.setAttribute("y", labelPos.y.toFixed(2));
        text.setAttribute("class", "satellite-text");

        let displayLabel = subItem.label || subItem.id || '';
        if (displayLabel.length > 13) displayLabel = displayLabel.substring(0, 11) + '..';
        text.textContent = displayLabel;

        g.appendChild(path);
        g.appendChild(icon);
        g.appendChild(text);

        // Click selection
        g.addEventListener('click', (e) => {
            e.stopPropagation();
            executeAction(subItem);
        });

        satelliteRingEl.appendChild(g);
        satelliteSliceGroups.push(g);
    });
}

// Set Active Category
function setActiveCategory(catIdx, forceRender) {
    if (catIdx === activeCatIndex && !forceRender) return;

    if (activeCatIndex >= 0 && innerSliceGroups[activeCatIndex]) {
        innerSliceGroups[activeCatIndex].classList.remove('active');
    }

    activeCatIndex = catIdx;

    if (activeCatIndex >= 0 && innerSliceGroups[activeCatIndex]) {
        innerSliceGroups[activeCatIndex].classList.add('active');
        const cat = availableCategories[activeCatIndex];
        renderSatelliteRing(activeCatIndex);
        showPreviewMode(cat.icon, cat.label, 'CATEGORY', 'FLICK OUTWARD OR RELEASE');
    } else {
        satelliteRingEl.innerHTML = '';
        showAmbientMode();
    }
}

// Set Active Sub Item
function setActiveSubItem(subIdx) {
    if (subIdx === activeSubIndex) return;

    if (activeSubIndex >= 0 && satelliteSliceGroups[activeSubIndex]) {
        satelliteSliceGroups[activeSubIndex].classList.remove('active');
    }

    activeSubIndex = subIdx;

    if (activeSubIndex >= 0 && satelliteSliceGroups[activeSubIndex]) {
        satelliteSliceGroups[activeSubIndex].classList.add('active');
        const subItem = satelliteItems[activeSubIndex];
        const cat = availableCategories[activeCatIndex];
        showPreviewMode(subItem.icon, subItem.label, cat ? cat.label : 'ACTION', 'RELEASE F1 TO EXECUTE');
    } else {
        // Return to category preview
        if (activeCatIndex >= 0) {
            const cat = availableCategories[activeCatIndex];
            showPreviewMode(cat.icon, cat.label, 'CATEGORY', 'FLICK OUTWARD OR RELEASE');
        }
    }
}

// Execute Action
function executeAction(item) {
    if (!item) return;

    fetch(`https://${GetParentResourceName()}/executeAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    }).catch(() => {});

    closeRadial();
}

// Directional Mouse Tracker across Dual-Rings
window.addEventListener('mousemove', (e) => {
    if (container.classList.contains('hidden') || availableCategories.length === 0) return;

    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - (rect.left + rect.width / 2);
    const my = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(mx, my);
    const angle = Math.atan2(my, mx);

    // ZONE 1: Center Core Hub
    if (dist < R_INNER * 0.90) {
        if (activeSubIndex !== -1) setActiveSubItem(-1);
        if (activeCatIndex !== -1) setActiveCategory(-1);
        showAmbientMode();
        return;
    }

    // ZONE 2: Inner Category Ring
    if (dist >= R_INNER * 0.90 && dist <= R_OUTER * 1.06) {
        if (activeSubIndex !== -1) setActiveSubItem(-1);

        const total = availableCategories.length;
        const angleStep = (2 * Math.PI) / total;
        let norm = angle + Math.PI / 2 + angleStep / 2;
        while (norm < 0) norm += 2 * Math.PI;
        while (norm >= 2 * Math.PI) norm -= 2 * Math.PI;

        const catIdx = Math.floor(norm / angleStep) % total;
        setActiveCategory(catIdx);
        return;
    }

    // ZONE 3: Outer Satellite Arc Ring
    if (dist > R_OUTER * 1.06 && dist <= R_SUB_OUTER * 1.25) {
        if (activeCatIndex >= 0 && satelliteItems.length > 0) {
            const M = satelliteItems.length;
            let diff = angle - satelliteFanStart;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;

            if (diff >= -0.15 && diff <= (M * satelliteSubStep + 0.15)) {
                const subIdx = Math.min(M - 1, Math.max(0, Math.floor(diff / satelliteSubStep)));
                setActiveSubItem(subIdx);
            }
        }
        return;
    }

    // ZONE 4: Outside Wheel
    if (dist > R_SUB_OUTER * 1.25) {
        if (activeSubIndex !== -1) setActiveSubItem(-1);
    }
});

// Center Core Click
centerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeRadial();
});

// Right click / ESC to close
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!container.classList.contains('hidden')) {
        closeRadial();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRadial();
});

// Icon Map with fallback emojis
function getIconEmoji(name) {
    const emojis = {
        'car': '🚗',
        'tshirt': '👔',
        'user-friends': '🎭',
        'power-off': '⚡',
        'wrench': '🔧',
        'archive': '📦',
        'lightbulb': '💡',
        'arrow-left': '⬅️',
        'arrow-right': '➡️',
        'hat-cowboy': '🤠',
        'glasses': '👓',
        'mask': '🎭',
        'vest': '🦺',
        'shield-alt': '🛡️',
        'suitcase': '🎒',
        'chair': '🪑',
        'child': '🧍',
        'hand-paper': '✋',
        'phone': '🚨'
    };
    return emojis[name] || '✦';
}

// Receive messages from FiveM client Lua
window.addEventListener('message', (event) => {
    const data = event.data;
    if (data.action === 'OPEN_RADIAL') {
        fullMenu = data.menu || [];
        inVehicle = !!data.inVehicle;
        currentHealth = data.health !== undefined ? data.health : 100;
        currentArmour = data.armour !== undefined ? data.armour : 100;

        renderInnerRing();
        updateTelemetry();
        container.classList.remove('hidden');
    } else if (data.action === 'CLOSE_RADIAL') {
        container.classList.add('hidden');
        activeCatIndex = -1;
        activeSubIndex = -1;
        satelliteRingEl.innerHTML = '';
        showAmbientMode();
    } else if (data.action === 'KEY_RELEASED') {
        // F1 Released: Execute highlighted sub-action or category
        if (!container.classList.contains('hidden')) {
            if (activeSubIndex >= 0 && satelliteItems[activeSubIndex]) {
                executeAction(satelliteItems[activeSubIndex]);
            } else if (activeCatIndex >= 0 && availableCategories[activeCatIndex]) {
                const cat = availableCategories[activeCatIndex];
                if (!cat.items || cat.items.length === 0) {
                    executeAction(cat);
                }
                // If it has sub-items, keep open for mouse click
            } else {
                closeRadial();
            }
        }
    }
});

// Periodic Clock Update
setInterval(updateTelemetry, 1000);
