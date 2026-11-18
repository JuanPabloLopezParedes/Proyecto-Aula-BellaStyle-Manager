// Catálogo visual completo de BellaStyle:
// - 7 categorías de servicio y 35 sub-servicios con foto de ejemplo real y explicación paso a paso
// - 12 ejemplos reales de trabajos realizados para la sección Galería / Portafolio
// - Catálogo visual de productos de la Tienda (Shampoo de Argán, Mascarilla, Esmalte Gel, Óleo, etc.)

const CATALOGO_DETALLES = [
    {
        claves: ['corte'],
        etiquetaCorta: '✂ Corte de Cabello',
        titulo: 'Corte de Cabello',
        subtitulo: 'Cortes visagistas para dama y caballero con ejemplo visual de cada estilo',
        colorPastel: 'bg-pastel-rosa',
        imagen: 'img/servicios/cat-corte.jpg',
        grupos: [
            {
                categoria: 'Corte para Mujer',
                icono: '♀',
                opciones: [
                    {
                        nombre: 'Corte Bob / Long Bob (Lob)',
                        detalle: 'Corte elegante a la altura del mentón o clavícula con caída pulida, ideal para estilizar el cuello y dar movimiento.',
                        precio: 40000,
                        duracion: 50,
                        imagen: 'img/servicios/corte-bob-long-bob.jpg'
                    },
                    {
                        nombre: 'Corte en Capas Largas o Mariposa',
                        detalle: 'Capas desfiladas que aportan volumen, ligereza y movimiento natural manteniendo el largo de tu cabello.',
                        precio: 38000,
                        duracion: 45,
                        imagen: 'img/servicios/corte-capas-mariposa.jpg'
                    },
                    {
                        nombre: 'Corte Recto / Despuntado Saludable',
                        detalle: 'Elimina horquilla y puntas abiertas con línea simétrica perfecta, lavado relajante y sellado nutritivo.',
                        precio: 35000,
                        duracion: 40,
                        imagen: 'img/servicios/corte-recto-despuntado.jpg'
                    },
                    {
                        nombre: 'Corte Pixie / Flequillo Curtain Bangs',
                        detalle: 'Diseño moderno con contorno facial personalizado y estilizado profesional con cepillo térmico.',
                        precio: 42000,
                        duracion: 50,
                        imagen: 'img/servicios/corte-pixie-curtain-bangs.jpg'
                    }
                ]
            },
            {
                categoria: 'Corte para Hombre',
                icono: '♂',
                opciones: [
                    {
                        nombre: 'Corte Clásico Ejecutivo (Tijera y Máquina)',
                        detalle: 'Acabado limpio, formal y elegante con perfilado de contornos, lavado y peinado con cera mate.',
                        precio: 28000,
                        duracion: 35,
                        imagen: 'img/servicios/corte-clasico-ejecutivo.jpg'
                    },
                    {
                        nombre: 'Degradado / Fade (Low, Mid o High Fade)',
                        detalle: 'Desvanecido milimétrico gradual en laterales y nuca con transición limpia y diseño superior.',
                        precio: 32000,
                        duracion: 45,
                        imagen: 'img/servicios/corte-degradado-fade.jpg'
                    },
                    {
                        nombre: 'Corte Texturizado / Crop o Mullet Moderno',
                        detalle: 'Técnica de tijera y navaja en la zona superior para lograr textura dinámica y estilo urbano actual.',
                        precio: 35000,
                        duracion: 45,
                        imagen: 'img/servicios/corte-texturizado-crop.jpg'
                    },
                    {
                        nombre: 'Corte + Perfilado y Arreglo de Barba',
                        detalle: 'Servicio completo de corte masculino más ritual de barba con toalla tibia, navaja y óleo hidratante.',
                        precio: 42000,
                        duracion: 55,
                        imagen: 'img/servicios/corte-barba-toalla.jpg'
                    }
                ]
            }
        ]
    },
    {
        claves: ['manicure', 'una', 'uñas', 'unas'],
        etiquetaCorta: '✦ Manicure y Uñas',
        titulo: 'Manicure y Diseño de Uñas',
        subtitulo: 'Sistemas profesionales de extensión, gel, acrílico y cuidado integral de manos',
        colorPastel: 'bg-pastel-menta',
        imagen: 'img/servicios/cat-manicure.jpg',
        grupos: [
            {
                categoria: 'Todos los Servicios de Manicure y Uñas',
                icono: '✦',
                opciones: [
                    {
                        nombre: 'Uñas Acrílicas Esculpidas',
                        detalle: 'Extensión resistente esculpida con molde o tip, forma almendrada/coffın/cuadrada y esmaltado en gel.',
                        precio: 85000,
                        duracion: 120,
                        imagen: 'img/servicios/unas-acrilicas.jpg'
                    },
                    {
                        nombre: 'Uñas en Polygel / TechGel',
                        detalle: 'Sistema híbrido ultraligero, flexible y de aspecto natural con máxima resistencia y brillo espejo.',
                        precio: 90000,
                        duracion: 120,
                        imagen: 'img/servicios/unas-polygel.jpg'
                    },
                    {
                        nombre: 'Uñas Press-On / Soft Gel',
                        detalle: 'Tips de gel suave de cobertura completa adheridos con lámpara LED sin maltratar la uña natural.',
                        precio: 70000,
                        duracion: 90,
                        imagen: 'img/servicios/unas-soft-gel.jpg'
                    },
                    {
                        nombre: 'Esmaltado Semipermanente + Limpieza Rusa',
                        detalle: 'Color intacto hasta por 21 días sobre uña natural con limpieza profunda de cutícula e hidratación.',
                        precio: 45000,
                        duracion: 60,
                        imagen: 'img/servicios/unas-semipermanente.jpg'
                    },
                    {
                        nombre: 'Forrado en Base Rubber / Nivelación',
                        detalle: 'Capa niveladora fortificante ideal para uñas delgadas o quebradizas con acabado liso perfecto.',
                        precio: 55000,
                        duracion: 75,
                        imagen: 'img/servicios/unas-base-rubber.jpg'
                    },
                    {
                        nombre: 'Manicure Tradicional + Nail Art',
                        detalle: 'Limpieza anatómica, exfoliación de manos, masaje hidratante y diseño francés o artístico a mano alzada.',
                        precio: 25000,
                        duracion: 45,
                        imagen: 'img/servicios/unas-tradicional-nailart.jpg'
                    }
                ]
            }
        ]
    },
    {
        claves: ['mechas', 'balayage'],
        etiquetaCorta: '✨ Mechas y Balayage',
        titulo: 'Mechas, Balayage e Iluminación',
        subtitulo: 'Diseño de rubios, iluminaciones y aclaraciones protegidas con Plex capilar',
        colorPastel: 'bg-pastel-lavanda',
        imagen: 'img/servicios/cat-mechas.jpg',
        grupos: [
            {
                categoria: 'Todos los Servicios de Mechas e Iluminación',
                icono: '✨',
                opciones: [
                    {
                        nombre: 'Balayage Hand-Painted',
                        detalle: 'Barrido de luz pintado a mano de medios a puntas con transición difuminada sin marcas de raíz.',
                        precio: 180000,
                        duracion: 150,
                        imagen: 'img/servicios/mechas-balayage.jpg'
                    },
                    {
                        nombre: 'Babylights / Micro-Mechas',
                        detalle: 'Hilos ultrafinos de iluminación desde la raíz para un efecto rubio natural, luminoso y multidimensional.',
                        precio: 195000,
                        duracion: 165,
                        imagen: 'img/servicios/mechas-babylights.jpg'
                    },
                    {
                        nombre: 'Contorno / Money Piece + Iluminaciones',
                        detalle: 'Mechas frontales que enmarcan e iluminan tu rostro acompañadas de reflejos suaves en todo el cabello.',
                        precio: 145000,
                        duracion: 120,
                        imagen: 'img/servicios/mechas-contorno-money.jpg'
                    },
                    {
                        nombre: 'Morena Iluminada (Caramelo / Avellana / Miel)',
                        detalle: 'Diseño de reflejos cálidos para bases castañas u oscuras que aporta dimensión sin decoloración extrema.',
                        precio: 165000,
                        duracion: 135,
                        imagen: 'img/servicios/mechas-morena-iluminada.jpg'
                    }
                ]
            }
        ]
    },
    {
        claves: ['pedicure', 'pies'],
        etiquetaCorta: '❀ Pedicure y Spa',
        titulo: 'Pedicure y Spa de Pies',
        subtitulo: 'Relajación, exfoliación podal y estética impecable para tus pies',
        colorPastel: 'bg-pastel-menta',
        imagen: 'img/servicios/cat-pedicure.jpg',
        grupos: [
            {
                categoria: 'Todos los Servicios de Pedicure',
                icono: '❀',
                opciones: [
                    {
                        nombre: 'Pedicure Tradicional Completo',
                        detalle: 'Baño espumoso, limpieza profunda de cutícula, corte anatómico, limado, exfoliación y esmaltado clásico.',
                        precio: 30000,
                        duracion: 60,
                        imagen: 'img/servicios/pedicure-tradicional.jpg'
                    },
                    {
                        nombre: 'Pedicure Semipermanente LED',
                        detalle: 'Pedicure completo con aplicación de esmalte en gel de secado inmediato y brillo duradero por semanas.',
                        precio: 48000,
                        duracion: 70,
                        imagen: 'img/servicios/pedicure-semipermanente.jpg'
                    },
                    {
                        nombre: 'PediSpa Detox & Hidratación Profunda',
                        detalle: 'Sales minerales tibias, remoción suave de durezas, mascarilla podal de menta/argán y masaje relajante.',
                        precio: 60000,
                        duracion: 80,
                        imagen: 'img/servicios/pedispa-detox.jpg'
                    },
                    {
                        nombre: 'Reconstrucción Estética en Acrílico / Gel',
                        detalle: 'Restauración estética y nivelación de uñas de los pies con acabado natural y uniforme.',
                        precio: 65000,
                        duracion: 75,
                        imagen: 'img/servicios/pedicure-reconstruccion.jpg'
                    }
                ]
            }
        ]
    },
    {
        claves: ['peinado', 'evento', 'cepilla'],
        etiquetaCorta: '♛ Peinado para Eventos',
        titulo: 'Peinado para Eventos y Gala',
        subtitulo: 'Estructuras duraderas para novias, grados, quinceañeras y fiestas',
        colorPastel: 'bg-pastel-durazno',
        imagen: 'img/servicios/cat-peinado.jpg',
        grupos: [
            {
                categoria: 'Todos los Servicios de Peinado para Eventos',
                icono: '♛',
                opciones: [
                    {
                        nombre: 'Ondas Glamour / Ondas al Agua o Sirena',
                        detalle: 'Ondas esculpidas de alfombra roja con preparación termoprotectora y fijación flexible de larga duración.',
                        precio: 60000,
                        duracion: 60,
                        imagen: 'img/servicios/peinado-ondas-glamour.jpg'
                    },
                    {
                        nombre: 'Recogido Elegante (Novias, Grados y Gala)',
                        detalle: 'Moño alto, bajo o estructurado con diseño personalizado y colocación de tocado o accesorios.',
                        precio: 85000,
                        duracion: 75,
                        imagen: 'img/servicios/peinado-recogido-gala.jpg'
                    },
                    {
                        nombre: 'Semirecogido Romántico con Trenzas',
                        detalle: 'Diseño bohemio que combina tejido de trenzas artesanales con ondas suaves en el resto del cabello.',
                        precio: 65000,
                        duracion: 60,
                        imagen: 'img/servicios/peinado-semirecogido-trenzas.jpg'
                    },
                    {
                        nombre: 'Cepillado Profesional (Blower) + Planchado Seda',
                        detalle: 'Lavado nutritivo, cepillado con volumen o liso espejo y sellado de puntas con gotas de argán.',
                        precio: 40000,
                        duracion: 45,
                        imagen: 'img/servicios/peinado-cepillado-planchado.jpg'
                    }
                ]
            }
        ]
    },
    {
        claves: ['tinte', 'color', 'decoloracion'],
        etiquetaCorta: '◈ Decoloración y Tinte',
        titulo: 'Decoloración y Tinte / Coloración',
        subtitulo: 'Colorimetría profesional, cubrimiento de canas, tonos cobrizos y decoloración',
        colorPastel: 'bg-pastel-lavanda',
        imagen: 'img/servicios/cat-tinte.jpg',
        grupos: [
            {
                categoria: 'Todos los Servicios de Decoloración y Tinte',
                icono: '◈',
                opciones: [
                    {
                        nombre: 'Tinte Global (Tono Entero)',
                        detalle: 'Coloración uniforme de raíz a puntas con pigmentos de alta fijación, lavado sellador y cepillado.',
                        precio: 120000,
                        duracion: 120,
                        imagen: 'img/servicios/tinte-global.jpg'
                    },
                    {
                        nombre: 'Retoque de Raíz y Cubrimiento 100% de Canas',
                        detalle: 'Aplicación precisa en zona de crecimiento (hasta 2.5 cm) igualando perfectamente el tono de medios a puntas.',
                        precio: 85000,
                        duracion: 90,
                        imagen: 'img/servicios/tinte-retoque-raiz.jpg'
                    },
                    {
                        nombre: 'Baño de Color / Gloss Matizante Sin Amoniaco',
                        detalle: 'Refresca tu color, neutraliza reflejos amarillos o naranjas y devuelve el brillo espejo sin agredir la hebra.',
                        precio: 95000,
                        duracion: 75,
                        imagen: 'img/servicios/tinte-bano-color-gloss.jpg'
                    },
                    {
                        nombre: 'Decoloración Global / Tonos Cobrizos o Fantasía',
                        detalle: 'Aclaración controlada con aditivo protector de enlaces y aplicación de rubio platino, cobrizo o fantasía.',
                        precio: 150000,
                        duracion: 140,
                        imagen: 'img/servicios/tinte-fantasia-cobrizo.jpg'
                    }
                ]
            }
        ]
    },
    {
        claves: ['tratamiento', 'capilar', 'keratina', 'hidratacion'],
        etiquetaCorta: '❖ Tratamiento Capilar',
        titulo: 'Tratamientos y Recuperación Capilar',
        subtitulo: 'Terapias intensivas de hidratación, queratina, bótox capilar y alisado orgánico',
        colorPastel: 'bg-pastel-rosa',
        imagen: 'img/servicios/cat-tratamiento.jpg',
        grupos: [
            {
                categoria: 'Todos los Servicios de Tratamiento Capilar',
                icono: '❖',
                opciones: [
                    {
                        nombre: 'Hidratación Profunda & Bomba Nutritiva de Argán',
                        detalle: 'Mascarilla concentrada de lípidos y óleos esenciales con micromist térmico para cabello seco o poroso.',
                        precio: 55000,
                        duracion: 60,
                        imagen: 'img/servicios/tratamiento-hidratacion.jpg'
                    },
                    {
                        nombre: 'Cauterización / Reconstrucción con Queratina',
                        detalle: 'Repone aminoácidos y queratina en hebras procesadas por decoloración o plancha, devolviendo elasticidad.',
                        precio: 95000,
                        duracion: 90,
                        imagen: 'img/servicios/tratamiento-queratina.jpg'
                    },
                    {
                        nombre: 'Bótox Capilar Antifrizz Efecto Espejo',
                        detalle: 'Rellena fisuras de la fibra capilar, elimina hasta el 90% del frizz y aporta suavidad extrema.',
                        precio: 120000,
                        duracion: 105,
                        imagen: 'img/servicios/tratamiento-botox-capilar.jpg'
                    },
                    {
                        nombre: 'Alisado Orgánico en Aminoácidos (Sin Formol)',
                        detalle: 'Alisado progresivo seguro que disciplina ondas rebeldes y reduce el volumen con brillo natural.',
                        precio: 180000,
                        duracion: 150,
                        imagen: 'img/servicios/tratamiento-alisado-organico.jpg'
                    },
                    {
                        nombre: 'Detox & Oxigenación de Cuero Cabelludo',
                        detalle: 'Limpieza profunda folicular con peeling capilar botánico, alta frecuencia y masaje estimulante.',
                        precio: 65000,
                        duracion: 60,
                        imagen: 'img/servicios/tratamiento-detox-cuero.jpg'
                    }
                ]
            }
        ]
    }
];

