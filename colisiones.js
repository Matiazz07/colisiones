// ==================== 1. NAVEGACIÓN SPA ====================
function cambiarVista(vistaDestino) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('activo'));

    document.getElementById('vista-' + vistaDestino).classList.add('activa');

    if (vistaDestino === 'simulador') {
        document.getElementById('btnNavSimulador').classList.add('activo');
    } else {
        document.getElementById('btnNavTeoria').classList.add('activo');
    }
}

// ==================== 2. GRÁFICO (Chart.js) ====================
const ctxChart = document.getElementById('graficoVelocidad').getContext('2d');
let arrayTiempo = Array.from({ length: 50 }, (_, i) => i);
let arrayVelA = Array(50).fill(0);
let arrayVelB = Array(50).fill(0);

const grafica = new Chart(ctxChart, {
    type: 'line',
    data: {
        labels: arrayTiempo,
        datasets: [
            { label: 'Velocidad A', borderColor: '#e11d48', data: arrayVelA, tension: 0.2, pointRadius: 0, borderWidth: 2 },
            { label: 'Velocidad B', borderColor: '#0284c7', data: arrayVelB, tension: 0.2, pointRadius: 0, borderWidth: 2 }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { color: '#64748b' },
                suggestedMin: -15,
                suggestedMax: 15
            },
            x: { display: false }
        },
        plugins: { legend: { labels: { color: '#1e293b' } } }
    }
});

// ==================== 3. MOTOR DE FÍSICA ====================
const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

let animacionID;
let simulando = false;
let frameCount = 0;

let esferaA = { x: 150, y: 150, radio: 30, masa: 20, vel: 0, color: "#e11d48" };
let esferaB = { x: 650, y: 150, radio: 30, masa: 15, vel: 0, color: "#0284c7" };

const v1Text = document.getElementById("v1-actual");
const v2Text = document.getElementById("v2-actual");

// Historial de Eventos
let historialEventos = [];

function registrarEvento(nombreEvento) {
    historialEventos.push({
        evento: nombreEvento,
        vA: esferaA.vel.toFixed(2),
        vB: esferaB.vel.toFixed(2)
    });
}

function dibujarLienzo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Suelo
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(canvas.width, 180);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    dibujarEsfera(esferaA);
    dibujarEsfera(esferaB);
}

