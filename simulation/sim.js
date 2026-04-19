// simulation/sim.js

const db = require('../backend/database');

// ⏱ CONFIG
const REFRESH_INTERVAL = 2000;
const ROLE_ROTATION_INTERVAL = 300000; // 5 min

let lastRoleRotation = Date.now();

// 🎯 INITIAL STATE (balanced start)
const gates = [
  { id: "A", capacity: 100, current: 50, role: 'safe' },
  { id: "B", capacity: 120, current: 75, role: 'warning' },
  { id: "C", capacity: 80, current: 60, role: 'danger' },
  { id: "D", capacity: 150, current: 90, role: 'dynamic' },
];

// 🎭 ROLE DEFINITIONS
const roles = {
  safe: { min: 0.35, max: 0.55 },
  warning: { min: 0.6, max: 0.8 },
  danger: { min: 0.85, max: 0.98 },
  dynamic: { min: 0.4, max: 0.9 }
};

/**
 * Shuffles and reassigns congestion roles (safe, warning, danger, dynamic) to gates.
 * Ensures a realistic distribution of crowd load across the stadium.
 */
function rotateRoles() {
  const roleKeys = ['safe', 'warning', 'danger', 'dynamic'];

  // shuffle
  for (let i = roleKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roleKeys[i], roleKeys[j]] = [roleKeys[j], roleKeys[i]];
  }

  gates.forEach((gate, idx) => {
    gate.role = roleKeys[idx];
  });

  console.info("[Simulation] 🔄 Roles rotated:", gates.map(g => `${g.id}:${g.role}`).join(" | "));
}

/**
 * Updates the current crowd distribution for all gates based on their assigned roles.
 * Adds random variation and ensures numbers stay within configured bounds.
 * Saves the current state to the database history.
 */
function updateCrowd() {

  // 🔄 rotate roles periodically
  if (Date.now() - lastRoleRotation > ROLE_ROTATION_INTERVAL) {
    rotateRoles();
    lastRoleRotation = Date.now();
  }

  gates.forEach(gate => {

    const config = roles[gate.role];

    const currentLoad = gate.current / gate.capacity;
    const targetLoad = (config.min + config.max) / 2;

    // 👇 smoother movement (not jumpy)
    let delta = Math.floor(Math.random() * 4) + 1; // 1–4 people

    // 🎯 move towards role center
    if (currentLoad > targetLoad) {
      gate.current -= delta;
    } else {
      gate.current += delta;
    }

    // 🧱 clamp inside role bounds
    const minPeople = Math.round(gate.capacity * config.min);
    const maxPeople = Math.round(gate.capacity * config.max);

    gate.current = Math.max(minPeople, Math.min(maxPeople, gate.current));
  });

  // 💾 SAVE TO DB
  try {
    const stmt = db.prepare(`
      INSERT INTO crowd_history 
      (gate_a_people, gate_b_people, gate_c_people, gate_d_people) 
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      gates[0].current,
      gates[1].current,
      gates[2].current,
      gates[3].current
    );

  } catch (err) {
    console.error("[Simulation] ❌ DB insert failed:", err);
  }
}

/**
 * Computes and retrieves the current crowd load statistics for all gates.
 * Triggers an internal simulation update before returning data.
 *
 * @returns {Array<{gate: string, people: number, capacity: number, load: number}>} Array of gate statistics.
 */
function getCrowdData() {

  updateCrowd();

  return gates.map(gate => {

    const load = gate.current / gate.capacity;

    return {
      gate: gate.id,
      people: gate.current,
      capacity: gate.capacity,
      load: Number(load.toFixed(2)) // ✅ consistent with frontend
    };
  });
}

/**
 * Simulates a sudden rush or spike in traffic at a specific gate.
 * 
 * @param {string} gateId - The unique identifier of the gate (e.g., 'A', 'B').
 * @returns {boolean} True if the gate was successfully found and triggered, false otherwise.
 */
function triggerRush(gateId) {

  const gate = gates.find(g => g.id === gateId);

  if (!gate) return false;

  // ⚡ spike traffic (realistic burst)
  const spike = Math.floor(gate.capacity * 0.15);

  gate.current = Math.min(gate.capacity, gate.current + spike);

  console.info(`[Simulation] ⚡ Rush triggered at Gate ${gateId}`);

  return true;
}

module.exports = {
  getCrowdData,
  triggerRush
};