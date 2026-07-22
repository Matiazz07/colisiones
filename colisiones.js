const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

// Variables de estado
let animacionID;
let simulando = false;

// Definición de nuestras dos esferas
let esfera1 = { x: 150, y: 150, radio: 30, masa: 20, vel: 0, color: "#ef4444" };
let esfera2 = { x: 650, y: 150, radio: 30, masa: 15, vel: 0, color: "#3b82f6" };

// Referencias a los botones y textos
const btnSimular = document.getElementById("btnSimular");
const btnReiniciar = document.getElementById("btnReiniciar");
const v1Text = document.getElementById("v1-actual");
const v2Text = document.getElementById("v2-actual");

// Función para pintar todo en el canvas
function dibujarLienzo() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar suelo/línea de riel
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(canvas.width, 180);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dibujar Esfera 1
    dibujarEsfera(esfera1);

    // Dibujar Esfera 2
    dibujarEsfera(esfera2);
}

function dibujarEsfera(esfera) {
    ctx.beginPath();
    ctx.arc(esfera.x, esfera.y, esfera.radio, 0, Math.PI * 2);
    ctx.fillStyle = esfera.color;
    ctx.fill();

    // Brillo para darle efecto 3D
    ctx.beginPath();
    ctx.arc(esfera.x - 10, esfera.y - 10, esfera.radio / 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
}

// Lógica de Movimiento y Física
function actualizarFisica() {
    if (!simulando) return;

    // Mover esferas
    esfera1.x += esfera1.vel;
    esfera2.x += esfera2.vel;

    // DETECCIÓN DE COLISIÓN (Si la distancia entre centros es menor o igual a la suma de radios)
    let distancia = Math.abs(esfera1.x - esfera2.x);
    if (distancia <= esfera1.radio + esfera2.radio) {

        // Fórmulas matemáticas de Colisión Elástica 1D
        let v1Final = ((esfera1.masa - esfera2.masa) * esfera1.vel + (2 * esfera2.masa * esfera2.vel)) / (esfera1.masa + esfera2.masa);
        let v2Final = ((esfera2.masa - esfera1.masa) * esfera2.vel + (2 * esfera1.masa * esfera1.vel)) / (esfera1.masa + esfera2.masa);

        // Asignar nuevas velocidades
        esfera1.vel = v1Final;
        esfera2.vel = v2Final;

        // Separar las esferas para evitar que se queden pegadas (bug de superposición)
        let superposicion = (esfera1.radio + esfera2.radio) - distancia;
        if (esfera1.x < esfera2.x) {
            esfera1.x -= superposicion / 2;
            esfera2.x += superposicion / 2;
        } else {
            esfera1.x += superposicion / 2;
            esfera2.x -= superposicion / 2;
        }
    }

    // Rebotar contra las paredes
    if (esfera1.x - esfera1.radio <= 0 || esfera1.x + esfera1.radio >= canvas.width) {
        esfera1.vel *= -1; // Invierte dirección
    }
    if (esfera2.x - esfera2.radio <= 0 || esfera2.x + esfera2.radio >= canvas.width) {
        esfera2.vel *= -1;
    }

    // Actualizar textos en pantalla
    v1Text.innerText = esfera1.vel.toFixed(2);
    v2Text.innerText = esfera2.vel.toFixed(2);
}

// Bucle principal de animación (Game Loop)
function loop() {
    actualizarFisica();
    dibujarLienzo();
    animacionID = requestAnimationFrame(loop);
}

// Controles
btnSimular.addEventListener("click", () => {
    if (!simulando) {
        // Leer valores de los inputs solo al iniciar
        esfera1.masa = parseFloat(document.getElementById("m1").value);
        esfera1.vel = parseFloat(document.getElementById("v1").value);
        // El radio puede depender de la masa para hacerlo más visual
        esfera1.radio = 20 + (esfera1.masa / 5);

        esfera2.masa = parseFloat(document.getElementById("m2").value);
        esfera2.vel = parseFloat(document.getElementById("v2").value);
        esfera2.radio = 20 + (esfera2.masa / 5);

        // Ajustar posición inicial (Y) según el nuevo radio
        esfera1.y = 180 - esfera1.radio;
        esfera2.y = 180 - esfera2.radio;

        simulando = true;
        btnSimular.innerText = "⏸ Pausar";
    } else {
        simulando = false;
        btnSimular.innerText = "▶ Continuar";
    }
});

btnReiniciar.addEventListener("click", () => {
    simulando = false;
    btnSimular.innerText = "▶ Iniciar Simulación";

    // Restaurar posiciones
    esfera1.x = 150;
    esfera1.vel = 0;

    esfera2.x = 650;
    esfera2.vel = 0;

    v1Text.innerText = "0.00";
    v2Text.innerText = "0.00";

    dibujarLienzo();
});

// Iniciar dibujando el lienzo vacío la primera vez
// Encender el motor de física (Game Loop)
loop();