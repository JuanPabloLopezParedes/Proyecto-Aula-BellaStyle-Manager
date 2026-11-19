// Servicio de notificaciones por correo electrónico de BellaStyle Manager
// Envía correos reales por SMTP (Gmail u otro servidor configurado) al agendar,
// confirmar, reprogramar, finalizar o cancelar una cita, y guarda copia íntegra en el sistema.

const fs = require('fs');
const path = require('path');

const DESCRIPCIONES_SERVICIOS = {
    corte: 'Diagnóstico visagista según la forma de tu rostro, lavado relajante, corte de precisión, estilizado y sellado de puntas.',
    tinte: 'Diagnóstico de colorimetría, preparación protectora de la hebra capilar, aplicación uniforme de pigmentos profesionales, lavado sellador de color y cepillado final.',
    mechas: 'Diseño de iluminación personalizado (Balayage / Babylights / Contorno), decoloración controlada con plex protector, matización de tono y tratamiento sellador de brillo.',
    peinado: 'Preparación térmica con termoprotector, diseño de ondas o estructurado de recogido de gala y fijación profesional de larga duración.',
    manicure: 'Higienización, limpieza detallada de cutícula, preparación anatómica de la uña, aplicación del sistema o esmaltado elegido e hidratación con óleo de almendras.',
    pedicure: 'Baño relajante con sales minerales, limpieza profunda, exfoliación podal renovadora, embellecimiento de uñas, esmaltado y masaje hidratante.',
    tratamiento: 'Lavado detox de apertura cuticular, aplicación profunda de activos reconstructores (queratina, bótox o argán), termoterapia y sellado antifrizz.'
};

function obtenerConfigSmtp() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            user: process.env.SMTP_USER.trim(),
            pass: process.env.SMTP_PASS.replace(/\s+/g, '')
        };
    }
    try {
        const rutaLocal = path.join(__dirname, '../config/smtp.local.json');
        if (fs.existsSync(rutaLocal)) {
            const cfg = JSON.parse(fs.readFileSync(rutaLocal, 'utf8'));
            if (cfg.user && cfg.pass) {
                return {
                    host: cfg.host || 'smtp.gmail.com',
                    port: Number(cfg.port) || 465,
                    user: String(cfg.user).trim(),
                    pass: String(cfg.pass).replace(/\s+/g, '')
                };
            }
        }
    } catch (_) {}
    return null;
}

function obtenerDescripcionProcedimiento(nombreServicio = '', observaciones = '') {
    const limpio = String(nombreServicio).toLowerCase();
    let base = 'Atención personalizada en cabina con productos profesionales de salón, diagnóstico previo con tu estilista y acabado final impecable.';
    for (const [clave, desc] of Object.entries(DESCRIPCIONES_SERVICIOS)) {
        if (limpio.includes(clave)) {
            base = desc;
            break;
        }
    }
    if (observaciones && observaciones.trim()) {
        return `${observaciones.trim()}. Procedimiento incluido: ${base}`;
    }
    return base;
}

function formatearPesos(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
}

// Registro en memoria de los correos enviados para consulta inmediata desde el panel
const historialCorreos = new Map();

async function despacharPorSmtp(smtpCfg, destinatario, asunto, textoPlano, html, registro) {
    if (!smtpCfg) return;
    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: smtpCfg.host,
            port: smtpCfg.port,
            secure: smtpCfg.port === 465,
            auth: {
                user: smtpCfg.user,
                pass: smtpCfg.pass
            }
        });
        await transporter.sendMail({
            from: `"BellaStyle Salón de Belleza" <${smtpCfg.user}>`,
            to: destinatario,
            subject: asunto,
            text: textoPlano,
            html
        });
        registro.enviadoSmtp = true;
        console.log(`Correo enviado exitosamente por SMTP a ${destinatario}`);
    } catch (err) {
        console.warn('Aviso SMTP (se guardó copia digital del correo):', err.message);
        registro.errorSmtp = err.message;
    }
}

