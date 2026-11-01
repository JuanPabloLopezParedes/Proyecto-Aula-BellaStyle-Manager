// Configuración de Tailwind CSS para BellaStyle.
// "content" le dice a Tailwind en qué archivos buscar clases,
// así el CSS final solo incluye las clases que se usan.
module.exports = {
  content: {
    relative: true, // las rutas se leen desde esta carpeta (frontend)
    files: ['./*.html', './js/*.js'],
  },
  // Clases que se arman en JavaScript (estado-${estado}) y Tailwind no puede ver
  safelist: ['estado-Pendiente', 'estado-Confirmada', 'estado-Finalizada', 'estado-Cancelada'],
  theme: {
    extend: {
      colors: {
        // Paleta propia del salón (tonos pastel de lujo y fondos mate cálidos)
        bella: {
          50:  '#fdf4f7',
          100: '#fbe8ef',
          200: '#f5d0df',
          300: '#ebb0c8',
          400: '#dc85a9',
          500: '#c75b89',
          600: '#ab406e',
          700: '#8d2f58',
          800: '#6e2445',
          900: '#4a182f',
        },
        pastel: {
          crema:    '#f3e9eb',
          perla:    '#eadce0',
          rosa:     '#f2d7e2',
          lavanda:  '#e4dcf2',
          menta:    '#d8efe6',
          durazno:  '#f7e3d4',
          tinta:    '#1e1017',
          subtinta: '#47303c',
        },
        noche: {
          800: '#1c0e17',
          900: '#11080e',
          950: '#090408',
        },
        oro: '#d4af7a',
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