// 12 Ejemplos reales de trabajos realizados en BellaStyle para la sección Galería / Portafolio
const GALERIA_TRABAJOS_12 = [
    {
        id: 1,
        filtro: 'corte',
        categoria: 'Corte de Cabello',
        servicioBase: 'Corte de Cabello',
        variedad: 'Corte Bob / Long Bob (Lob)',
        titulo: '01 · Corte Bob Italiano & Sellado',
        detalle: 'Corte de precisión a la altura de la mandíbula con puntas pulidas y brillo espejo.',
        estilista: 'Diana Martínez',
        precio: 40000,
        duracion: 50,
        imagen: 'img/galeria/trabajo-01-bob.jpg'
    },
    {
        id: 2,
        filtro: 'color',
        categoria: 'Mechas y Balayage',
        servicioBase: 'Mechas / Balayage',
        variedad: 'Balayage Hand-Painted',
        titulo: '02 · Balayage Rubio Champagne',
        detalle: 'Iluminación degradada a mano alzada con protección Plex y matiz perlado luminoso.',
        estilista: 'Laura Estilista',
        precio: 180000,
        duracion: 150,
        imagen: 'img/galeria/trabajo-02-balayage.jpg'
    },
    {
        id: 3,
        filtro: 'corte',
        categoria: 'Corte Masculino',
        servicioBase: 'Corte de Cabello',
        variedad: 'Degradado / Fade (Low, Mid o High Fade)',
        titulo: '03 · Mid Fade & Texturizado Superior',
        detalle: 'Desvanecido limpio en laterales con diseño texturizado a tijera en la coronilla.',
        estilista: 'Andrés Morales',
        precio: 32000,
        duracion: 45,
        imagen: 'img/galeria/trabajo-03-fade.jpg'
    },
    {
        id: 4,
        filtro: 'unas',
        categoria: 'Manicure y Uñas',
        servicioBase: 'Manicure',
        variedad: 'Uñas Acrílicas Esculpidas',
        titulo: '04 · Uñas Acrílicas Baby Boomer',
        detalle: 'Estructura almendrada esculpida en acrílico con difuminado rosa pastel y encapsulado.',
        estilista: 'Paula Ríos',
        precio: 85000,
        duracion: 120,
        imagen: 'img/galeria/trabajo-04-acrilicas.jpg'
    },
    {
        id: 5,
        filtro: 'color',
        categoria: 'Mechas e Iluminación',
        servicioBase: 'Mechas / Balayage',
        variedad: 'Morena Iluminada (Caramelo / Avellana / Miel)',
        titulo: '05 · Morena Iluminada Tono Miel',
        detalle: 'Reflejos cálidos en tonos avellana y caramelo sobre base castaña natural.',
        estilista: 'Laura Estilista',
        precio: 165000,
        duracion: 135,
        imagen: 'img/galeria/trabajo-05-morena.jpg'
    },
    {
        id: 6,
        filtro: 'peinado',
        categoria: 'Peinado para Eventos',
        servicioBase: 'Peinado para Evento',
        variedad: 'Recogido Elegante (Novias, Grados y Gala)',
        titulo: '06 · Recogido de Gala & Novia',
        detalle: 'Moño estructurado de alta durabilidad con textura suave y fijación antihumedad.',
        estilista: 'Valeria Mendoza',
        precio: 85000,
        duracion: 75,
        imagen: 'img/galeria/trabajo-06-recogido.jpg'
    },
    {
        id: 7,
        filtro: 'tratamiento',
        categoria: 'Tratamiento Capilar',
        servicioBase: 'Tratamiento Capilar',
        variedad: 'Bótox Capilar Antifrizz Efecto Espejo',
        titulo: '07 · Bótox Capilar & Liso Espejo',
        detalle: 'Restauración profunda de cutícula con reducción total de frizz y brillo sedoso.',
        estilista: 'Camila Torres',
        precio: 120000,
        duracion: 105,
        imagen: 'img/galeria/trabajo-07-botox.jpg'
    },
    {
        id: 8,
        filtro: 'unas',
        categoria: 'Manicure y Uñas',
        servicioBase: 'Manicure',
        variedad: 'Uñas en Polygel / TechGel',
        titulo: '08 · Polygel Francés Moderno',
        detalle: 'Extensión ligera en Polygel con limpieza rusa de cutícula y sonrisa francesa.',
        estilista: 'Paula Ríos',
        precio: 90000,
        duracion: 120,
        imagen: 'img/galeria/trabajo-08-polygel.jpg'
    },
    {
        id: 9,
        filtro: 'color',
        categoria: 'Decoloración y Tinte',
        servicioBase: 'Tinte / Coloración',
        variedad: 'Decoloración Global / Tonos Cobrizos o Fantasía',
        titulo: '09 · Coloración Cobrizo Intenso',
        detalle: 'Diseño de color cobrizo vibrante con baño de brillo y sellado nutritivo de color.',
        estilista: 'Laura Estilista',
        precio: 150000,
        duracion: 140,
        imagen: 'img/galeria/trabajo-09-cobrizo.jpg'
    },
    {
        id: 10,
        filtro: 'unas',
        categoria: 'Pedicure y Spa',
        servicioBase: 'Pedicure',
        variedad: 'PediSpa Detox & Hidratación Profunda',
        titulo: '10 · PediSpa Detox & Gel LED',
        detalle: 'Exfoliación botánica, hidratación térmica podal y esmaltado semipermanente.',
        estilista: 'Paula Ríos',
        precio: 60000,
        duracion: 80,
        imagen: 'img/galeria/trabajo-10-pedispa.jpg'
    },
    {
        id: 11,
        filtro: 'corte',
        categoria: 'Corte y Barbería',
        servicioBase: 'Corte de Cabello',
        variedad: 'Corte + Perfilado y Arreglo de Barba',
        titulo: '11 · Corte Ejecutivo + Ritual de Barba',
        detalle: 'Corte masculino completo acompañado de perfilado de barba con toalla caliente.',
        estilista: 'Andrés Morales',
        precio: 42000,
        duracion: 55,
        imagen: 'img/galeria/trabajo-11-barba.jpg'
    },
    {
        id: 12,
        filtro: 'peinado',
        categoria: 'Peinado para Eventos',
        servicioBase: 'Peinado para Evento',
        variedad: 'Ondas Glamour / Ondas al Agua o Sirena',
        titulo: '12 · Ondas al Agua & Babylights',
        detalle: 'Peinado de ondas definidas de gala sobre rubio iluminado con acabado luminoso.',
        estilista: 'Diana Martínez',
        precio: 60000,
        duracion: 60,
        imagen: 'img/galeria/trabajo-12-ondas.jpg'
    }
];