async function enviarCorreoConfirmacionCita(datosCita) {
    const {
        idCita,
        clienteNombre,
        clienteEmail,
        estilistaNombre,
        servicioNombre,
        fecha,
        hora,
        duracionMin,
        precioServicio,
        productoNombre,
        precioProducto,
        descuentoAplicado = 0,
        motivoDescuento = '',
        precioTotal,
        observaciones
    } = datosCita;

    const smtpCfg = obtenerConfigSmtp();
    const destinatario = clienteEmail && clienteEmail.includes('@')
        ? clienteEmail.trim()
        : (smtpCfg ? smtpCfg.user : 'clienta@bellastyle.com');

    const descripcionDetallada = obtenerDescripcionProcedimiento(servicioNombre, observaciones);
    const asunto = `Tu cita BS-${idCita} ha sido agendada para el ${fecha} a las ${hora} · BellaStyle`;

    const textoPlano = [
        `¡Hola, ${clienteNombre}!`,
        ``,
        `Tu cita ha sido agendada para la fecha ${fecha} a las ${hora}.`,
        ``,
        `RESUMEN Y DESCRIPCIÓN DE TU CITA (Código BS-${idCita}):`,
        `- Servicio: ${servicioNombre}`,
        `- Lo que te vamos a realizar: ${descripcionDetallada}`,
        `- Estilista asignada: ${estilistaNombre}`,
        `- Fecha y hora: ${fecha} a las ${hora} (Duración estimada: ${duracionMin || 60} min)`,
        productoNombre ? `- Producto adicional incluido: ${productoNombre} (${formatearPesos(precioProducto)})` : null,
        descuentoAplicado > 0 ? `- Beneficio BellaClub / Cupón (${motivoDescuento || '15% OFF'}): -${formatearPesos(descuentoAplicado)}` : null,
        `- Valor total: ${formatearPesos(precioTotal || precioServicio)}`,
        `- Lugar: BellaStyle Salón de Belleza · Bocagrande, Cra. 3 #8-45, Cartagena`,
        ``,
        `Te recomendamos llegar 10 minutos antes de tu hora programada. Si necesitas reprogramar o cancelar, puedes hacerlo desde tu panel en línea.`,
        ``,
        `Con cariño,`,
        `Equipo BellaStyle Salón de Belleza`
    ].filter(Boolean).join('\n');

    const html = `
      <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf6f9;border:1px solid #e6b8cd;border-radius:20px;overflow:hidden;color:#1e1017;">
        <div style="background:linear-gradient(135deg,#2b1321,#591c3b);padding:24px 28px;color:#fff8fb;">
          <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#f3d0e0;">Confirmación oficial de reserva · Código BS-${idCita}</p>
          <h1 style="margin:6px 0 0;font-size:24px;font-weight:700;">Bella<span style="color:#ec4899;">Style</span> Salón de Belleza</h1>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#1e1017;">¡Hola, ${clienteNombre}!</p>
          <div style="background:#f9e4ee;border-left:4px solid #db2777;padding:14px 16px;border-radius:12px;margin-bottom:18px;">
            <p style="margin:0;font-size:15px;font-weight:700;color:#4a1532;">
              Tu cita ha sido agendada para la fecha <strong>${fecha}</strong> a las <strong>${hora}</strong>.
            </p>
          </div>

          <h3 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.8px;color:#523444;">Descripción de lo que te vamos a realizar</h3>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#1e1017;background:#ffffff;border:1px solid #ead1dc;padding:14px;border-radius:12px;">
            <strong>${servicioNombre}:</strong> ${descripcionDetallada}
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:13px;background:#ffffff;border:1px solid #ead1dc;border-radius:12px;overflow:hidden;">
            <tr style="border-bottom:1px solid #f2e2ea;">
              <td style="padding:10px 14px;font-weight:700;color:#523444;">Código de cita</td>
              <td style="padding:10px 14px;text-align:right;font-weight:700;color:#1e1017;">BS-${idCita}</td>
            </tr>
            <tr style="border-bottom:1px solid #f2e2ea;">
              <td style="padding:10px 14px;font-weight:700;color:#523444;">Fecha y hora</td>
              <td style="padding:10px 14px;text-align:right;color:#1e1017;">${fecha} · ${hora} (${duracionMin || 60} min aprox.)</td>
            </tr>
            <tr style="border-bottom:1px solid #f2e2ea;">
              <td style="padding:10px 14px;font-weight:700;color:#523444;">Estilista asignada</td>
              <td style="padding:10px 14px;text-align:right;color:#1e1017;">${estilistaNombre}</td>
            </tr>
            <tr style="border-bottom:1px solid #f2e2ea;">
              <td style="padding:10px 14px;font-weight:700;color:#523444;">Valor del servicio</td>
              <td style="padding:10px 14px;text-align:right;color:#1e1017;">${formatearPesos(precioServicio)}</td>
            </tr>
            ${productoNombre ? `
            <tr style="border-bottom:1px solid #f2e2ea;">
              <td style="padding:10px 14px;font-weight:700;color:#523444;">Producto adicional</td>
              <td style="padding:10px 14px;text-align:right;color:#1e1017;">${productoNombre} (${formatearPesos(precioProducto)})</td>
            </tr>` : ''}
            ${descuentoAplicado > 0 ? `
            <tr style="border-bottom:1px solid #f2e2ea;background:#ecfdf5;">
              <td style="padding:10px 14px;font-weight:700;color:#065f46;">💎 Descuento BellaClub (${motivoDescuento || '15% OFF'})</td>
              <td style="padding:10px 14px;text-align:right;font-weight:700;color:#065f46;">-${formatearPesos(descuentoAplicado)}</td>
            </tr>` : ''}
            <tr style="background:#f9e4ee;">
              <td style="padding:12px 14px;font-weight:800;color:#4a1532;">Total estimado</td>
              <td style="padding:12px 14px;text-align:right;font-size:16px;font-weight:800;color:#9d174d;">${formatearPesos(precioTotal || precioServicio)}</td>
            </tr>
          </table>

          <p style="margin:18px 0 0;font-size:12px;color:#523444;line-height:1.5;">
            📍 <strong>Dirección:</strong> Bocagrande, Cra. 3 #8-45, Cartagena · Tel: +57 (605) 655-0192.<br>
            Te esperamos 10 minutos antes de tu turno. Puedes reprogramar o cancelar sin costo desde tu panel en línea.
          </p>
        </div>
      </div>
    `;

    const registro = {
        idCita: Number(idCita),
        para: destinatario,
        asunto,
        fechaEnvio: new Date().toISOString(),
        resumen: `Tu cita ha sido agendada para la fecha ${fecha} a las ${hora}.`,
        descripcion: descripcionDetallada,
        textoPlano,
        html,
        enviadoSmtp: false
    };

    await despacharPorSmtp(smtpCfg, destinatario, asunto, textoPlano, html, registro);
    historialCorreos.set(Number(idCita), registro);
    return registro;
}

