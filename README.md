# 🚦 CrowdOS

### AI-Powered Crowd Prediction & Intelligent Routing Platform

> Transforming crowd management from passive monitoring → real-time autonomous decision-making

---

## 🧠 Overview

CrowdOS is an AI-driven crowd intelligence system designed to predict congestion before it happens and actively guide users to optimal entry points in real time.

Unlike traditional dashboards that only visualize crowd data, CrowdOS acts on it — delivering decision-level intelligence to both users and organizers.

---

## 🎯 Problem–Solution Alignment

CrowdOS directly addresses key inefficiencies in large-scale crowd management systems:

* **Problem:** Unpredictable wait times and overcrowded gates
  → **Solution:** Real-time congestion prediction and dynamic gate recommendation
* **Problem:** Uneven crowd distribution across entry points
  → **Solution:** Intelligent routing powered by live data and AI decision logic
* **Problem:** Lack of real-time decision support for attendees
  → **Solution:** Interactive dashboard with route visualization and wait-time estimation
* **Problem:** Sudden congestion spikes
  → **Solution:** Predictive engine that forecasts crowd buildup and triggers proactive rerouting

---

## ⚙️ Key Features

* Directly aligned with real-world crowd management problem scenarios

### 🧠 Intelligent Gate Recommendation

* Combines live congestion data and user proximity
* Outputs best gate with lowest total cost (time + distance)

### 🔮 Predictive Congestion Engine

* Forecasts near-future crowd buildup
* Warns users before congestion happens

### ⏱️ Dynamic Wait Time Estimation

* Real-time queue length & processing rate

### 📍 Smart Navigation System

* Visual routing using Google Maps
* Gate status indicators (🟢 🟡 🔴)

### 📊 Live Analytics Dashboard

* Real-time crowd flow visualization
* Insights for organizers

---

## 🧪 Testing

* Jest + Supertest integration
* API validation + edge cases covered
* Robust error handling tested

---

## 🔒 Security

* Helmet (secure headers)
* Rate limiting (DDoS protection)
* Input validation & sanitization
* Restricted CORS access
* Environment-based configs
* Centralized error handling

---

## 🌍 Google Integration

* Google Maps API for live visualization
* Designed for Google Distance Matrix API integration
* Scalable for advanced Google Cloud services

---

## ♿ Accessibility

* Semantic HTML structure
* ARIA labels for assistive tech
* Keyboard navigation support
* Screen reader friendly alerts

---

## ⚡ Performance Optimization

* Optimized API request handling
* Efficient simulation updates
* Lightweight backend architecture
* Scalable for high traffic

---

## 🚀 Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express
* **Maps:** Google Maps API
* **Realtime:** Socket.IO
* **Charts:** Chart.js
* **Database:** SQLite

---

## 📸 Screenshots

### 🖥️ Dashboard Overview

![Dashboard](assets/dashboard.png)

### 📊 Analytics Graph

![Graph](assets/graph.png)

### 🚦 Gate Analysis

![Gates](assets/gates-analysis.png)

### 🏟️ Stadium Layout

![Stadium](assets/stadium-floor-plan.png)

---

## ▶️ Run Locally

```bash
npm install
npm start
```

### Environment Setup

Create a `.env` file:

```env
PORT=3000
GOOGLE_MAPS_API_KEY=your_key_here
```
Note: Replace your_google_maps_api_key with your actual API key.

---

## 🌍 Real-World Impact

* 🏟️ Stadium crowd management
* 🎤 Concert optimization
* 🏙️ Smart city systems
* 🚨 Emergency evacuation planning

---

CrowdOS transforms passive crowd monitoring into an active decision-making system, directly solving critical inefficiencies in event management.

---

## 🚀 Built for PromptWars
