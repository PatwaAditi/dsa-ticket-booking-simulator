/* ══════════════════════════════════════════════════════════════════
   APP.JS — Mumbai Local Ticket Counter Simulator
   FIFO Queue · Realistic Walking People · Indian Railway Trains
   Foot Overbridges · Escalators · Platform Life · Train Indicators
   ══════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ═══ GLOBALS ═══
    const D = RAILWAY_DATA;

    // ── Queue (FIFO) ──
    /** @type {{ id:number, name:string, el:HTMLElement|null }[]} */
    const customerQueue = [];
    let nextCustomerID = 1;

    // ── Stats ──
    let totalServed = 0;
    let totalTickets = 0;
    let totalRevenue = 0;

    // ── Current booking in progress ──
    let currentCustomer = null;   // { id, name }
    let booking = {};             // accumulated choices
    let nextBookingID = 1001;     // matches main.cpp booking sequence!

    // ── Simulation flags (MANUAL presentation mode by default) ──
    let counterBusy = false;      // true while a customer is being served
    let autoDemoMode = false;     // false = user manually clicks all choices
    let autoArrivalMode = false;  // false = user manually enqueues passengers
    const CUSTOMER_INTERVAL = 5000; // 5s when auto-arrival is toggled on
    const MAX_QUEUE = 12;
    let autoArrivalTimer = null;
    let autoPickInterval = null;

    // ═══ DOM CACHE ═══
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const clockEl = $('#clock');
    const queueLane = $('#queue-lane');
    const queueCountEl = $('#queue-count');
    const logFeed = $('#log-feed');
    const logSidebar = $('#log-sidebar');
    const logToggle = $('#log-toggle');
    const toastContainer = $('#toast-container');

    // presentation bar elements
    const presPassengerName = $('#pres-passenger-name');
    const presBtnEnqueue = $('#pres-btn-enqueue');
    const presBtnDequeue = $('#pres-btn-dequeue');
    const presBtnClear = $('#pres-btn-clear');
    const presToggleAutoDemo = $('#pres-toggle-autodemo');
    const presToggleAutoArrival = $('#pres-toggle-autoarrival');

    // counter stepper & header
    const stepPills = $$('.step-pill');
    const btnCancelBooking = $('#btn-cancel-booking');

    // waiting step elements
    const waitingStatusMsg = $('#waiting-status-msg');
    const waitingPassengerHighlight = $('#waiting-passenger-highlight');
    const waitingPassengerName = $('#waiting-passenger-name');
    const btnWaitingServe = $('#btn-waiting-serve');
    const btnWaitingAdd = $('#btn-waiting-add');

    // ticket modal elements
    const ticketModal = $('#ticket-modal');
    const tktBookingId = $('#tkt-booking-id');
    const tktIssueTime = $('#tkt-issue-time');
    const tktPassengerName = $('#tkt-passenger-name');
    const tktFrom = $('#tkt-from');
    const tktTo = $('#tkt-to');
    const tktLine = $('#tkt-line');
    const tktDist = $('#tkt-dist');
    const tktType = $('#tkt-type');
    const tktClass = $('#tkt-class');
    const tktQty = $('#tkt-qty');
    const tktValidity = $('#tkt-validity');
    const tktTotal = $('#tkt-total');
    const btnTicketDone = $('#btn-ticket-done');

    // steps
    const steps = {
        waiting: $('#step-waiting'),
        type: $('#step-type'),
        line: $('#step-line'),
        stations: $('#step-stations'),
        class_: $('#step-class'),
        qty: $('#step-qty'),
        date: $('#step-date'),
        pay: $('#step-pay')
    };

    // station selects
    const selFrom = $('#sel-from');
    const selTo = $('#sel-to');

    // quantity
    const qtyVal = $('#qty-val');
    let currentQty = 1;

    // pay
    const summaryCard = $('#summary-card');
    const payAmountEl = $('#pay-amount');

    // stats
    const statServed = $('#stat-served');
    const statTickets = $('#stat-tickets');
    const statRevenue = $('#stat-revenue');

    // train elements
    const train1 = $('#train-1');
    const train2 = $('#train-2');
    const pf1Status = $('#pf1-status');
    const pf2Status = $('#pf2-status');
    const infoDir1 = $('#info-dir-1');
    const infoDest1 = $('#info-dest-1');
    const infoTime1 = $('#info-time-1');
    const infoDir2 = $('#info-dir-2');
    const infoDest2 = $('#info-dest-2');
    const infoTime2 = $('#info-time-2');

    // indicator board
    const indTrain1 = $('#ind-train-1');
    const indDest1 = $('#ind-dest-1');
    const indEta1 = $('#ind-eta-1');
    const indTrain2 = $('#ind-train-2');
    const indDest2 = $('#ind-dest-2');
    const indEta2 = $('#ind-eta-2');

    const lblCustomerName = $('#lbl-customer-name');

    // platform elements
    const platformFloor = $('#platform-floor');
    const fobContainer = $('#fob-container');
    const tracksArea = $('#tracks-area');


    // ═══════════════════════════════════════
    //  SVG PERSON GENERATOR — Realistic Walking Human
    // ═══════════════════════════════════════

    // Colors for people's clothing — vibrant Indian palette
    const SHIRT_COLORS = [
        '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
        '#1ABC9C', '#E67E22', '#2980B9', '#C0392B', '#27AE60',
        '#8E44AD', '#D35400', '#16A085', '#F1C40F', '#2C3E50',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#FF7F50', '#20B2AA', '#778899', '#B22222',
        '#DAA520', '#5F9EA0', '#D2691E', '#6495ED', '#DC143C'
    ];
    const SKIN_TONES = ['#D2A77A', '#C4956A', '#B8845E', '#A67550', '#8D5E3C', '#E8C4A0'];
    const HAIR_COLORS = ['#1a1a1a', '#2C1B0E', '#4A3728', '#1a1510', '#333'];
    const PANT_COLORS = ['#2C3E50', '#34495E', '#1a1510', '#4A4238', '#2d2d2d', '#1B4F72', '#555', '#3d3d3d'];

    function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function createPersonSVG(scale, isWalking, facingRight) {
        const shirt = randomFrom(SHIRT_COLORS);
        const skin = randomFrom(SKIN_TONES);
        const hair = randomFrom(HAIR_COLORS);
        const pants = randomFrom(PANT_COLORS);
        const isFemale = Math.random() > 0.5;
        const hasBackpack = Math.random() > 0.7;
        const walkPhase = Math.random() * 360;

        const w = 22 * scale;
        const h = 42 * scale;

        // Build the SVG person
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 22 42');
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        if (!facingRight) {
            svg.setAttribute('transform', 'scale(-1,1)');
            svg.style.transform = 'scaleX(-1)';
        }

        // Shadow
        const shadow = document.createElementNS(svgNS, 'ellipse');
        shadow.setAttribute('cx', '11');
        shadow.setAttribute('cy', '41');
        shadow.setAttribute('rx', '6');
        shadow.setAttribute('ry', '1.5');
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        svg.appendChild(shadow);

        // Legs — animated walking
        const legGroup = document.createElementNS(svgNS, 'g');

        const legLeft = document.createElementNS(svgNS, 'line');
        legLeft.setAttribute('x1', '9');
        legLeft.setAttribute('y1', '28');
        legLeft.setAttribute('x2', '7');
        legLeft.setAttribute('y2', '38');
        legLeft.setAttribute('stroke', pants);
        legLeft.setAttribute('stroke-width', '2.5');
        legLeft.setAttribute('stroke-linecap', 'round');
        legLeft.classList.add('leg-left');

        const legRight = document.createElementNS(svgNS, 'line');
        legRight.setAttribute('x1', '13');
        legRight.setAttribute('y1', '28');
        legRight.setAttribute('x2', '15');
        legRight.setAttribute('y2', '38');
        legRight.setAttribute('stroke', pants);
        legRight.setAttribute('stroke-width', '2.5');
        legRight.setAttribute('stroke-linecap', 'round');
        legRight.classList.add('leg-right');

        // Shoes
        const shoeLeft = document.createElementNS(svgNS, 'ellipse');
        shoeLeft.setAttribute('cx', '7');
        shoeLeft.setAttribute('cy', '39');
        shoeLeft.setAttribute('rx', '2');
        shoeLeft.setAttribute('ry', '1.2');
        shoeLeft.setAttribute('fill', '#2C1B0E');
        shoeLeft.classList.add('leg-left');

        const shoeRight = document.createElementNS(svgNS, 'ellipse');
        shoeRight.setAttribute('cx', '15');
        shoeRight.setAttribute('cy', '39');
        shoeRight.setAttribute('rx', '2');
        shoeRight.setAttribute('ry', '1.2');
        shoeRight.setAttribute('fill', '#2C1B0E');
        shoeRight.classList.add('leg-right');

        legGroup.appendChild(legLeft);
        legGroup.appendChild(legRight);
        legGroup.appendChild(shoeLeft);
        legGroup.appendChild(shoeRight);
        svg.appendChild(legGroup);

        // Body / Torso
        const torso = document.createElementNS(svgNS, 'rect');
        torso.setAttribute('x', '7');
        torso.setAttribute('y', '16');
        torso.setAttribute('width', '8');
        torso.setAttribute('height', '13');
        torso.setAttribute('rx', '2');
        torso.setAttribute('fill', shirt);
        torso.classList.add('person-shirt');
        svg.appendChild(torso);

        // Collar detail
        const collar = document.createElementNS(svgNS, 'path');
        collar.setAttribute('d', 'M9 16 L11 18 L13 16');
        collar.setAttribute('stroke', 'rgba(0,0,0,0.2)');
        collar.setAttribute('stroke-width', '0.5');
        collar.setAttribute('fill', 'none');
        svg.appendChild(collar);

        // If female, add a dupatta/shawl
        if (isFemale && Math.random() > 0.4) {
            const dupatta = document.createElementNS(svgNS, 'path');
            const dupattaColor = randomFrom(['#E74C3C', '#FF6B6B', '#F39C12', '#9B59B6', '#1ABC9C', '#FF69B4']);
            dupatta.setAttribute('d', 'M8 17 Q6 22 7 28 M14 17 Q16 22 15 28');
            dupatta.setAttribute('stroke', dupattaColor);
            dupatta.setAttribute('stroke-width', '1');
            dupatta.setAttribute('fill', 'none');
            dupatta.setAttribute('opacity', '0.7');
            svg.appendChild(dupatta);
        }

        // Arms
        const armLeft = document.createElementNS(svgNS, 'line');
        armLeft.setAttribute('x1', '7');
        armLeft.setAttribute('y1', '18');
        armLeft.setAttribute('x2', '4');
        armLeft.setAttribute('y2', '27');
        armLeft.setAttribute('stroke', skin);
        armLeft.setAttribute('stroke-width', '2');
        armLeft.setAttribute('stroke-linecap', 'round');
        armLeft.classList.add('arm-left');
        svg.appendChild(armLeft);

        const armRight = document.createElementNS(svgNS, 'line');
        armRight.setAttribute('x1', '15');
        armRight.setAttribute('y1', '18');
        armRight.setAttribute('x2', '18');
        armRight.setAttribute('y2', '27');
        armRight.setAttribute('stroke', skin);
        armRight.setAttribute('stroke-width', '2');
        armRight.setAttribute('stroke-linecap', 'round');
        armRight.classList.add('arm-right');
        svg.appendChild(armRight);

        // Backpack
        if (hasBackpack) {
            const bp = document.createElementNS(svgNS, 'rect');
            bp.setAttribute('x', '14');
            bp.setAttribute('y', '17');
            bp.setAttribute('width', '4');
            bp.setAttribute('height', '8');
            bp.setAttribute('rx', '1');
            bp.setAttribute('fill', randomFrom(['#4A4238', '#2C3E50', '#8B4513', '#555']));
            bp.setAttribute('opacity', '0.8');
            svg.appendChild(bp);
        }

        // Neck
        const neck = document.createElementNS(svgNS, 'rect');
        neck.setAttribute('x', '9.5');
        neck.setAttribute('y', '13');
        neck.setAttribute('width', '3');
        neck.setAttribute('height', '4');
        neck.setAttribute('fill', skin);
        svg.appendChild(neck);

        // Head
        const head = document.createElementNS(svgNS, 'circle');
        head.setAttribute('cx', '11');
        head.setAttribute('cy', '10');
        head.setAttribute('r', '5');
        head.setAttribute('fill', skin);
        svg.appendChild(head);

        // Hair
        const hairEl = document.createElementNS(svgNS, 'path');
        if (isFemale) {
            hairEl.setAttribute('d', 'M6 9 Q6 4 11 3 Q16 4 16 9 Q16 7 14 6 Q11 5 8 6 Q6 7 6 9 M6 10 Q5 14 6 15 M16 10 Q17 14 16 15');
        } else {
            hairEl.setAttribute('d', 'M6 9 Q6 4 11 3 Q16 4 16 9 Q16 7 14 6 Q11 5 8 6 Q6 7 6 9');
        }
        hairEl.setAttribute('fill', hair);
        svg.appendChild(hairEl);

        // Eyes
        const eyeL = document.createElementNS(svgNS, 'circle');
        eyeL.setAttribute('cx', '9.5');
        eyeL.setAttribute('cy', '10');
        eyeL.setAttribute('r', '0.6');
        eyeL.setAttribute('fill', '#1a1a1a');
        svg.appendChild(eyeL);

        const eyeR = document.createElementNS(svgNS, 'circle');
        eyeR.setAttribute('cx', '12.5');
        eyeR.setAttribute('cy', '10');
        eyeR.setAttribute('r', '0.6');
        eyeR.setAttribute('fill', '#1a1a1a');
        svg.appendChild(eyeR);

        return svg;
    }


    // ═══════════════════════════════════════
    //  UTILITIES
    // ═══════════════════════════════════════

    function escHtml(s) {
        const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
    }

    function showToast(msg, type) {
        type = type || 'info';
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.textContent = msg;
        toastContainer.appendChild(el);
        setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2800);
    }

    function addLog(msg, type) {
        type = type || 'info';
        const now = new Date();
        const t = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        const el = document.createElement('div');
        el.className = 'log-entry ' + type;
        el.innerHTML = '<span class="log-time">' + t + '</span>' + escHtml(msg);
        logFeed.prepend(el);
        while (logFeed.children.length > 80) logFeed.removeChild(logFeed.lastChild);
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function randomName() {
        return randomItem(D.firstNames) + ' ' + randomItem(D.lastNames);
    }

    // Clock
    function tickClock() {
        const now = new Date();
        clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    }
    tickClock();
    setInterval(tickClock, 1000);

    // Log toggle
    logToggle.addEventListener('click', () => {
        logSidebar.classList.toggle('open');
    });


    // ═══════════════════════════════════════
    //  FARE ENGINE
    // ═══════════════════════════════════════

    function getDistance(line, fromIdx, toIdx) {
        const mult = D.distanceMultiplier[line] || 2;
        return Math.abs(toIdx - fromIdx) * mult;
    }

    function getBaseFare(classType, distKm) {
        const slabs = D.fareSlabs[classType];
        if (!slabs) return 10;
        for (let i = 0; i < slabs.length; i++) {
            if (distKm <= slabs[i].maxKm) return slabs[i].fare;
        }
        return slabs[slabs.length - 1].fare;
    }

    function calcFare(line, fromIdx, toIdx, classType, ticketType, qty) {
        const dist = getDistance(line, fromIdx, toIdx);
        const base = getBaseFare(classType, dist);
        const mult = D.typeMultiplier[ticketType] || 1;
        const perTicket = base * mult;
        return {
            distance: Math.round(dist),
            baseFare: base,
            perTicket: perTicket,
            total: perTicket * qty,
            qty: qty
        };
    }


    // ═══════════════════════════════════════
    //  QUEUE MANAGEMENT (FIFO)
    // ═══════════════════════════════════════

    function createPersonEl(name, id) {
        const person = document.createElement('div');
        person.className = 'person arriving';
        person.dataset.id = id;
        const body = document.createElement('div');
        body.className = 'person-body';
        // Create realistic walking person SVG
        const svg = createPersonSVG(1, true, true);
        body.appendChild(svg);
        person.appendChild(body);
        person.title = name;
        return person;
    }

    function addCustomerToQueue(customName = null) {
        if (customerQueue.length >= MAX_QUEUE) {
            showToast('FIFO Queue is full (Max ' + MAX_QUEUE + ' passengers)', 'error');
            return null;
        }

        const name = (customName && customName.trim()) ? customName.trim() : randomName();
        const id = nextCustomerID++;
        const el = createPersonEl(name, id);

        customerQueue.push({ id, name, el });
        queueLane.appendChild(el);
        updateQueueDisplay();
        updateWaitingScreen();

        addLog(name + ' joined the queue (FIFO Enqueue · Position ' + customerQueue.length + ').', 'info');
        showToast(name + ' enqueued (Position ' + customerQueue.length + ')', 'info');

        // In manual mode, we do NOT auto-serve! Only if autoDemoMode is on:
        if (!counterBusy && autoDemoMode) {
            setTimeout(() => serveNext(), 800);
        }

        return { id, name };
    }

    function updateQueueDisplay() {
        if (queueCountEl) queueCountEl.textContent = customerQueue.length;
        // Mark first person as "at counter" if being served
        customerQueue.forEach((c, i) => {
            if (c.el) {
                c.el.classList.toggle('at-counter', i === 0 && counterBusy);
            }
        });
    }

    function updateWaitingScreen() {
        if (!waitingStatusMsg) return;

        if (customerQueue.length > 0) {
            const nextPerson = customerQueue[0];
            waitingStatusMsg.textContent = customerQueue.length + ' passenger(s) waiting in FIFO queue.';
            if (waitingPassengerHighlight) waitingPassengerHighlight.style.display = 'flex';
            if (waitingPassengerName) waitingPassengerName.textContent = nextPerson.name + ' (#C' + nextPerson.id + ')';
            if (btnWaitingServe) {
                btnWaitingServe.disabled = counterBusy;
                btnWaitingServe.textContent = '▶ Call & Serve ' + nextPerson.name + ' (Dequeue)';
            }
            if (presBtnDequeue) presBtnDequeue.disabled = counterBusy;
        } else {
            waitingStatusMsg.textContent = 'Queue is empty. Click "+ Add Passenger" or Enqueue above to begin.';
            if (waitingPassengerHighlight) waitingPassengerHighlight.style.display = 'none';
            if (btnWaitingServe) {
                btnWaitingServe.disabled = true;
                btnWaitingServe.textContent = '▶ Waiting for Passengers...';
            }
            if (presBtnDequeue) presBtnDequeue.disabled = true;
        }
    }

    function removeFirstFromQueue() {
        if (customerQueue.length === 0) return null;
        const customer = customerQueue.shift();
        if (customer.el) {
            customer.el.classList.add('served');
            setTimeout(() => {
                if (customer.el && customer.el.parentNode) {
                    customer.el.remove();
                }
            }, 1200);
        }
        updateQueueDisplay();
        updateWaitingScreen();
        return customer;
    }

    function clearQueue() {
        if (customerQueue.length === 0) {
            showToast('Queue is already empty.', 'info');
            return;
        }
        while (customerQueue.length > 0) {
            const c = customerQueue.shift();
            if (c.el && c.el.parentNode) c.el.remove();
        }
        updateQueueDisplay();
        updateWaitingScreen();
        addLog('FIFO Queue cleared by presenter.', 'info');
        showToast('Waiting queue cleared.', 'info');
    }


    // ═══════════════════════════════════════
    //  COUNTER FLOW (Step Machine)
    // ═══════════════════════════════════════

    const STEP_INDEX_MAP = {
        'type': 0,
        'line': 1,
        'stations': 2,
        'class_': 3,
        'qty': 4,
        'date': 4,
        'pay': 5
    };

    function updateStepper(stepKey) {
        const activeIdx = STEP_INDEX_MAP[stepKey] !== undefined ? STEP_INDEX_MAP[stepKey] : -1;
        stepPills.forEach((pill, i) => {
            pill.classList.remove('active', 'done');
            if (activeIdx >= 0) {
                if (i === activeIdx) {
                    pill.classList.add('active');
                } else if (i < activeIdx) {
                    pill.classList.add('done');
                }
            }
        });

        if (btnCancelBooking) {
            btnCancelBooking.style.display = (counterBusy && stepKey !== 'waiting') ? 'inline-block' : 'none';
        }
    }

    function showStep(stepKey) {
        Object.values(steps).forEach(el => el && el.classList.remove('visible'));
        if (steps[stepKey]) {
            steps[stepKey].classList.add('visible');
        }
        updateStepper(stepKey);
        if (stepKey === 'waiting') {
            updateWaitingScreen();
        }
    }

    function serveNext() {
        if (counterBusy) {
            showToast('Counter 2 is busy serving ' + (currentCustomer ? currentCustomer.name : 'a customer'), 'warning');
            return;
        }
        if (customerQueue.length === 0) {
            showToast('Queue is empty! Click "+ Enqueue" to add passengers.', 'warning');
            showStep('waiting');
            return;
        }

        counterBusy = true;
        currentCustomer = customerQueue[0]; // peek head of queue
        booking = {};
        currentQty = 1;
        qtyVal.textContent = '1';

        // Deselect previous step button selections
        $$('.opt-btn').forEach(b => b.classList.remove('selected'));

        updateQueueDisplay();

        lblCustomerName.textContent = currentCustomer.name;
        addLog('Now Serving: ' + currentCustomer.name + ' at Counter 2 (FIFO Dequeue)', 'success');
        showToast('Now Serving ' + currentCustomer.name, 'success');

        // In manual mode, switch to Step 1: Type
        showStep('type');
    }

    function finishCustomer() {
        // remove from queue with animated departure
        removeFirstFromQueue();
        counterBusy = false;
        currentCustomer = null;
        booking = {};

        showStep('waiting');
        updateQueueDisplay();
        updateWaitingScreen();

        // If Auto-Demo is checked, serve next after a pause
        if (autoDemoMode && customerQueue.length > 0) {
            setTimeout(() => serveNext(), 1200);
        }
    }

    function cancelCurrentBooking() {
        if (!counterBusy || !currentCustomer) return;
        const name = currentCustomer.name;
        addLog('Booking transaction cancelled for ' + name + ' at Counter 2.', 'warning');
        showToast('Booking cancelled for ' + name, 'warning');

        // Customer leaves counter
        removeFirstFromQueue();
        counterBusy = false;
        currentCustomer = null;
        booking = {};

        showStep('waiting');
        updateQueueDisplay();
        updateWaitingScreen();
    }


    // ── STEP HANDLERS (Manual presenter navigation) ──

    // Step 1: Ticket Type
    $$('#step-type .opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            booking.ticketType = btn.dataset.type;
            highlightBtn(btn, '#step-type .opt-btn');
            showStep('line');
        });
    });

    // Step 2: Railway Line
    $$('#step-line .opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            booking.line = btn.dataset.line;
            highlightBtn(btn, '#step-line .opt-btn');
            populateStations(booking.line);
            showStep('stations');
        });
    });

    // Step 3: Stations
    $('#btn-confirm-route').addEventListener('click', () => {
        const fromIdx = parseInt(selFrom.value, 10);
        const toIdx = parseInt(selTo.value, 10);
        if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx === toIdx) {
            showToast('From and To cannot be the same station.', 'error');
            return;
        }
        booking.fromIdx = fromIdx;
        booking.toIdx = toIdx;
        booking.fromStation = D.stations[booking.line][fromIdx];
        booking.toStation = D.stations[booking.line][toIdx];
        showStep('class_');
    });

    // Step 4: Class
    $$('#step-class .opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            booking.classType = btn.dataset.class;
            highlightBtn(btn, '#step-class .opt-btn');
            showStep('qty');
        });
    });

    // Step 5: Quantity
    $('#qty-minus').addEventListener('click', () => {
        if (currentQty > 1) { currentQty--; qtyVal.textContent = currentQty; }
    });
    $('#qty-plus').addEventListener('click', () => {
        if (currentQty < 10) { currentQty++; qtyVal.textContent = currentQty; }
    });
    $('#btn-confirm-qty').addEventListener('click', () => {
        booking.qty = currentQty;
        if (booking.ticketType === 'pass') {
            showStep('date');
        } else {
            buildSummary();
            showStep('pay');
        }
    });

    // Step 6: Date (pass only)
    $$('#step-date .opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const today = new Date();
            if (btn.dataset.date === 'tomorrow') {
                today.setDate(today.getDate() + 1);
            }
            booking.startDate = formatDate(today);
            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + 1);
            booking.endDate = formatDate(endDate);
            highlightBtn(btn, '#step-date .opt-btn');
            buildSummary();
            showStep('pay');
        });
    });

    // Back Buttons
    $$('.step-back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const backTo = btn.dataset.back;
            if (backTo) showStep(backTo);
        });
    });

    // Back from Pay step
    if ($('#btn-pay-back')) {
        $('#btn-pay-back').addEventListener('click', () => {
            if (booking.ticketType === 'pass') {
                showStep('date');
            } else {
                showStep('qty');
            }
        });
    }

    // Cancel Transaction button
    if (btnCancelBooking) {
        btnCancelBooking.addEventListener('click', cancelCurrentBooking);
    }

    // Step 7: Pay & Issue Ticket
    $('#btn-pay').addEventListener('click', () => {
        if (!currentCustomer) return;
        const fare = booking.fareInfo;
        totalServed++;
        totalTickets += fare.qty;
        totalRevenue += fare.total;
        updateStats();

        const bId = 'BK-' + (nextBookingID++);
        const typeLabel = booking.ticketType === 'pass' ? 'Monthly Season Pass' :
            booking.ticketType === 'return' ? 'Return Journey' : 'Single Journey';
        const classLabel = booking.classType === 'ac' ? 'AC EMU Suburban' :
            booking.classType === 'first' ? 'I Class (First)' : 'II Class (General)';
        const lineLabel = booking.line.toUpperCase() + ' LINE';

        // Populate UTS Ticket Modal
        if (tktBookingId) tktBookingId.textContent = bId;
        const now = new Date();
        if (tktIssueTime) tktIssueTime.textContent = formatDate(now) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
        if (tktPassengerName) tktPassengerName.textContent = currentCustomer.name;
        if (tktFrom) tktFrom.textContent = booking.fromStation;
        if (tktTo) tktTo.textContent = booking.toStation;
        if (tktLine) tktLine.textContent = lineLabel;
        if (tktDist) tktDist.textContent = '~' + fare.distance + ' km';
        if (tktType) tktType.textContent = typeLabel;
        if (tktClass) tktClass.textContent = classLabel;
        if (tktQty) tktQty.textContent = fare.qty + ' Passenger(s)';
        if (tktValidity) {
            tktValidity.textContent = booking.ticketType === 'pass'
                ? (booking.startDate + ' to ' + booking.endDate)
                : ('Today ' + (booking.departureTime || (pad(now.getHours()) + ':' + pad(now.getMinutes()))) + ' (Valid 1 hr)');
        }
        if (tktTotal) tktTotal.textContent = fare.total;

        // Display Ticket Modal
        if (ticketModal) ticketModal.style.display = 'flex';

        addLog(
            '✓ Ticket Issued [' + bId + '] → ' + currentCustomer.name +
            ' | ' + booking.fromStation + ' → ' + booking.toStation +
            ' | ' + typeLabel + ' ' + classLabel +
            ' | ₹' + fare.total,
            'success'
        );
        showToast('Ticket confirmed [' + bId + '] for ' + currentCustomer.name, 'success');
    });

    // Close Ticket Modal & Board Platform
    if (btnTicketDone) {
        btnTicketDone.addEventListener('click', () => {
            if (ticketModal) ticketModal.style.display = 'none';
            finishCustomer();
        });
    }

    // Presentation Bar Actions
    if (presBtnEnqueue) {
        presBtnEnqueue.addEventListener('click', () => {
            const customName = presPassengerName ? presPassengerName.value.trim() : '';
            addCustomerToQueue(customName || null);
            if (presPassengerName) presPassengerName.value = '';
        });
    }

    if (presPassengerName) {
        presPassengerName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (presBtnEnqueue) presBtnEnqueue.click();
            }
        });
    }

    if (presBtnDequeue) {
        presBtnDequeue.addEventListener('click', () => {
            serveNext();
        });
    }

    if (presBtnClear) {
        presBtnClear.addEventListener('click', () => {
            clearQueue();
        });
    }

    if (btnWaitingServe) {
        btnWaitingServe.addEventListener('click', () => {
            serveNext();
        });
    }

    if (btnWaitingAdd) {
        btnWaitingAdd.addEventListener('click', () => {
            addCustomerToQueue();
        });
    }

    // Toggle Auto-Demo
    if (presToggleAutoDemo) {
        presToggleAutoDemo.addEventListener('change', (e) => {
            autoDemoMode = e.target.checked;
            if (autoDemoMode) {
                addLog('Auto Demo Mode enabled.', 'warning');
                showToast('Auto Demo Mode ON', 'warning');
                startAutoPick();
                if (!counterBusy && customerQueue.length > 0) {
                    serveNext();
                }
            } else {
                stopAutoPick();
                addLog('Manual Presentation Mode active.', 'info');
                showToast('Manual Mode ON (Presenter controls all actions)', 'info');
            }
        });
    }

    // Toggle Auto-Arrival
    if (presToggleAutoArrival) {
        presToggleAutoArrival.addEventListener('change', (e) => {
            autoArrivalMode = e.target.checked;
            if (autoArrivalMode) {
                addLog('Auto Passenger Arrival enabled.', 'info');
                showToast('Auto Arrival ON (Every 5s)', 'info');
                autoArrivalTimer = setInterval(() => addCustomerToQueue(), CUSTOMER_INTERVAL);
            } else {
                if (autoArrivalTimer) clearInterval(autoArrivalTimer);
                autoArrivalTimer = null;
                addLog('Auto Passenger Arrival paused.', 'info');
                showToast('Auto Arrival OFF (Manual Enqueue only)', 'info');
            }
        });
    }


    // ── HELPERS ──

    function highlightBtn(active, selector) {
        $$(selector).forEach(b => b.classList.remove('selected'));
        active.classList.add('selected');
    }

    function populateStations(line) {
        const stns = D.stations[line] || [];
        selFrom.innerHTML = '';
        selTo.innerHTML = '';
        stns.forEach((name, idx) => {
            selFrom.innerHTML += '<option value="' + idx + '">' + escHtml(name) + '</option>';
            selTo.innerHTML += '<option value="' + idx + '">' + escHtml(name) + '</option>';
        });
        // default: random sensible pair
        const from = Math.floor(Math.random() * Math.floor(stns.length / 2));
        const to = from + 3 + Math.floor(Math.random() * 5);
        selFrom.value = from;
        selTo.value = Math.min(to, stns.length - 1);
    }

    function buildSummary() {
        const fare = calcFare(
            booking.line, booking.fromIdx, booking.toIdx,
            booking.classType, booking.ticketType, booking.qty
        );
        booking.fareInfo = fare;

        const typeLabel = booking.ticketType === 'pass' ? 'Monthly Pass' :
            booking.ticketType === 'return' ? 'Return' : 'Single';
        const classLabel = booking.classType === 'ac' ? 'AC EMU' :
            booking.classType === 'first' ? 'I Class' : 'II Class';
        const lineLabel = booking.line.charAt(0).toUpperCase() + booking.line.slice(1);

        let html = '';
        html += '<div class="s-row"><span>Route</span><span class="s-val">' + escHtml(booking.fromStation) + ' → ' + escHtml(booking.toStation) + '</span></div>';
        html += '<div class="s-row"><span>Line</span><span class="s-val">' + lineLabel + '</span></div>';
        html += '<div class="s-row"><span>Distance</span><span class="s-val">~' + fare.distance + ' km</span></div>';
        html += '<div class="s-row"><span>Type</span><span class="s-val">' + typeLabel + '</span></div>';
        html += '<div class="s-row"><span>Class</span><span class="s-val">' + classLabel + '</span></div>';
        html += '<div class="s-row"><span>Tickets</span><span class="s-val">' + fare.qty + '</span></div>';
        if (booking.ticketType === 'pass') {
            html += '<div class="s-row"><span>Valid</span><span class="s-val">' + booking.startDate + ' – ' + booking.endDate + '</span></div>';
        } else {
            // journey within 1 hour
            const now = new Date();
            const dep = new Date(now.getTime() + Math.floor(Math.random() * 45 + 10) * 60000);
            booking.departureTime = pad(dep.getHours()) + ':' + pad(dep.getMinutes());
            html += '<div class="s-row"><span>Journey</span><span class="s-val">Today ' + booking.departureTime + '</span></div>';
        }
        html += '<div class="s-row"><span>Per ticket</span><span class="s-val">₹' + fare.perTicket + '</span></div>';
        html += '<div class="s-row s-total"><span>TOTAL</span><span class="s-val">₹' + fare.total + '</span></div>';

        summaryCard.innerHTML = html;
        payAmountEl.textContent = fare.total;
    }

    function formatDate(d) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function updateStats() {
        statServed.textContent = totalServed;
        statTickets.textContent = totalTickets;
        statRevenue.textContent = '₹' + totalRevenue;
    }


    // ═══════════════════════════════════════
    //  AUTO-SIMULATION — customer arrival
    // ═══════════════════════════════════════

    function autoSimStep() {
        if (!autoDemoMode) return;
        // Automatically pick choices for the current customer at counter
        if (counterBusy && currentCustomer) {
            autoPickForCustomer();
        } else if (!counterBusy && customerQueue.length > 0) {
            serveNext();
        }
    }

    function autoPickForCustomer() {
        // Find which step is currently visible
        const visibleStep = Object.entries(steps).find(([k, el]) => el && el.classList.contains('visible'));
        if (!visibleStep) return;

        const [stepKey] = visibleStep;

        switch (stepKey) {
            case 'type': {
                const btns = Array.from($$('#step-type .opt-btn'));
                const btn = randomItem(btns);
                btn.click();
                break;
            }
            case 'line': {
                const btns = Array.from($$('#step-line .opt-btn'));
                const btn = randomItem(btns);
                btn.click();
                break;
            }
            case 'stations': {
                const stns = D.stations[booking.line] || [];
                const from = Math.floor(Math.random() * Math.floor(stns.length * 0.5));
                const to = from + 2 + Math.floor(Math.random() * Math.min(8, stns.length - from - 1));
                selFrom.value = from;
                selTo.value = Math.min(to, stns.length - 1);
                $('#btn-confirm-route').click();
                break;
            }
            case 'class_': {
                const btns = Array.from($$('#step-class .opt-btn'));
                const weights = [0.6, 0.3, 0.1]; // second, first, ac
                const r = Math.random();
                let idx = 0;
                if (r > weights[0]) idx = 1;
                if (r > weights[0] + weights[1]) idx = 2;
                btns[idx].click();
                break;
            }
            case 'qty': {
                currentQty = Math.random() < 0.6 ? 2 : (Math.random() < 0.5 ? 1 : Math.floor(Math.random() * 4) + 1);
                qtyVal.textContent = currentQty;
                $('#btn-confirm-qty').click();
                break;
            }
            case 'date': {
                const btns = Array.from($$('#step-date .opt-btn'));
                randomItem(btns).click();
                break;
            }
            case 'pay': {
                $('#btn-pay').click();
                setTimeout(() => {
                    if (btnTicketDone && ticketModal && ticketModal.style.display !== 'none') {
                        btnTicketDone.click();
                    }
                }, 1200);
                break;
            }
        }
    }

    // Auto-pick timer — used ONLY if user turns on Auto Demo
    function startAutoPick() {
        stopAutoPick();
        autoPickInterval = setInterval(autoSimStep, 2200);
    }

    function stopAutoPick() {
        if (autoPickInterval) {
            clearInterval(autoPickInterval);
            autoPickInterval = null;
        }
    }


    // ═══════════════════════════════════════
    //  TRAIN ANIMATION ENGINE — Realistic Indian Railway EMU
    // ═══════════════════════════════════════

    const TRAIN_COACHES = 9;
    const COACH_WIDTH = 58;   // 56 + 1 margin + 1
    const TRAIN_WIDTH = TRAIN_COACHES * COACH_WIDTH;

    let trainIdx1 = 0;
    let trainIdx2 = 0;

    const TRAIN_NAMES = [
        'FAST LOCAL', 'SLOW LOCAL', 'AC EMU', 'SEMI FAST',
        'LADIES SPL', 'VIRAR FAST', 'THANE LOCAL', 'ANDHERI LOCAL'
    ];

    function buildTrainDom(trainEl, dest) {
        trainEl.innerHTML = '';
        for (let i = 0; i < TRAIN_COACHES; i++) {
            const coach = document.createElement('div');
            coach.className = 'train-coach';
            if (i === 0) coach.classList.add('engine');
            if (i === TRAIN_COACHES - 1) coach.classList.add('last');

            // Upper maroon stripe
            const stripe = document.createElement('div');
            stripe.className = 'upper-stripe';
            coach.appendChild(stripe);

            // Engine headlight
            if (i === 0) {
                const hl = document.createElement('div');
                hl.className = 'headlight';
                coach.appendChild(hl);
            }

            // Doors on middle coaches
            if (i > 0 && i < TRAIN_COACHES - 1) {
                const doorL = document.createElement('div');
                doorL.className = 'coach-door door-left';
                coach.appendChild(doorL);
                const doorR = document.createElement('div');
                doorR.className = 'coach-door door-right';
                coach.appendChild(doorR);
            }

            // Destination board on first coach
            if (i === 1 && dest) {
                const board = document.createElement('div');
                board.className = 'coach-dest-board';
                board.textContent = dest;
                coach.appendChild(board);
            }

            trainEl.appendChild(coach);
        }
    }

    // Track 1: trains arrive from left, depart to right
    // Track 2: trains arrive from right, depart to left

    function getStopPosition() {
        // center the train on screen
        const screenW = window.innerWidth;
        return (screenW - TRAIN_WIDTH) / 2;
    }

    function animateTrain(trainEl, trackNum, statusEl, dirEl, destEl, timeEl) {
        const screenW = window.innerWidth;
        const stopPos = getStopPosition();

        // pick destination
        const destList = trackNum === 1 ? D.trainDestinations.down : D.trainDestinations.up;
        const destIdx = trackNum === 1 ? trainIdx1 : trainIdx2;
        const dest = destList[destIdx % destList.length];
        if (trackNum === 1) trainIdx1++; else trainIdx2++;

        const trainName = randomItem(TRAIN_NAMES);
        const direction = trackNum === 1 ? 'DN' : 'UP';
        const now = new Date();
        const depTime = new Date(now.getTime() + 30000);

        // Build fresh train DOM with destination
        buildTrainDom(trainEl, dest);

        dirEl.textContent = direction;
        destEl.textContent = dest;

        // Update indicator board
        if (trackNum === 1) {
            indTrain1.textContent = trainName;
            indDest1.textContent = dest;
            indEta1.textContent = 'ARR';
            indEta1.style.color = '#F39C12';
        } else {
            indTrain2.textContent = trainName;
            indDest2.textContent = dest;
            indEta2.textContent = 'ARR';
            indEta2.style.color = '#F39C12';
        }

        // Phase 1: Arrive
        const startPos = trackNum === 1 ? -TRAIN_WIDTH - 50 : screenW + 50;
        trainEl.style.transition = 'none';
        trainEl.style.left = startPos + 'px';
        trainEl.classList.remove('hidden');

        statusEl.textContent = 'ARRIVING';
        statusEl.className = 'track-status arriving';
        timeEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                trainEl.style.transition = 'left 4s cubic-bezier(0.1, 0.0, 0.3, 1.0)';
                trainEl.style.left = stopPos + 'px';
            });
        });

        // Phase 2: Stopped (after 4s arrive)
        setTimeout(() => {
            statusEl.textContent = 'STOPPED';
            statusEl.className = 'track-status stopped';
            timeEl.textContent = pad(depTime.getHours()) + ':' + pad(depTime.getMinutes());

            // Update indicator
            if (trackNum === 1) {
                indEta1.textContent = pad(depTime.getHours()) + ':' + pad(depTime.getMinutes());
                indEta1.style.color = '#2ECC71';
            } else {
                indEta2.textContent = pad(depTime.getHours()) + ':' + pad(depTime.getMinutes());
                indEta2.style.color = '#2ECC71';
            }

            // Spawn boarding/alighting people
            spawnBoardingPeople(trackNum, stopPos);
        }, 4000);

        // Phase 2.5: About to depart
        setTimeout(() => {
            if (trackNum === 1) {
                indEta1.textContent = 'DEP';
                indEta1.style.color = '#E74C3C';
            } else {
                indEta2.textContent = 'DEP';
                indEta2.style.color = '#E74C3C';
            }
        }, 30000);

        // Phase 3: Depart (after 30s wait)
        setTimeout(() => {
            statusEl.textContent = 'DEPARTING';
            statusEl.className = 'track-status departing';

            const exitPos = trackNum === 1 ? screenW + 50 : -TRAIN_WIDTH - 50;
            trainEl.style.transition = 'left 4s cubic-bezier(0.5, 0.0, 0.8, 1.0)';
            trainEl.style.left = exitPos + 'px';
        }, 34000); // 4s arrive + 30s wait

        // Phase 4: Gone — reset for next train
        setTimeout(() => {
            statusEl.textContent = '—';
            statusEl.className = 'track-status';
            dirEl.textContent = '—';
            destEl.textContent = '';
            timeEl.textContent = '';
            trainEl.classList.add('hidden');

            if (trackNum === 1) {
                indTrain1.textContent = '—';
                indDest1.textContent = '—';
                indEta1.textContent = '—';
                indEta1.style.color = '';
            } else {
                indTrain2.textContent = '—';
                indDest2.textContent = '—';
                indEta2.textContent = '—';
                indEta2.style.color = '';
            }
        }, 38000); // 4s arrive + 30s wait + 4s depart
    }

    // Stagger: Track 1 starts immediately, Track 2 starts after 20s
    function startTrainLoop() {
        // Track 1 loop
        function loopTrack1() {
            animateTrain(train1, 1, pf1Status, infoDir1, infoDest1, infoTime1);
            setTimeout(loopTrack1, 42000); // 4+30+4 + 4s gap
        }

        // Track 2 loop (offset by 20s)
        function loopTrack2() {
            animateTrain(train2, 2, pf2Status, infoDir2, infoDest2, infoTime2);
            setTimeout(loopTrack2, 42000);
        }

        loopTrack1();
        setTimeout(loopTrack2, 20000);
    }


    // ═══════════════════════════════════════
    //  FOOT OVERBRIDGE (FOB) — Bridges above tracks
    // ═══════════════════════════════════════

    function buildFootOverbridge() {
        if (!fobContainer || !tracksArea) return;

        const areaH = tracksArea.offsetHeight;
        const areaW = tracksArea.offsetWidth;

        fobContainer.innerHTML = '';

        // Two FOBs: one at ~25% and one at ~75% of width
        const fobPositions = [
            { x: Math.floor(areaW * 0.22), w: 40 },
            { x: Math.floor(areaW * 0.78), w: 40 }
        ];

        fobPositions.forEach((pos, idx) => {
            // Main bridge spanning full height of tracks area
            const bridge = document.createElement('div');
            bridge.className = 'fob-bridge';
            bridge.style.left = pos.x + 'px';
            bridge.style.width = pos.w + 'px';
            bridge.style.top = '0px';
            bridge.style.height = '100%';
            bridge.style.height = '14px';
            bridge.style.top = '2px';
            fobContainer.appendChild(bridge);

            // Railing on top
            const railing = document.createElement('div');
            railing.className = 'fob-railing';
            railing.style.left = pos.x + 'px';
            railing.style.width = pos.w + 'px';
            railing.style.top = '-4px';
            fobContainer.appendChild(railing);

            // Left pillar
            const pillarL = document.createElement('div');
            pillarL.className = 'fob-pillar';
            pillarL.style.left = (pos.x - 2) + 'px';
            pillarL.style.top = '0px';
            pillarL.style.height = areaH + 'px';
            fobContainer.appendChild(pillarL);

            // Right pillar
            const pillarR = document.createElement('div');
            pillarR.className = 'fob-pillar';
            pillarR.style.left = (pos.x + pos.w - 4) + 'px';
            pillarR.style.top = '0px';
            pillarR.style.height = areaH + 'px';
            fobContainer.appendChild(pillarR);

            // Walking people on the bridge
            spawnFOBPeople(pos.x, pos.w, idx);
        });

        // Escalator near first FOB
        buildEscalator(fobPositions[0].x + fobPositions[0].w + 8, 'UP');
        // Staircase near second FOB
        buildEscalator(fobPositions[1].x - 22, 'DN');
    }

    function spawnFOBPeople(x, w, fobIdx) {
        // Spawn a few tiny walking people on the bridge every few seconds
        function addFOBPerson() {
            const person = document.createElement('div');
            person.className = 'fob-person';
            const svg = createPersonSVG(0.45, true, Math.random() > 0.5);
            person.appendChild(svg);

            const startX = Math.random() > 0.5 ? x : x + w;
            const endX = startX === x ? x + w : x;
            person.style.left = startX + 'px';
            person.style.top = '-2px';

            fobContainer.appendChild(person);

            // Walk across
            const duration = 3000 + Math.random() * 2000;
            person.style.transition = 'left ' + duration + 'ms linear';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    person.style.left = endX + 'px';
                });
            });

            setTimeout(() => person.remove(), duration + 200);
        }

        // Initial people
        for (let i = 0; i < 2; i++) {
            setTimeout(addFOBPerson, i * 1000 + fobIdx * 500);
        }
        // Recurring
        setInterval(addFOBPerson, 4000 + fobIdx * 1500);
    }

    function buildEscalator(xPos, direction) {
        const esc = document.createElement('div');
        esc.className = 'escalator';
        esc.style.left = xPos + 'px';
        esc.style.top = '0px';
        esc.style.width = '14px';
        esc.style.height = '100%';

        const body = document.createElement('div');
        body.className = 'escalator-body';

        const steps = document.createElement('div');
        steps.className = 'escalator-steps';
        steps.style.setProperty('--escalator-angle', direction === 'UP' ? '150deg' : '30deg');
        body.appendChild(steps);

        const railL = document.createElement('div');
        railL.className = 'escalator-rail-left';
        body.appendChild(railL);

        const railR = document.createElement('div');
        railR.className = 'escalator-rail-right';
        body.appendChild(railR);

        esc.appendChild(body);

        const label = document.createElement('div');
        label.className = 'escalator-label';
        label.textContent = direction === 'UP' ? '▲ ESC' : '▼ ESC';
        esc.appendChild(label);

        fobContainer.appendChild(esc);
    }


    // ═══════════════════════════════════════
    //  PLATFORM LIFE — People walking, boarding/alighting
    // ═══════════════════════════════════════

    function spawnPlatformPeople() {
        if (!platformFloor) return;

        function addPlatformPerson() {
            const person = document.createElement('div');
            person.className = 'platform-person';
            const goingRight = Math.random() > 0.5;
            const svg = createPersonSVG(0.55, true, goingRight);
            person.appendChild(svg);

            // Position within platform floor
            const floorRect = platformFloor.getBoundingClientRect();
            const startX = goingRight ? -20 : floorRect.width + 20;
            person.style.left = startX + 'px';
            person.style.top = (2 + Math.random() * 16) + 'px';

            platformFloor.appendChild(person);

            // Animate walk across platform
            const endX = goingRight ? floorRect.width + 30 : -30;
            const duration = 6000 + Math.random() * 6000;
            person.style.transition = 'left ' + duration + 'ms linear';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    person.style.left = endX + 'px';
                });
            });

            setTimeout(() => person.remove(), duration + 200);
        }

        // Initial people
        for (let i = 0; i < 4; i++) {
            setTimeout(addPlatformPerson, i * 800);
        }
        // Continuous stream
        setInterval(addPlatformPerson, 2500 + Math.random() * 1500);
    }

    function spawnBoardingPeople(trackNum, trainStopPos) {
        // When a train stops, spawn people boarding and alighting
        const track = trackNum === 1 ? $('#track-1') : $('#track-2');
        if (!track) return;

        const trainW = TRAIN_WIDTH;
        const coachW = COACH_WIDTH;
        const numPeople = 6 + Math.floor(Math.random() * 6);

        for (let i = 0; i < numPeople; i++) {
            setTimeout(() => {
                const person = document.createElement('div');
                const isAlighting = Math.random() > 0.4;
                person.className = 'boarding-person ' + (isAlighting ? 'alighting' : 'boarding');

                const svg = createPersonSVG(0.4, true, Math.random() > 0.5);
                person.appendChild(svg);

                // Position near a door of a random coach
                const coachIdx = 1 + Math.floor(Math.random() * (TRAIN_COACHES - 2));
                const personX = trainStopPos + coachIdx * coachW + coachW / 2;
                person.style.left = personX + 'px';

                // Set drift direction for alighting
                const driftX = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 15);
                person.style.setProperty('--drift-x', driftX + 'px');

                if (isAlighting) {
                    person.style.top = '0px';
                } else {
                    person.style.bottom = '0px';
                }

                track.appendChild(person);
                setTimeout(() => person.remove(), 3000);
            }, i * 400 + Math.random() * 800);
        }

        // Second wave of boarding near departure
        setTimeout(() => {
            const wave2 = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < wave2; i++) {
                setTimeout(() => {
                    const person = document.createElement('div');
                    person.className = 'boarding-person boarding';
                    const svg = createPersonSVG(0.4, true, Math.random() > 0.5);
                    person.appendChild(svg);
                    const coachIdx = 1 + Math.floor(Math.random() * (TRAIN_COACHES - 2));
                    const personX = trainStopPos + coachIdx * coachW + coachW / 2;
                    person.style.left = personX + 'px';
                    person.style.bottom = '0px';
                    track.appendChild(person);
                    setTimeout(() => person.remove(), 3000);
                }, i * 300);
            }
        }, 25000); // Board just before departure
    }


    // ═══════════════════════════════════════
    //  INIT — MANUAL PRESENTATION MODE
    // ═══════════════════════════════════════

    addLog('System online — Counter 2 is open.', 'success');
    addLog('Manual Presentation Mode is ACTIVE — Presenter controls queue & counter.', 'info');
    updateStats();

    // Enqueue 3 initial passengers so presenter has immediate demo data
    setTimeout(() => {
        addCustomerToQueue('Rahul Sharma');
        addCustomerToQueue('Priya Patel');
        addCustomerToQueue('Amit Verma');
        showStep('waiting');
    }, 350);

    // Platform trains continue in background for visual ambiance
    startTrainLoop();

    // Build FOB after a tick so dimensions are ready
    setTimeout(() => {
        buildFootOverbridge();
        spawnPlatformPeople();
    }, 500);

    // Rebuild FOB on resize
    window.addEventListener('resize', () => {
        clearTimeout(window._fobResizeTimer);
        window._fobResizeTimer = setTimeout(buildFootOverbridge, 300);
    });

})();