// Envía notificación automática cuando la cita es Confirmada, Reprogramada, Finalizada o Cancelada
async function enviarCorreoActualizacionCita(datosCita) {
    const {
        idCita,
        tipoEvento, // 'Confirmada' | 'Reprogramada' | 'Cancelada' | 'Finalizada'
        clienteNombre,
        clienteEmail,
        estilistaNombre,
        servicioNombre,
        fecha,
        hora,
        duracionMin,
        precioTotal,
        observaciones
    } = datosCita;

    const smtpCfg = obtenerConfigSmtp();
    const destinatario = clienteEmail && clienteEmail.includes('@')
        ? clienteEmail.trim()
        : (smtpCfg ? smtpCfg.user : 'clienta@bellastyle.com');

    const descripcionDetallada = obtenerDescripcionProcedimiento(servicioNombre, observaciones);

    const titulos = {
        Confirmada: `Tu cita BS-${idCita} para el ${fecha} a las ${hora} ha sido CONFIRMADA · BellaStyle`,
        Reprogramada: `Tu cita BS-${idCita} fue REPROGRAMADA para el ${fecha} a las ${hora} · BellaStyle`,
        Cancelada: `Tu cita BS-${idCita} del ${fecha} ha sido CANCELADA · BellaStyle`,
        Finalizada: `¡Gracias por tu visita en la cita BS-${idCita}! Califica tu experiencia · BellaStyle`
    };
    const mensajesPrincipales = {
        Confirmada: `Tu cita con <strong>${estilistaNombre}</strong> ha sido <strong>confirmada oficialmente</strong> para el <strong>${fecha}</strong> a las <strong>${hora}</strong>.`,
        Reprogramada: `Tu cita ha sido <strong>reprogramada exitosamente</strong> para la nueva fecha <strong>${fecha}</strong> a las <strong>${hora}</strong> con <strong>${estilistaNombre}</strong>.`,
        Cancelada: `Te informamos que tu cita <strong>BS-${idCita}</strong> programada para el <strong>${fecha}</strong> a las <strong>${hora}</strong> ha sido <strong>cancelada</strong>. Puedes agendar un nuevo turno cuando gustes desde tu panel.`,
        Finalizada: `¡Fue un placer atenderte hoy en <strong>${servicioNombre}</strong> con <strong>${estilistaNombre}</strong>! Ya puedes ingresar a tu panel para calificar con estrellas tu experiencia y sumar puntos en tu tarjeta VIP <strong>BellaClub</strong>.`
    };

    const asunto = titulos[tipoEvento] || `Actualización de tu cita BS-${idCita} · BellaStyle`;
    const bannerMsg = mensajesPrincipales[tipoEvento] || `Estado actualizado a ${tipoEvento}.`;

    const textoPlano = [
        `¡Hola, ${clienteNombre}!`,
        ``,
        bannerMsg.replace(/<[^>]+>/g, ''),
        ``,
        `DETALLE DE LA CITA BS-${idCita}:`,
        `- Estado actual: ${tipoEvento}`,
        `- Servicio: ${servicioNombre}`,
        `- Procedimiento: ${descripcionDetallada}`,
        `- Estilista: ${estilistaNombre}`,
        `- Fecha y hora: ${fecha} a las ${hora} (${duracionMin || 60} min)`,
        `- Total: ${formatearPesos(precioTotal)}`,
        ``,
        `Equipo BellaStyle Salón de Belleza · Cartagena`
    ].join('\n');

    const html = `
      <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf6f9;border:1px solid #e6b8cd;border-radius:20px;overflow:hidden;color:#1e1017;">
        <div style="background:linear-gradient(135deg,#2b1321,#591c3b);padding:24px 28px;color:#fff8fb;">
          <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#f3d0e0;">Actualización de estado (${tipoEvento}) · Código BS-${idCita}</p>
          <h1 style="margin:6px 0 0;font-size:24px;font-weight:700;">Bella<span style="color:#ec4899;">Style</span> Salón de Belleza</h1>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#1e1017;">¡Hola, ${clienteNombre}!</p>
          <div style="background:#f9e4ee;border-left:4px solid #db2777;padding:14px 16px;border-radius:12px;margin-bottom:18px;">
            <p style="margin:0;font-size:14px;line-height:1.5;color:#4a1532;">${bannerMsg}</p>
          </div>
          <p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:#1e1017;background:#ffffff;border:1px solid #ead1dc;padding:12px;border-radius:12px;">
            <strong>${servicioNombre}:</strong> ${descripcionDetallada}
          </p>
          <p style="margin:0;font-size:12px;color:#523444;">
            📅 <strong>Fecha:</strong> ${fecha} · <strong>Hora:</strong> ${hora} · <strong>Estilista:</strong> ${estilistaNombre} · <strong>Total:</strong> ${formatearPesos(precioTotal)}
          </p>
        </div>
      </div>
    `;

    const registro = {
        idCita: Number(idCita),
        para: destinatario,
        asunto,
        fechaEnvio: new Date().toISOString(),
        resumen: bannerMsg.replace(/<[^>]+>/g, ''),
        descripcion: descripcionDetallada,
        textoPlano,
        html,
        enviadoSmtp: false
    };

    await despacharPorSmtp(smtpCfg, destinatario, asunto, textoPlano, html, registro);
    historialCorreos.set(Number(idCita), registro);
    return registro;
}

function obtenerCorreoDeCita(idCita) {
    return historialCorreos.get(Number(idCita)) || null;
}

module.exports = {
    enviarCorreoConfirmacionCita,
    enviarCorreoActualizacionCita,
    obtenerCorreoDeCita,
    obtenerDescripcionProcedimiento,
    obtenerConfigSmtp
};