function dibujarEsfera(esfera) {
    ctx.beginPath();
    ctx.arc(esfera.x, esfera.y, esfera.radio, 0, Math.PI * 2);
    ctx.fillStyle = esfera.color;
    ctx.fill();

    // Brillo 3D
    ctx.beginPath();
    ctx.arc(esfera.x - 10, esfera.y - 10, esfera.radio / 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();
}

function actualizarFisica() {
    if (!simulando) return;

    esferaA.x += esferaA.vel;
    esferaB.x += esferaB.vel;

    let distancia = Math.abs(esferaA.x - esferaB.x);

    let acercandose = false;
    if (esferaA.x < esferaB.x && esferaA.vel > esferaB.vel) acercandose = true;
    if (esferaA.x > esferaB.x && esferaA.vel < esferaB.vel) acercandose = true;

    // COLISIÓN
    if (distancia <= esferaA.radio + esferaB.radio && acercandose) {
        let inputCoef = document.getElementById("coeficiente");
        let e = inputCoef ? parseFloat(inputCoef.value) : 1;
        if (isNaN(e)) e = 1;

        let pTotal = (esferaA.masa * esferaA.vel) + (esferaB.masa * esferaB.vel);

        let vAFinal = (pTotal + esferaB.masa * e * (esferaB.vel - esferaA.vel)) / (esferaA.masa + esferaB.masa);
        let vBFinal = (pTotal + esferaA.masa * e * (esferaA.vel - esferaB.vel)) / (esferaA.masa + esferaB.masa);

        esferaA.vel = vAFinal;
        esferaB.vel = vBFinal;

        let superposicion = (esferaA.radio + esferaB.radio) - distancia;
        if (esferaA.x < esferaB.x) {
            esferaA.x -= superposicion / 2;
            esferaB.x += superposicion / 2;
        } else {
            esferaA.x += superposicion / 2;
            esferaB.x -= superposicion / 2;
        }

        registrarEvento("💥 Choque Central (e=" + e + ")");
    }

    // Rebote Paredes
    let chocoPared = false;
    if (esferaA.x - esferaA.radio <= 0 || esferaA.x + esferaA.radio >= canvas.width) {
        esferaA.vel *= -1;
        chocoPared = true;
    }
    if (esferaB.x - esferaB.radio <= 0 || esferaB.x + esferaB.radio >= canvas.width) {
        esferaB.vel *= -1;
        chocoPared = true;
    }

    if (chocoPared) {
        registrarEvento("🧱 Rebote en Muro");
    }

    // Actualizar UI
    v1Text.innerText = esferaA.vel.toFixed(2);
    v2Text.innerText = esferaB.vel.toFixed(2);

    // Actualizar Gráfico
    frameCount++;
    if (frameCount % 2 === 0) {
        arrayVelA.push(esferaA.vel); arrayVelA.shift();
        arrayVelB.push(esferaB.vel); arrayVelB.shift();
        grafica.update();
    }
}

function loop() {
    actualizarFisica();
    dibujarLienzo();
    animacionID = requestAnimationFrame(loop);
}

// ==================== 4. CONTROLES ====================
document.getElementById("btnSimular").addEventListener("click", () => {
    if (!simulando) {
        esferaA.masa = parseFloat(document.getElementById("m1").value);
        esferaA.vel = parseFloat(document.getElementById("v1").value);
        esferaA.radio = 20 + (esferaA.masa / 5);

        esferaB.masa = parseFloat(document.getElementById("m2").value);
        esferaB.vel = parseFloat(document.getElementById("v2").value);
        esferaB.radio = 20 + (esferaB.masa / 5);

        esferaA.y = 180 - esferaA.radio;
        esferaB.y = 180 - esferaB.radio;

        simulando = true;
        document.getElementById("btnSimular").innerText = "⏸ Pausar";

        registrarEvento("▶ Inicio Simulación");
    } else {
        simulando = false;
        document.getElementById("btnSimular").innerText = "▶ Continuar";
    }
});

document.getElementById("btnReiniciar").addEventListener("click", () => {
    simulando = false;
    document.getElementById("btnSimular").innerText = "▶ Iniciar Simulación";

    esferaA.x = 150; esferaA.vel = 0;
    esferaB.x = 650; esferaB.vel = 0;
    v1Text.innerText = "0.00"; v2Text.innerText = "0.00";

    arrayVelA.fill(0); arrayVelB.fill(0);
    grafica.update();

    historialEventos = [];
    dibujarLienzo();
});

// ==================== 5. HISTORIAL & MODAL ====================
document.getElementById('graficoVelocidad').addEventListener('click', () => {
    const tbody = document.getElementById('bodyHistorial');
    tbody.innerHTML = '';

    if (historialEventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Aún no hay colisiones registradas. ¡Inicia la simulación!</td></tr>';
    } else {
        historialEventos.forEach(ev => {
            tbody.innerHTML += `<tr>
                <td style="font-weight:bold;">${ev.evento}</td>
                <td class="texto-rosa">${ev.vA}</td>
                <td class="texto-cian">${ev.vB}</td>
            </tr>`;
        });
    }
    document.getElementById('modalHistorial').classList.add('activo');
});

function cerrarModal() {
    document.getElementById('modalHistorial').classList.remove('activo');
}

// ==================== 6. VALIDACIÓN EN TIEMPO REAL ====================
const inputCoeficiente = document.getElementById("coeficiente");
const errorCoeficiente = document.getElementById("errorCoeficiente");
const botonSimular = document.getElementById("btnSimular");

inputCoeficiente.addEventListener("input", () => {
    let valor = parseFloat(inputCoeficiente.value);

    if (valor < 0 || valor > 1 || isNaN(valor)) {
        errorCoeficiente.style.display = "block";
        botonSimular.disabled = true;
        botonSimular.style.opacity = "0.5";
        botonSimular.style.cursor = "not-allowed";
    } else {
        errorCoeficiente.style.display = "none";
        botonSimular.disabled = false;
        botonSimular.style.opacity = "1";
        botonSimular.style.cursor = "pointer";
    }
});

// Iniciar el ciclo de animación (Game Loop)
loop();