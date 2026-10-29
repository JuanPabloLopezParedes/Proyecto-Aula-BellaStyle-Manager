// Página de inicio (welcome.html): animaciones y datos desde la API

// 1. El menú se vuelve opaco cuando se baja en la página
const menu = document.getElementById('menu');
window.addEventListener('scroll', () => {
    const abajo = window.scrollY > 40;
    menu.classList.toggle('bg-noche-950/80', abajo);
    menu.classList.toggle('backdrop-blur', abajo);
    menu.classList.toggle('border-tinta/5', abajo);
});

// 2. Los elementos con clase "revelar" aparecen cuando entran en pantalla.
//    IntersectionObserver avisa cuando un elemento se vuelve visible.
const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
            const el = entrada.target;
            el.classList.add('visible');
            observador.unobserve(el);
            // Terminada la entrada, el efecto hover responde rápido y sin retraso
            setTimeout(() => {
                el.style.transitionDelay = '0ms';
                el.style.transitionDuration = '300ms';
            }, 1200);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.revelar').forEach((el) => observador.observe(el));

// 3. Carga los servicios desde la base de datos
async function cargarDatos() {
    const servicios = await pedir('/servicios');

    const lista = document.getElementById('listaServicios');
    if (!servicios.success) {
        lista.innerHTML = '<p class="text-tinta/80">Enciende el servidor para ver los servicios.</p>';
        return;
    }
    lista.innerHTML = servicios.data.map((s, i) => `
        <article class="revelar tarjeta group p-6 hover:-translate-y-1 hover:border-bella-400/40" style="transition-delay:${i * 60}ms">
            <h3 class="text-2xl font-bold transition group-hover:text-bella-800">${escapar(s.nombre)}</h3>
            <div class="mt-4 flex items-end justify-between">
                <p class="font-titulo text-3xl font-bold text-oro">${pesos(s.precio)}</p>
                <p class="text-sm text-tinta/80">${s.duracion_min} min</p>
            </div>
        </article>`).join('');
    lista.querySelectorAll('.revelar').forEach((el) => observador.observe(el));
}

cargarDatos();
