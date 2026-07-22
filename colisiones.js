// ==================== 1. NAVEGACIÓN SPA ====================
function cambiarVista(vistaDestino) {
    // Ocultar todas las vistas y desactivar botones
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('activo'));

    // Mostrar la vista seleccionada
    document.getElementById('vista-' + vistaDestino).classList.add('activa');

    // Activar el botón correspondiente
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
        responsive: true, maintainAspectRatio: false,
        animation: false,
        scales: {
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } }, // Rejilla oscura sutil
            x: { display: false }
        },
        plugins: { legend: { labels: { color: '#1e293b' } } } // Textos oscuros
    }
});

// ==================== 3. MOTOR DE FÍSICA ====================
const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

let animacionID;
let simulando = false;
let frameCount = 0;

// Esferas con la nueva paleta de colores
let esferaA = { x: 150, y: 150, radio: 30, masa: 20, vel: 0, color: "#ff5c88" };
let esferaB = { x: 650, y: 150, radio: 30, masa: 15, vel: 0, color: "#00f0ff" };

const v1Text = document.getElementById("v1-actual");
const v2Text = document.getElementById("v2-actual");

function dibujarLienzo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Suelo oscuro en vez de blanco
    ctx.beginPath(); ctx.moveTo(0, 180); ctx.lineTo(canvas.width, 180);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"; // <--- LÍNEA CAMBIADA
    ctx.lineWidth = 2; ctx.stroke();

    dibujarEsfera(esferaA);
    dibujarEsfera(esferaB);
}

function dibujarEsfera(esfera) {
    ctx.beginPath(); ctx.arc(esfera.x, esfera.y, esfera.radio, 0, Math.PI * 2);
    ctx.fillStyle = esfera.color; ctx.fill();
    // Brillo 3D
    ctx.beginPath(); ctx.arc(esfera.x - 10, esfera.y - 10, esfera.radio / 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fill();
}

function actualizarFisica() {
    if (!simulando) return;

    esferaA.x += esferaA.vel;
    esferaB.x += esferaB.vel;

    // COLISIÓN ELÁSTICA (Conservación de momento y energía)
    let distancia = Math.abs(esferaA.x - esferaB.x);
    if (distancia <= esferaA.radio + esferaB.radio) {
        let vAFinal = ((esferaA.masa - esferaB.masa) * esferaA.vel + (2 * esferaB.masa * esferaB.vel)) / (esferaA.masa + esferaB.masa);
        let vBFinal = ((esferaB.masa - esferaA.masa) * esferaB.vel + (2 * esferaA.masa * esferaA.vel)) / (esferaA.masa + esferaB.masa);

        esferaA.vel = vAFinal;
        esferaB.vel = vBFinal;

        // Anti-bug (separar para que no se peguen)
        let superposicion = (esferaA.radio + esferaB.radio) - distancia;
        if (esferaA.x < esferaB.x) { esferaA.x -= superposicion / 2; esferaB.x += superposicion / 2; }
        else { esferaA.x += superposicion / 2; esferaB.x -= superposicion / 2; }
    }

    // Rebote en las paredes
    if (esferaA.x - esferaA.radio <= 0 || esferaA.x + esferaA.radio >= canvas.width) { esferaA.vel *= -1; }
    if (esferaB.x - esferaB.radio <= 0 || esferaB.x + esferaB.radio >= canvas.width) { esferaB.vel *= -1; }

    // Actualizar UI
    v1Text.innerText = esferaA.vel.toFixed(2);
    v2Text.innerText = esferaB.vel.toFixed(2);

    // Actualizar Gráfico Chart.js (Cada 2 frames para optimizar rendimiento)
    frameCount++;
    if (frameCount % 2 === 0) {
        arrayVelA.push(esferaA.vel); arrayVelA.shift(); // Mete el nuevo dato y saca el más viejo
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

    // Limpiar gráfico
    arrayVelA.fill(0); arrayVelB.fill(0);
    grafica.update();

    dibujarLienzo();
});

// Arrancar motor
dibujarLienzo();
loop();