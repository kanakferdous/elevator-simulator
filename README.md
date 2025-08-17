# 🚪 Elevator Simulator

An interactive and visually rich web-based **Elevator Simulator** that mimics the behavior of a multi-floor elevator system. This simulation features animated floor transitions, realistic door mechanics, a responsive control panel, and dynamic floor indicators — all built with vanilla JavaScript, HTML, and CSS.

---

## 📋 Table of Contents

- [Introduction](#📌-introduction)
- [Features](#✨-features)
- [Installation](#🛠-installation)
- [Usage](#▶️-usage)
- [Configuration](#⚙️-configuration)
- [Dependencies](#📦-dependencies)
- [Examples](#🧪-examples)
- [Troubleshooting](#🛠️-troubleshooting)
- [Contributors](#👥-contributors)
- [License](#🪪-license)

---

## 📌 Introduction

This project simulates a functioning elevator within a building. Users can interact with a control panel to send the elevator to different floors, open or close the doors, and observe the animated response. The project is ideal for demonstrating state management, CSS transitions, and basic UI/UX animations in web applications.

---

## ✨ Features

- Fully animated elevator car and doors.
- Control panel with floor selection and door controls.
- Realistic door dwell timing and auto-close feature.
- Smooth floor-to-floor travel (900ms per floor).
- Dynamic directional indicators and floor labels.
- Configurable number of floors via CSS variables.
- Mobile-friendly responsive design.

---

## 🛠 Installation

1. Clone the repository or download the source files.

```bash
git clone https://github.com/kanakferdous/elevator-simulator.git
cd elevator-simulator
```

2. Open `index.html` in any modern web browser.

> ✅ No build tools or installations required.

---

## ▶️ Usage

1. Click on any floor button (G to 5) to move the elevator.
2. Use **Open** and **Close** buttons to control the doors manually.
3. Watch the direction indicators and floor lights reflect current status.

---

## ⚙️ Configuration

Customize the simulator using the following CSS variables in `style.css`:

| Variable          | Description                        | Default  |
|------------------|------------------------------------|----------|
| `--floors`        | Number of floors                   | `6`      |
| `--floor-h`       | Height of each floor               | `100px`  |
| `--speed-per-floor` | Travel time per floor            | `900ms`  |
| `--door-time`     | Time for doors to open/close       | `700ms`  |

---

## 📦 Dependencies

This project is built entirely with:

- **HTML5**
- **CSS3 (custom properties, transitions)**
- **Vanilla JavaScript (ES6+)**

> No external libraries or frameworks are used.

---

## 🧪 Examples

- Start at **Ground Floor**
- Select **Floor 5**: elevator will rise with a 900ms delay per floor.
- Door auto-closes after 5 seconds if left open.

---

## 🛠️ Troubleshooting

- **Buttons not responding?**
  - Check that JavaScript is enabled.
  - Ensure browser supports modern ES6 features.

- **Elevator doesn't move?**
  - Make sure the target floor is different from the current one.
  - Verify there are no JavaScript console errors.

---

## 👥 Contributors

Made by Mohammad Kanak Ferdous. Contributions welcome!

---

## 🪪 License

This project is licensed under the **MIT License**. See `LICENSE` file for details.
