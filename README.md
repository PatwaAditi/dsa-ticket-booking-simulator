# 🚆 Mumbai Suburban Railway — Ticket Booking & FIFO Queue Simulator

[![C++](https://img.shields.io/badge/C%2B%2B-11%20%2F%2014%20%2F%2017-00599C?logo=c%2B%2B&logoColor=white)](https://isocpp.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

An end-to-end Data Structures and Algorithms (DSA) mini-project simulating the high-volume ticket booking, queue management, and cancellation workflows of the **Mumbai Suburban Railway** (Western, Central, and Harbour lines).

The project features:
1. **A Core C++ Engine:** Terminal-based simulator demonstrating FIFO queues (`std::queue`), dynamic vectors (`std::vector`), and ticket inventory management with robust input validation.
2. **An Interactive Visual Web Simulator:** High-fidelity interactive concourse dashboard showcasing animated queues, real station route calculation, fare calculation slabs, and authentic printable ticket generation.

---

## 📌 Project Overview

In transit hubs like Mumbai's suburban rail network (which carries over 7.5 million passengers daily), queue management and inventory consistency are paramount. This project demonstrates how core computer science data structures model real-world high-throughput ticketing counters:

- **Fairness Guarantee:** First-In, First-Out (FIFO) passenger processing so that passengers who arrive earlier are served strictly before later arrivals.
- **Stock & Inventory Safety:** Available ticket quota management preventing overbooking.
- **Dynamic Cancellations:** Supports full and partial ticket cancellations, automatically releasing seat quota to waiting queue passengers in strict FIFO order.
- **Realistic Fare Engine:** Calculates fares across Western, Central, and Harbour lines based on distance intervals, class selection (Second, First, AC Local), and journey types (Single / Return).

---

## 🧠 Data Structures & Algorithms (DSA)

| Data Structure / Concept | Role in Project | Implementation |
| :--- | :--- | :--- |
| **Queue (FIFO)** | Passenger waiting line | `std::queue<Customer>` in C++ / Array queue in JS |
| **Vector / Dynamic Array** | Confirmed bookings register | `std::vector<Booking>` with iterator erasure |
| **Linear Search & Deletion** | Booking lookup & cancellation | Iterator traversal with $O(N)$ lookup & removal |
| **Slotted Fare Slabs** | Distance-to-fare lookup | Linear search / Interval matching algorithm |
| **Input Stream Sanitization** | Robust console IO | `std::cin.clear()` and `std::cin.ignore()` |

---

## 📂 Repository Structure

```text
├── main.cpp          # Core C++ ticketing & queue simulation logic
├── index.html        # Interactive Mumbai Local web simulator UI
├── style.css         # Styling, glassmorphic UI, animations & train concourse
├── app.js            # Concourse simulation logic, queue manager & ticket generator
├── data.js           # Real station datasets (Western/Central/Harbour) & fare tables
├── .vscode/          # Preconfigured build tasks & C/C++ compiler properties
└── .gitignore        # Ignores build binaries (.exe, .o, logs)
```

---

## 🚀 How to Run

### 1. Running the C++ Console Engine

#### Prerequisites
- A modern C++ compiler (`g++` / MinGW, Clang, or MSVC).

#### Compile & Run via Terminal:
- **Windows (PowerShell / Command Prompt):**
  ```powershell
  # Compile
  g++ -Wall -std=c++11 main.cpp -o main.exe

  # Run
  .\main.exe
  ```

- **Linux / macOS:**
  ```bash
  # Compile
  g++ -Wall -std=c++11 main.cpp -o main

  # Run
  ./main
  ```

#### Using VS Code / Antigravity IDE:
1. Open the project folder in VS Code.
2. Press **`Ctrl + Shift + B`** to trigger the build task.
3. In the terminal window, run `.\main.exe`.

---

### 2. Running the Visual Web Simulator

The frontend runs natively in any modern web browser without needing `npm install` or complex build steps.

#### Method A: Direct Browser Launch (Fastest)
- **Windows (PowerShell):**
  ```powershell
  Start-Process index.html
  ```
- **macOS:**
  ```bash
  open index.html
  ```
- **Linux:**
  ```bash
  xdg-open index.html
  ```

#### Method B: Local Web Server (Recommended)
You can serve the application locally using Python:
```bash
python -m http.server 3000
```
Then navigate to: **`http://localhost:3000`**

#### Method C: VS Code Live Server
Right-click `index.html` in your file tree and choose **"Open with Live Server"**.

---

## ✨ Features Breakdown

### C++ Console Simulator
- 🎟️ **Book Tickets:** Add requests or automatically join the FIFO queue if tickets are unavailable.
- 👥 **Process Waiting Queue:** Automatically checks availability and dispenses tickets in arrival order.
- 🔄 **Cancellation Engine:** Supports partial cancellation (e.g., cancelling 2 out of 5 tickets) or complete cancellation, immediately triggering queue processing for remaining seats.
- 📊 **Statistics Dashboard:** Real-time metrics showing total confirmations, total cancellations, remaining capacity, and queue depth.

### Visual Web Dashboard
- 🚉 **Multi-Line Support:** Realistic stations for Western (Churchgate–Virar), Central (CSMT–Kalyan), and Harbour (CSMT–Panvel) lines.
- 🚶 **Live Passenger Concourse:** Animated walking passengers, queuing lanes, and counter service animations.
- 🎫 **Authentic Mumbai Ticket Card:** Generates realistic tickets with Indian Railways styling, barcode, auth code, and timestamp.
- 🎛️ **Presentation Controls:** Includes manual FIFO enqueue/dequeue steps and an automated demonstration mode.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
