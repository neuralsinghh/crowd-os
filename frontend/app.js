const BASE_URL = "https://crowd-os.onrender.com";

let userLocation = "Parking A";

let trafficChart;
let timeLabels = [];
let maxDataPoints = 15;
let historicalData = { A: [], B: [], C: [], D: [] };

let lastTimestamp = 0;

const distanceMap = {
    "Parking A": { A: 100, B: 180, C: 140, D: 200 },
    "Parking B": { A: 160, B: 120, C: 150, D: 100 },
    "Food Court": { A: 130, B: 140, C: 90, D: 170 },
    "Road 1": { A: 200, B: 150, C: 180, D: 120 }
};

// ⚙️ GATE CONFIG
const GATE_CONFIG = [
    { id: "A" },
    { id: "B" },
    { id: "C" },
    { id: "D" }
];

const CX = 200, CY = 200;
const RADIUS = 160;

// 🏟️ INIT GATES (pixel-perfect wedges)
// 🏟️ INIT GATES (premium compass wedges)
function initGates() {
    const layer = document.getElementById("gates-layer");
    const container = document.querySelector(".stadium-container");

    // Angles for the gates
    window._gateAngles = {
        A: 0,
        B: 90,
        C: 180,
        D: 270
    };
}

// 📊 INIT CHART

function makeCleanDataset(label, color) {
    return {
        label,
        borderColor: color,
        borderWidth: 2.5,
        tension: 0.4,
        data: [],

        pointRadius: 3,
        pointHoverRadius: 5,
        pointBorderWidth: 2,
        pointBackgroundColor: '#020617',
        pointBorderColor: color,

        fill: false
    };
}