// Mapa visual de cada producto de la tienda para que tenga su fotografía real y descripción
const CATALOGO_PRODUCTOS_TIENDA = [
    {
        claves: ['shampoo', 'champu'],
        imagen: 'img/productos/shampoo-argan.jpg',
        categoria: 'Cuidado Capilar · Argán',
        descripcion: 'Fórmula libre de sal enriquecida con aceite puro de Argán marroquí que limpia suavemente, hidrata y devuelve el brillo natural.'
    },
    {
        claves: ['mascarilla'],
        imagen: 'img/productos/mascarilla-capilar.jpg',
        categoria: 'Nutrición Intensiva',
        descripcion: 'Tratamiento cremoso de reparación profunda con keratina y manteca de karité para hebras secas, teñidas o decoloradas.'
    },
    {
        claves: ['esmalte', 'gel'],
        imagen: 'img/productos/esmalte-gel.jpg',
        categoria: 'Manicure & Uñas',
        descripcion: 'Esmalte profesional de alto pigmento y brillo espejo con duración de hasta 21 días sin descascararse.'
    },
    {
        claves: ['spray', 'fijador'],
        imagen: 'img/productos/spray-fijador.jpg',
        categoria: 'Finalizador & Peinado',
        descripcion: 'Fijación extra fuerte resistente a la humedad costera sin dejar residuos blancos ni acartonar el peinado.'
    },
    {
        claves: ['oleo', 'macadamia'],
        imagen: 'img/productos/oleo-argan.jpg',
        categoria: 'Elixir de Brillo',
        descripcion: 'Gotero concentrado de Óleo de Argán & Macadamia que sella puntas abiertas, controla el frizz y aporta suavidad inmediata.'
    },
    {
        claves: ['protector', 'termico'],
        imagen: 'img/productos/protector-termico.jpg',
        categoria: 'Protección Térmica',
        descripcion: 'Escudo capilar hasta 230 °C indispensable antes del cepillado, planchado o diseño de ondas con pinza.'
    },
    {
        claves: ['matizador', 'tonificante', 'violeta'],
        imagen: 'img/productos/matizador-violeta.jpg',
        categoria: 'Especial Rubios & Mechas',
        descripcion: 'Neutraliza reflejos amarillos o cobrizos no deseados manteniendo tus mechas, balayage o canas en tono frío perfecto.'
    },
    {
        claves: ['crema', 'exfoliante', 'pedispa'],
        imagen: 'img/productos/crema-pedispa.jpg',
        categoria: 'Spa de Manos y Pies',
        descripcion: 'Crema exfoliante con microgránulos naturales y mentol que renueva la piel, suaviza talones y descansa los pies.'
    },
    {
        claves: ['kit', 'queratina'],
        imagen: 'img/productos/kit-post-queratina.jpg',
        categoria: 'Kit Completo Post-Alisado',
        descripcion: 'Dúo profesional de shampoo + acondicionador sellador que prolonga el efecto de la queratina o bótox capilar en casa.'
    }
];

