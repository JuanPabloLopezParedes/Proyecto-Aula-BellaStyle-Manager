// Funciones de tiempo que usan las citas y los horarios.
// Todas las horas se manejan en minutos desde la medianoche: "14:30" -> 870.

const APERTURA = 8 * 60;   // el salón abre a las 8:00
const CIERRE = 19 * 60;    // y cierra a las 19:00
const INTERVALO = 30;      // las horas libres se ofrecen cada 30 minutos

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// "14:30" o "14:30:00" -> 870
function aMinutos(hora) {
    const [h, m] = String(hora).split(':').map(Number);
    return h * 60 + m;
}

// 870 -> "14:30"
function aHora(minutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0');
    const m = String(minutos % 60).padStart(2, '0');
    return `${h}:${m}`;
}

// Dos rangos se cruzan si uno empieza antes de que el otro termine
function seCruzan(inicioA, finA, inicioB, finB) {
    return inicioA < finB && inicioB < finA;
}

// Día de la semana de una fecha "2026-11-03": 0 = domingo ... 6 = sábado
function diaDeLaSemana(fecha) {
    return new Date(fecha + 'T12:00:00Z').getUTCDay();
}

// Fecha y hora actuales en Colombia (UTC-5), aunque el servidor esté en otra zona.
function ahoraColombia() {
    const colombia = new Date(Date.now() - 5 * 60 * 60 * 1000);
    return {
        fecha: colombia.toISOString().slice(0, 10),
        minutos: colombia.getUTCHours() * 60 + colombia.getUTCMinutes()
    };
}

// Fecha válida con formato AAAA-MM-DD
function fechaValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return false;
    const d = new Date(fecha + 'T12:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === fecha;
}

// Hora válida con formato HH:MM, entre 00:00 y 23:59
function horaValida(hora) {
    if (!/^\d{2}:\d{2}$/.test(hora || '')) return false;
    const [h, m] = hora.split(':').map(Number);
    return h < 24 && m < 60;
}

module.exports = {
    APERTURA, CIERRE, INTERVALO, DIAS,
    aMinutos, aHora, seCruzan, diaDeLaSemana, ahoraColombia, fechaValida, horaValida
};