function initChart() {
    const ctx = document.getElementById('trafficChart').getContext('2d');

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Outfit';

    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                makeCleanDataset('Gate A', '#22c55e'),
                makeCleanDataset('Gate B', '#38bdf8'),
                makeCleanDataset('Gate C', '#facc15'),
                makeCleanDataset('Gate D', '#ef4444')
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 20
                }
            },

            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        padding: 20,
                        color: '#cbd5f5',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            },

            scales: {
                x: {
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    min: 0,
                    max: 120,
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

// 📈 UPDATE CHART
function updateChart(crowdArray) {
    const now = new Date().toLocaleTimeString();

    timeLabels.push(now);
    if (timeLabels.length > maxDataPoints) timeLabels.shift();

    crowdArray.forEach(g => {
        const percent = Math.round((g.people / g.capacity) * 100);
        historicalData[g.gate].push(percent);

        if (historicalData[g.gate].length > maxDataPoints) {
            historicalData[g.gate].shift();
        }
    });

    trafficChart.data.labels = [...timeLabels];
    trafficChart.data.datasets[0].data = [...historicalData.A];
    trafficChart.data.datasets[1].data = [...historicalData.B];
    trafficChart.data.datasets[2].data = [...historicalData.C];
    trafficChart.data.datasets[3].data = [...historicalData.D];

    trafficChart.update();
}

// 🚨 ALERT
function showAlert(text) {
    const el = document.getElementById("alert-container");
    el.innerHTML = `<div class="alert-banner" role="alert"><span aria-hidden="true">⚠️</span> ${text}</div>`;
}

// 🧭 ROUTE
function drawRoute(gate) {
    const route = document.getElementById("nav-route");

    // Remove all previous direction classes
    route.classList.remove("active", "route-a", "route-b", "route-c", "route-d");

    if (!gate) return;

    // Add direction class based on gate
    route.classList.add("active", `route-${gate.toLowerCase()}`);
}

// 🎯 LOAD LEVEL
function getLevel(load) {
    if (load > 0.8) return "danger";
    if (load > 0.5) return "warning";
    return "safe";
}

// 🧱 GATE CARDS
function renderGateCards(crowd) {
    const container = document.getElementById("gates");
    container.innerHTML = "";

    crowd.forEach(g => {
        const level = getLevel(g.load);
        const eta = Math.round((distanceMap[userLocation][g.gate] || 150) / 30);

        const el = document.createElement("div");
        el.className = `gate ${level}`;

        el.innerHTML = `
            <div class="gate-title">Gate ${g.gate}</div>
            <div class="gate-stat" aria-label="${Math.round(g.people)} people out of ${g.capacity} capacity">${Math.round(g.people)} / ${g.capacity}</div>
            <div class="gate-percent" aria-label="Load percentage: ${Math.round(g.load * 100)}%">${Math.round(g.load * 100)}%</div>
            <div class="wait" aria-label="Estimated wait time: ${eta} minutes"><span class="icon" aria-hidden="true">⏱</span> ${eta} min</div>
            <button class="rush-btn" aria-label="Trigger rush simulation for Gate ${g.gate}" tabindex="0" onclick="console.log('Gate ${g.gate} clicked'); triggerRush('${g.gate}')">
                <span aria-hidden="true">🏃</span> Trigger Rush
            </button>
        `;

        container.appendChild(el);
    });
}

// 🏃
let rushAlertTimer = null;
function triggerRush(gate) {
    fetch(`${BASE_URL}/api/rush/${gate}`, { method: "POST" });

    const alertBox = document.getElementById("trigger-alert-box");
    if (alertBox) {
        alertBox.innerHTML = `<span aria-hidden="true">🚨</span> Gate ${gate} is Triggered!`;
        alertBox.style.display = "block";
        
        // Reset animation
        alertBox.style.animation = 'none';
        alertBox.offsetHeight; /* trigger reflow */
        alertBox.style.animation = null;

        if (rushAlertTimer) clearTimeout(rushAlertTimer);
        rushAlertTimer = setTimeout(() => {
            alertBox.style.display = "none";
        }, 3000);
    }
}

// 🎯 MAIN
function renderDashboard(data) {
    const bestGate = data.crowd.reduce((a, b) => a.load < b.load ? a : b);

    drawRoute(bestGate.gate);

    const decisionBadge = document.getElementById("decision");
    if (decisionBadge) {
        decisionBadge.innerText = `Gate ${bestGate.gate}`;
        decisionBadge.classList.remove("safe", "warning", "danger");
        decisionBadge.classList.add(getLevel(bestGate.load));
    }

    // Optional: dynamically update confidence width for smooth transition
    const confidenceFill = document.getElementById("confidence-fill");
    if (confidenceFill) {
        // Just as an example: calculate a mock dynamic confidence based on the best gate load
        // A load of 0 gives high confidence (95%), a load of 0.8 gives lower confidence (70%)
        const dynamicConfidence = Math.max(70, Math.round(95 - (bestGate.load * 25)));
        confidenceFill.style.width = `${dynamicConfidence}%`;

        const confidenceVal = document.getElementById("confidence-val");
        if (confidenceVal) confidenceVal.innerText = `${dynamicConfidence}%`;
    }

    updateChart(data.crowd);
    renderGateCards(data.crowd);

    data.crowd.forEach(g => {
        const el = document.getElementById(`map-gate-${g.gate}`);
        if (!el) return;

        // Clean slate: Remove previous classes to prevent stacking
        el.classList.remove("safe", "warning", "danger", "best-gate");

        // Add current status
        const level = getLevel(g.load);
        el.classList.add(level);

        // Highlight best gate
        if (g.gate === bestGate.gate) {
            el.classList.add("best-gate");
        }
    });
}

// 🗺️ INIT GOOGLE MAPS
async function initGoogleMaps() {
    try {
        const response = await fetch(`${BASE_URL}/api/config`);
        const data = await response.json();
        const apiKey = data.googleMapsApiKey;

        if (!apiKey) {
            console.warn("⚠️ No Google Maps API key found.");
            return;
        }

        // Show map container
        const mapContainer = document.getElementById("google-map");
        if (mapContainer) mapContainer.style.display = "block";

        // Load Google Maps script dynamically
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;

        window.initMap = function() {
            // Example stadium coordinates (San Francisco)
            const stadiumLocation = { lat: 37.7749, lng: -122.4194 };
            
            const map = new google.maps.Map(document.getElementById("google-map"), {
                zoom: 14,
                center: stadiumLocation,
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                ]
            });
            
            // Add a marker for the stadium
            new google.maps.Marker({
                position: stadiumLocation,
                map: map,
                title: "Stadium Center"
            });
        };

        document.head.appendChild(script);

    } catch (err) {
        console.error("Failed to load Google Maps configuration:", err);
    }
}

// 🚀 START
window.onload = () => {
    initGates();  // Build dynamic gate layout first
    initChart();
    initGoogleMaps();

    const socket = io(BASE_URL);

    socket.on("crowd_update", (data) => {
        renderDashboard(data);
    });
};