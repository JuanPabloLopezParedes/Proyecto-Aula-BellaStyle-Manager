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
        // Paleta propia del salón
        bella: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#e0428f',
          600: '#c42a75',
          700: '#a01f5f',
          800: '#7a1a4a',
          900: '#4a1030',
        },
        noche: {
          800: '#1f0f1a',
          900: '#140a11',
          950: '#0c060a',
        },
        oro: '#d9b36c',
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