function limpiarTextoCatalogo(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function obtenerFichaProducto(nombreProducto = '') {
    const limpio = limpiarTextoCatalogo(nombreProducto);
    for (const item of CATALOGO_PRODUCTOS_TIENDA) {
        if (item.claves.some((c) => limpio.includes(c))) {
            return item;
        }
    }
    return {
        imagen: 'img/productos/shampoo-argan.jpg',
        categoria: 'Producto Profesional de Salón',
        descripcion: 'Fórmula cosmética de grado profesional recomendada por nuestras especialistas para el cuidado en casa.'
    };
}

// Busca la ficha detallada según el nombre del servicio o categoría.
function buscarDetalleServicio(nombreServicio, precioBase = null, duracionBase = null) {
    const limpio = limpiarTextoCatalogo(nombreServicio);
    for (const item of CATALOGO_DETALLES) {
        if (item.claves.some((c) => limpio.includes(c))) {
            return item;
        }
    }
    return {
        claves: [],
        etiquetaCorta: nombreServicio || 'Servicio',
        titulo: nombreServicio || 'Servicio BellaStyle',
        subtitulo: 'Atención personalizada con productos profesionales de salón',
        colorPastel: 'bg-pastel-rosa',
        imagen: 'img/servicios/cat-corte.jpg',
        grupos: [
            {
                categoria: 'Opciones incluidas en este servicio',
                icono: '✦',
                opciones: [
                    {
                        nombre: `${nombreServicio} — Sesión Estándar`,
                        detalle: 'Incluye diagnóstico previo con la estilista, aplicación con productos profesionales y acabado final.',
                        precio: precioBase || 45000,
                        duracion: duracionBase || 60,
                        imagen: 'img/servicios/cat-corte.jpg'
                    },
                    {
                        nombre: `${nombreServicio} — Sesión Premium + Hidratación`,
                        detalle: 'Servicio completo acompañado de sellado protector de brillo y asesoría de cuidado en casa.',
                        precio: precioBase ? Number(precioBase) + 20000 : 65000,
                        duracion: duracionBase ? Number(duracionBase) + 20 : 80,
                        imagen: 'img/servicios/cat-tratamiento.jpg'
                    }
                ]
            }
        ]
    };
}

// Inserta la ventana emergente (modal) en el documento una sola vez
function asegurarModalCatalogo() {
    if (document.getElementById('modalCatalogoServicio')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="modalCatalogoServicio" class="w-[calc(100%-1rem)] max-w-4xl rounded-3xl border border-bella-300/70 bg-pastel-crema p-0 text-pastel-tinta shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:w-[calc(100%-2rem)]">
        <div class="flex max-h-[90vh] flex-col overflow-hidden">
          <!-- Cabecera en tono pastel + barra rápida para cambiar de categoría sin cerrar -->
          <div class="border-b border-bella-300/60 bg-pastel-perla/95 px-4 py-4 sm:px-6 sm:py-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5">
                <img id="modalCatImagenCabecera" src="img/servicios/cat-corte.jpg" alt="" class="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-bella-400/60 sm:h-16 sm:w-16">
                <div>
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-bella-600/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-bella-800">
                    &#10022; Catálogo visual con ejemplos reales
                  </span>
                  <h2 id="modalCatTitulo" class="mt-0.5 font-titulo text-2xl font-bold text-pastel-tinta sm:text-4xl"></h2>
                  <p id="modalCatSubtitulo" class="mt-0.5 text-xs font-medium text-pastel-subtinta sm:text-sm"></p>
                </div>
              </div>
              <button type="button" id="modalCatCerrar" class="rounded-xl border border-bella-300/80 bg-pastel-crema px-3 py-1.5 text-xl font-bold leading-none text-pastel-tinta transition hover:bg-bella-200" aria-label="Cerrar ventana">&times;</button>
            </div>
            <!-- Pestañas rápidas para explorar los 7 servicios ahí mismo + buscador rápido -->
            <div id="modalCatNav" class="mt-3.5 flex gap-1.5 overflow-x-auto pb-1"></div>
            <div class="mt-2.5">
              <input id="buscadorEspecialidadModal" type="search" placeholder="🔎 Buscar ejemplo de servicio (ej. Bob, Fade, Acrílicas, Balayage, Cobrizo, Bótox...)"
                     class="campo-pastel py-1.5 text-xs">
            </div>
          </div>

          <!-- Vista ampliada del ejemplo seleccionado -->
          <div id="modalCatVistaPrevia" class="hidden border-b border-bella-300/60 bg-pastel-rosa/60 px-4 py-3.5 sm:px-6"></div>

          <!-- Cuerpo con las tarjetas de cada variedad y su imagen de ejemplo -->
          <div id="modalCatCuerpo" class="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6"></div>

          <!-- Pie del modal -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-bella-300/60 bg-pastel-perla/95 px-4 py-3.5 sm:px-6 sm:py-4">
            <p id="modalCatPieTexto" class="text-xs font-semibold text-pastel-subtinta">
              Toca la imagen de cualquier servicio para ampliar el ejemplo o presiona "Quiero este" para agendarlo.
            </p>
            <div class="flex items-center gap-2">
              <button type="button" id="modalCatBtnCerrar2" class="rounded-xl border border-bella-400/60 bg-pastel-crema px-4 py-2 text-xs font-bold text-pastel-tinta transition hover:bg-bella-200/70">Cerrar</button>
              <a id="modalCatBtnAgendar" href="index.html?rol=cliente" class="btn-primario px-4 py-2 text-xs">Ir a agendar cita &rarr;</a>
            </div>
          </div>
        </div>
      </dialog>
    `);

    const dialog = document.getElementById('modalCatalogoServicio');
    document.getElementById('modalCatCerrar').addEventListener('click', () => dialog.close());
    document.getElementById('modalCatBtnCerrar2').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
    });
}

// Abre la pantalla emergente mostrando todos los tipos/variedades del servicio seleccionado con su foto de ejemplo.
function abrirModalServicio(nombreServicio, opciones = {}) {
    asegurarModalCatalogo();

    const detalle = buscarDetalleServicio(nombreServicio, opciones.precio, opciones.duracion);
    const dialog = document.getElementById('modalCatalogoServicio');
    document.getElementById('modalCatTitulo').textContent = detalle.titulo;
    document.getElementById('modalCatSubtitulo').textContent = detalle.subtitulo;

    const imgCab = document.getElementById('modalCatImagenCabecera');
    if (imgCab) {
        imgCab.src = detalle.imagen || 'img/servicios/cat-corte.jpg';
        imgCab.alt = detalle.titulo;
    }

    const vistaPrevia = document.getElementById('modalCatVistaPrevia');
    if (vistaPrevia) {
        vistaPrevia.classList.add('hidden');
        vistaPrevia.innerHTML = '';
    }

    // Barra superior de pestañas para saltar entre las 7 categorías sin cerrar el modal
    const nav = document.getElementById('modalCatNav');
    nav.innerHTML = CATALOGO_DETALLES.map((item) => {
        const activo = item.titulo === detalle.titulo;
        return `<button type="button" data-cambiar-cat="${escapar(item.titulo)}"
                        class="whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            activo
                                ? 'bg-bella-600 text-white shadow-sm'
                                : 'border border-bella-300/70 bg-pastel-crema text-pastel-tinta hover:bg-bella-200/70'
                        }">
                  ${escapar(item.etiquetaCorta)}
                </button>`;
    }).join('');

    nav.querySelectorAll('button[data-cambiar-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
            abrirModalServicio(btn.dataset.cambiarCat, {});
        });
    });

    const enPanelClienta = Boolean(document.getElementById('formCita') && !document.querySelector('[data-rol="Clienta"]')?.classList.contains('hidden'));
    const btnAgendar = document.getElementById('modalCatBtnAgendar');
    if (enPanelClienta) {
        btnAgendar.classList.add('hidden');
        document.getElementById('modalCatPieTexto').textContent = 'Selecciona una especialidad de la lista para cargarla directamente en tu formulario de cita.';
    } else {
        btnAgendar.classList.remove('hidden');
        const sesion = typeof obtenerSesion === 'function' ? obtenerSesion() : null;
        btnAgendar.href = sesion ? 'panel.html' : 'index.html?rol=cliente';
        btnAgendar.textContent = sesion ? 'Ir a mi panel para agendar →' : 'Iniciar sesión para agendar →';
    }

    const cuerpo = document.getElementById('modalCatCuerpo');
    cuerpo.innerHTML = detalle.grupos.map((grupo) => `
      <div>
        <div class="mb-3.5 flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg ${detalle.colorPastel} text-sm font-bold text-bella-900 shadow-sm">${grupo.icono}</span>
          <h3 class="font-sans text-sm font-bold uppercase tracking-wider text-pastel-tinta">${escapar(grupo.categoria)}</h3>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          ${grupo.opciones.map((op, idx) => {
            const insignia = idx === 0
                ? '<span class="inline-block rounded-full bg-amber-400/30 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-950">🔥 Más pedido</span>'
                : (idx === 1 ? '<span class="inline-block rounded-full bg-bella-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-bella-900">✨ Tendencia</span>' : '');
            const imgOp = op.imagen || detalle.imagen || 'img/servicios/cat-corte.jpg';
            return `
            <div data-tarjeta-especialidad="${escapar((op.nombre + ' ' + op.detalle).toLowerCase())}"
                 class="flex flex-col justify-between overflow-hidden rounded-2xl border border-bella-300/80 bg-white shadow-sm transition hover:border-bella-500 hover:shadow-md">
              <div>
                <!-- Imagen grande y clara de ejemplo del servicio -->
                <div class="relative h-44 w-full overflow-hidden bg-pastel-perla">
                  <img src="${escapar(imgOp)}" alt="Ejemplo de ${escapar(op.nombre)}" loading="lazy"
                       class="h-full w-full object-cover transition duration-500 hover:scale-105">
                  <div class="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
                    ${insignia || '<span></span>'}
                    <span class="rounded-xl bg-white/95 px-2.5 py-1 text-xs font-extrabold text-bella-900 shadow-sm">${pesos(op.precio)}</span>
                  </div>
                  <button type="button"
                          data-ampliar-img="${escapar(imgOp)}"
                          data-ampliar-nombre="${escapar(op.nombre)}"
                          data-ampliar-detalle="${escapar(op.detalle)}"
                          data-ampliar-precio="${op.precio}"
                          data-ampliar-duracion="${op.duracion}"
                          data-ampliar-categoria="${escapar(grupo.categoria)}"
                          class="absolute bottom-2.5 right-2.5 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm transition hover:bg-bella-600">
                    🔍 Ver ejemplo grande
                  </button>
                </div>
                <div class="p-4 pb-2">
                  <h4 class="font-sans text-base font-bold leading-snug text-pastel-tinta">${escapar(op.nombre)}</h4>
                  <p class="mt-1.5 text-xs leading-relaxed text-pastel-subtinta">${escapar(op.detalle)}</p>
                </div>
              </div>
              <div class="mt-2 flex items-center justify-between border-t border-bella-200/70 bg-pastel-perla/50 px-4 py-2.5">
                <span class="text-xs font-bold text-pastel-subtinta">&#9719; Duración: ${op.duracion} min</span>
                <button type="button"
                        data-elegir-variedad="${escapar(op.nombre)}"
                        data-elegir-categoria="${escapar(grupo.categoria)}"
                        data-elegir-precio="${op.precio}"
                        data-elegir-duracion="${op.duracion}"
                        data-elegir-detalle="${escapar(op.detalle)}"
                        class="rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                  ${enPanelClienta ? 'Elegir este servicio' : 'Quiero este &rarr;'}
                </button>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `).join('');

    const mostrarEjemploAmpliado = ({ img, nombre, detalleTexto, precio, duracion }) => {
        if (!vistaPrevia) return;
        vistaPrevia.innerHTML = `
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img src="${escapar(img)}" alt="${escapar(nombre)}"
                         class="h-44 w-full rounded-2xl object-cover shadow-lg ring-2 ring-bella-500 sm:h-40 sm:w-52">
                    <div>
                        <span class="rounded-full bg-bella-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">✨ Ejemplo visual del resultado</span>
                        <h4 class="mt-1.5 text-xl font-bold text-pastel-tinta">${escapar(nombre)}</h4>
                        <p class="mt-1 max-w-xl text-xs leading-relaxed text-pastel-subtinta">${escapar(detalleTexto)}</p>
                        <p class="mt-2 text-xs font-extrabold text-bella-900">Valor: ${pesos(precio)} · Duración estimada: ${duracion} minutos</p>
                    </div>
                </div>
                <button type="button" id="btnCerrarVistaPrevia" class="self-end rounded-xl border border-bella-400/70 bg-white px-3.5 py-1.5 text-xs font-bold text-pastel-tinta hover:bg-pastel-rosa sm:self-center">
                    Cerrar vista
                </button>
            </div>`;
        vistaPrevia.classList.remove('hidden');
        document.getElementById('btnCerrarVistaPrevia')?.addEventListener('click', () => vistaPrevia.classList.add('hidden'));
    };

    // Ampliar foto de ejemplo dentro del modal
    cuerpo.querySelectorAll('button[data-ampliar-img]').forEach((btnImg) => {
        btnImg.addEventListener('click', () => {
            mostrarEjemploAmpliado({
                img: btnImg.dataset.ampliarImg,
                nombre: btnImg.dataset.ampliarNombre,
                detalleTexto: btnImg.dataset.ampliarDetalle,
                precio: btnImg.dataset.ampliarPrecio,
                duracion: btnImg.dataset.ampliarDuracion
            });
        });
    });

    // Si se pidió abrir directamente un sub-servicio específico, mostramos su ejemplo ampliado arriba
    if (opciones.variedadInicial) {
        for (const g of detalle.grupos) {
            const encontrada = g.opciones.find((o) => o.nombre === opciones.variedadInicial);
            if (encontrada) {
                mostrarEjemploAmpliado({
                    img: encontrada.imagen,
                    nombre: encontrada.nombre,
                    detalleTexto: encontrada.detalle,
                    precio: encontrada.precio,
                    duracion: encontrada.duracion
                });
                break;
            }
        }
    }

    cuerpo.querySelectorAll('button[data-elegir-variedad]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const variedad = boton.dataset.elegirVariedad;
            const categoria = boton.dataset.elegirCategoria;
            const precio = Number(boton.dataset.elegirPrecio) || 0;
            const duracion = Number(boton.dataset.elegirDuracion) || 60;
            const detalleTexto = boton.dataset.elegirDetalle || '';

            if (typeof opciones.alSeleccionarVariedad === 'function') {
                opciones.alSeleccionarVariedad({ variedad, categoria, precio, duracion, detalle: detalleTexto, nombreServicio: detalle.titulo, idServicio: opciones.idServicio });
                dialog.close();
                return;
            }

            if (enPanelClienta) {
                const selectServicio = document.getElementById('servicio');
                if (selectServicio) {
                    if (opciones.idServicio) {
                        selectServicio.value = String(opciones.idServicio);
                    } else {
                        const primeraClave = detalle.claves[0] || limpiarTextoCatalogo(detalle.titulo).split(' ')[0];
                        for (const opt of selectServicio.options) {
                            if (limpiarTextoCatalogo(opt.textContent).includes(primeraClave)) {
                                selectServicio.value = opt.value;
                                break;
                            }
                        }
                    }
                    selectServicio.dispatchEvent(new Event('change'));
                }
                if (typeof window.aplicarEspecialidadEnFormulario === 'function') {
                    window.aplicarEspecialidadEnFormulario({ variedad, categoria, precio, duracion, detalle: detalleTexto });
                } else {
                    const obs = document.getElementById('observaciones');
                    if (obs) {
                        obs.value = `Especialidad elegida: ${variedad} (${categoria}) — ${detalleTexto}`;
                    }
                    const etiquetaVar = document.getElementById('variedadSeleccionada');
                    if (etiquetaVar) {
                        etiquetaVar.textContent = `✓ Especialidad: ${variedad} · ${pesos(precio)} · ${duracion} min`;
                        etiquetaVar.classList.remove('hidden');
                    }
                }
                dialog.close();
                document.getElementById('fecha')?.focus();
            } else {
                sessionStorage.setItem('bellaVariedadPreferida', JSON.stringify({
                    servicio: detalle.titulo,
                    variedad,
                    categoria,
                    precio,
                    duracion,
                    detalle: detalleTexto
                }));
                dialog.close();
                window.location.href = 'index.html?rol=cliente';
            }
        });
    });

    const buscadorModal = document.getElementById('buscadorEspecialidadModal');
    if (buscadorModal) {
        buscadorModal.value = '';
        buscadorModal.oninput = () => {
            const q = buscadorModal.value.trim().toLowerCase();
            cuerpo.querySelectorAll('[data-tarjeta-especialidad]').forEach((card) => {
                const coincide = !q || card.dataset.tarjetaEspecialidad.includes(q);
                card.classList.toggle('hidden', !coincide);
            });
        };
    }

    if (!dialog.open) dialog.showModal();
}
