// Configuración de Tailwind CSS para BellaStyle.
// "content" le dice a Tailwind en qué archivos buscar clases,
// así el CSS final solo incluye las clases que se usan.
module.exports = {
  // El modo oscuro se activa con la clase "oscuro" en <html> (js/tema.js)
  darkMode: ['class', '.oscuro'],
  content: {
    relative: true, // las rutas se leen desde esta carpeta (frontend)
    files: ['./*.html', './js/*.js'],
  },
  // Clases que se arman en JavaScript (estado-${estado}) y Tailwind no puede ver
  safelist: ['estado-Pendiente', 'estado-Confirmada', 'estado-Finalizada', 'estado-Cancelada'],
  theme: {
    extend: {
      // Los colores salen de variables CSS (src/estilos.css).
      // Así el modo oscuro solo cambia las variables y no hay que tocar el HTML.
      colors: {
        // tinta: color del texto
        tinta: 'rgb(var(--tinta) / <alpha-value>)',
        // blanco: fondo de tarjetas y campos (en modo oscuro es un gris oscuro)
        white: 'rgb(var(--blanco) / <alpha-value>)',
        // bella: rosa pastel (botones, acentos). Los tonos 600-800 se usan para texto.
        bella: {
          50: 'rgb(var(--bella-50) / <alpha-value>)',
          100: 'rgb(var(--bella-100) / <alpha-value>)',
          200: 'rgb(var(--bella-200) / <alpha-value>)',
          300: 'rgb(var(--bella-300) / <alpha-value>)',
          400: 'rgb(var(--bella-400) / <alpha-value>)',
          500: 'rgb(var(--bella-500) / <alpha-value>)',
          600: 'rgb(var(--bella-600) / <alpha-value>)',
          700: 'rgb(var(--bella-700) / <alpha-value>)',
          800: 'rgb(var(--bella-800) / <alpha-value>)',
          900: 'rgb(var(--bella-900) / <alpha-value>)',
        },
        // lavanda: segundo color pastel (detalles)
        lavanda: {
          100: 'rgb(var(--lavanda-100) / <alpha-value>)',
          200: 'rgb(var(--lavanda-200) / <alpha-value>)',
          300: 'rgb(var(--lavanda-300) / <alpha-value>)',
          400: 'rgb(var(--lavanda-400) / <alpha-value>)',
          500: 'rgb(var(--lavanda-500) / <alpha-value>)',
        },
        // noche: fondo de la página
        noche: {
          800: 'rgb(var(--noche-800) / <alpha-value>)',
          900: 'rgb(var(--noche-900) / <alpha-value>)',
          950: 'rgb(var(--noche-950) / <alpha-value>)',
        },
        // oro: dorado para precios
        oro: 'rgb(var(--oro) / <alpha-value>)',
      },
      fontFamily: {
        titulo: ['"Cormorant Garamond"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        aparecer: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Manchas de color del fondo que se mueven despacio
        flotar: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(40px, -30px) scale(1.08)' },
          '66%':      { transform: 'translate(-30px, 20px) scale(.95)' },
        },
        // Brillo que recorre el texto degradado
        brillo: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        girar: {
          to: { transform: 'rotate(360deg)' },
        },
        subirBajar: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        aparecer: 'aparecer .45s ease-out both',
        flotar: 'flotar 18s ease-in-out infinite',
        brillo: 'brillo 6s linear infinite',
        girar: 'girar 40s linear infinite',
        'subir-bajar': 'subirBajar 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
