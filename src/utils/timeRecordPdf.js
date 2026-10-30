const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generador de informe oficial en PDF del Registro de Jornada Laboral
 * Conforme al Real Decreto-ley 8/2019 y art. 34.9 del Estatuto de los Trabajadores.
 * Validez legal directa ante la Inspección de Trabajo y Seguridad Social (ITSS).
 */
const generateTimeRecordPDF = async ({
  empresa = {
    nombre: 'APG Instalaciones Eléctricas S.L.',
    nif: 'B-88765432',
    direccion: 'Calle Gran Vía 15, Madrid'
  },
  trabajador = {
    nombre: 'Operario',
    dni: 'Sin DNI',
    rol: 'operario'
  },
  mes = '2026-10',
  resumen = {
    dias: [],
    totalHorasOrdinarias: 0,
    totalHorasExtra: 0,
    totalHorasTrabajadas: 0
  }
}) => {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Dimensiones A4 estándar en puntos (ancho x alto)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Formato legible del mes
  const [añoStr, mesStr] = mes.split('-');
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const nombreMes = nombresMeses[parseInt(mesStr, 10) - 1] || mesStr;
  const periodoTexto = `${nombreMes} de ${añoStr}`;

  // Helper para dibujar texto con sanitización para WinAnsi (evita error con emojis)
  const drawText = (text, x, yPos, options = {}) => {
    const {
      font = fontRegular,
      size = 9,
      color = rgb(0.12, 0.16, 0.22)
    } = options;
    const sanitized = String(text ?? '').replace(/[^\x00-\xFF]/g, '');
    if (!sanitized) return;
    page.drawText(sanitized, { x, y: yPos, font, size, color });
  };

  // Helper para dibujar líneas
  const drawLine = (x1, y1, x2, y2, color = rgb(0.8, 0.85, 0.9), thickness = 1) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      color,
      thickness
    });
  };

  // Helper para dibujar cajas / rectángulos rellenos
  const drawRect = (x, yPos, width, height, fillColor, borderColor = null) => {
    page.drawRectangle({
      x,
      y: yPos,
      width,
      height,
      color: fillColor,
      borderColor: borderColor || undefined,
      borderWidth: borderColor ? 1 : 0
    });
  };

  // ==========================================
  // 1. CABECERA INSTITUCIONAL
  // ==========================================
  // Barra superior decorativa
  drawRect(margin, y - 6, contentWidth, 6, rgb(0.09, 0.38, 0.74)); // Azul primario
  y -= 24;

  drawText('APGgestor - REGISTRO OFICIAL DE JORNADA LABORAL', margin, y, {
    font: fontBold,
    size: 15,
    color: rgb(0.06, 0.16, 0.38)
  });
  y -= 14;

  drawText('DOCUMENTO OBLIGATORIO CONFORME AL REAL DECRETO-LEY 8/2019 (ART. 34.9 ESTATUTO DE LOS TRABAJADORES)', margin, y, {
    font: fontBold,
    size: 7.5,
    color: rgb(0.35, 0.42, 0.52)
  });
  y -= 18;

  // ==========================================
  // 2. BLOQUES DE DATOS (EMPRESA Y TRABAJADOR)
  // ==========================================
  const boxHeight = 62;
  const colWidth = (contentWidth - 12) / 2;

  // Caja Empresa
  drawRect(margin, y - boxHeight, colWidth, boxHeight, rgb(0.96, 0.98, 1.0), rgb(0.8, 0.87, 0.96));
  drawText('DATOS DE LA EMPRESA', margin + 10, y - 14, { font: fontBold, size: 8.5, color: rgb(0.09, 0.38, 0.74) });
  drawText(`Razón Social: ${empresa.nombre}`, margin + 10, y - 28, { size: 8 });
  drawText(`NIF/CIF: ${empresa.nif}`, margin + 10, y - 41, { size: 8 });
  drawText(`Domicilio: ${empresa.direccion || 'Domicilio Social'}`, margin + 10, y - 54, { size: 8 });

  // Caja Trabajador
  const col2X = margin + colWidth + 12;
  drawRect(col2X, y - boxHeight, colWidth, boxHeight, rgb(0.96, 0.98, 1.0), rgb(0.8, 0.87, 0.96));
  drawText('DATOS DEL TRABAJADOR / PERÍODO', col2X + 10, y - 14, { font: fontBold, size: 8.5, color: rgb(0.09, 0.38, 0.74) });
  drawText(`Nombre: ${trabajador.nombre}`, col2X + 10, y - 28, { font: fontBold, size: 8 });
  drawText(`DNI/NIE: ${trabajador.dni || 'No especificado'}`, col2X + 10, y - 41, { size: 8 });
  drawText(`Categoría: ${trabajador.rol?.toUpperCase()} | Mes: ${periodoTexto}`, col2X + 10, y - 54, { size: 8 });

  y -= (boxHeight + 20);

  // ==========================================
  // 3. TABLA DE REGISTROS DIARIOS
  // ==========================================
  const columns = [
    { label: 'FECHA', width: 62 },
    { label: 'ENTRADA', width: 52 },
    { label: 'INICIO PAUSA', width: 64 },
    { label: 'FIN PAUSA', width: 64 },
    { label: 'SALIDA', width: 52 },
    { label: 'H. ORD.', width: 48 },
    { label: 'H. EXTRA', width: 50 },
    { label: 'TOTAL H.', width: 50 },
    { label: 'GEOLOC. / ESTADO', width: 81 }
  ];

  // Encabezado de la tabla
  const headerHeight = 20;
  drawRect(margin, y - headerHeight, contentWidth, headerHeight, rgb(0.12, 0.22, 0.38));
  let curX = margin + 4;
  columns.forEach(col => {
    drawText(col.label, curX, y - 14, { font: fontBold, size: 7, color: rgb(1, 1, 1) });
    curX += col.width;
  });
  y -= headerHeight;

  // Filas de días
  const rowHeight = 16;
  const dias = resumen.dias || [];

  for (let i = 0; i < dias.length; i++) {
    // Si la tabla supera el margen inferior, creamos una nueva página
    if (y - rowHeight < margin + 110) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;

      // Reimprimir encabezado en nueva página
      drawRect(margin, y - headerHeight, contentWidth, headerHeight, rgb(0.12, 0.22, 0.38));
      curX = margin + 4;
      columns.forEach(col => {
        drawText(col.label, curX, y - 14, { font: fontBold, size: 7, color: rgb(1, 1, 1) });
        curX += col.width;
      });
      y -= headerHeight;
    }

    const dia = dias[i];
    const isEven = i % 2 === 0;
    if (isEven) {
      drawRect(margin, y - rowHeight, contentWidth, rowHeight, rgb(0.97, 0.98, 0.99));
    }

    curX = margin + 4;
    drawText(dia.fecha || '-', curX, y - 11, { size: 7.5 });
    curX += columns[0].width;

    drawText(dia.entrada || '--:--', curX, y - 11, { size: 7.5, font: dia.entrada ? fontBold : fontRegular });
    curX += columns[1].width;

    drawText(dia.pausaInicio || '--:--', curX, y - 11, { size: 7.5 });
    curX += columns[2].width;

    drawText(dia.pausaFin || '--:--', curX, y - 11, { size: 7.5 });
    curX += columns[3].width;

    drawText(dia.salida || '--:--', curX, y - 11, { size: 7.5, font: dia.salida ? fontBold : fontRegular });
    curX += columns[4].width;

    drawText(dia.horasOrdinarias ? `${dia.horasOrdinarias.toFixed(2)}h` : '0.00h', curX, y - 11, { size: 7.5 });
    curX += columns[5].width;

    drawText(dia.horasExtra ? `${dia.horasExtra.toFixed(2)}h` : '0.00h', curX, y - 11, {
      size: 7.5,
      color: dia.horasExtra > 0 ? rgb(0.75, 0.1, 0.1) : rgb(0.4, 0.45, 0.5),
      font: dia.horasExtra > 0 ? fontBold : fontRegular
    });
    curX += columns[6].width;

    drawText(dia.totalHoras ? `${dia.totalHoras.toFixed(2)}h` : '0.00h', curX, y - 11, { font: fontBold, size: 7.5 });
    curX += columns[7].width;

    const estadoGeo = dia.geolocalizacion ? 'GPS Verificado' : (dia.manual ? 'Manual Auditado' : 'Registrado');
    drawText(estadoGeo, curX, y - 11, {
      size: 7,
      color: dia.manual ? rgb(0.8, 0.4, 0.0) : rgb(0.2, 0.5, 0.2)
    });

    drawLine(margin, y - rowHeight, margin + contentWidth, y - rowHeight, rgb(0.9, 0.93, 0.96), 0.5);
    y -= rowHeight;
  }

  y -= 10;

  // ==========================================
  // 4. TOTALES Y CÓMPUTO MENSUAL
  // ==========================================
  const totalBoxHeight = 36;
  drawRect(margin, y - totalBoxHeight, contentWidth, totalBoxHeight, rgb(0.93, 0.96, 1.0), rgb(0.75, 0.84, 0.95));

  drawText(`TOTAL HORAS ORDINARIAS: ${resumen.totalHorasOrdinarias?.toFixed(2) || '0.00'} h`, margin + 14, y - 16, {
    font: fontBold,
    size: 8.5,
    color: rgb(0.09, 0.38, 0.74)
  });

  drawText(`TOTAL HORAS EXTRAORDINARIAS: ${resumen.totalHorasExtra?.toFixed(2) || '0.00'} h`, margin + 195, y - 16, {
    font: fontBold,
    size: 8.5,
    color: (resumen.totalHorasExtra || 0) > 0 ? rgb(0.75, 0.1, 0.1) : rgb(0.2, 0.25, 0.35)
  });

  drawText(`TOTAL EFECTIVO TRABAJADO: ${resumen.totalHorasTrabajadas?.toFixed(2) || '0.00'} h`, margin + 375, y - 16, {
    font: fontBold,
    size: 8.5,
    color: rgb(0.06, 0.16, 0.38)
  });

  drawText(`* Conforme a la legislación vigente, se conservará este registro por un periodo mínimo de cuatro (4) años.`, margin + 14, y - 29, {
    size: 6.5,
    color: rgb(0.4, 0.45, 0.5)
  });

  y -= (totalBoxHeight + 20);

  // ==========================================
  // 5. SECCIÓN DE FIRMAS OBLIGATORIAS (ITSS)
  // ==========================================
  const signBoxHeight = 65;
  const signColWidth = (contentWidth - 20) / 2;

  // Caja Firma Empresa
  drawRect(margin, y - signBoxHeight, signColWidth, signBoxHeight, rgb(1, 1, 1), rgb(0.8, 0.85, 0.9));
  drawText('POR LA EMPRESA (Firma y Sello):', margin + 10, y - 14, { font: fontBold, size: 7.5, color: rgb(0.2, 0.25, 0.35) });
  drawLine(margin + 15, y - 48, margin + signColWidth - 15, y - 48, rgb(0.6, 0.65, 0.7), 0.8);
  drawText('Fdo. Representante Legal de APG', margin + 15, y - 58, { size: 7, color: rgb(0.5, 0.55, 0.6) });

  // Caja Firma Trabajador
  const signCol2X = margin + signColWidth + 20;
  drawRect(signCol2X, y - signBoxHeight, signColWidth, signBoxHeight, rgb(1, 1, 1), rgb(0.8, 0.85, 0.9));
  drawText('LA PERSONA TRABAJADORA (Conforme):', signCol2X + 10, y - 14, { font: fontBold, size: 7.5, color: rgb(0.2, 0.25, 0.35) });
  drawLine(signCol2X + 15, y - 48, signCol2X + signColWidth - 15, y - 48, rgb(0.6, 0.65, 0.7), 0.8);
  drawText(`Fdo. ${trabajador.nombre} (DNI: ${trabajador.dni || '___________'})`, signCol2X + 15, y - 58, { size: 7, color: rgb(0.5, 0.55, 0.6) });

  y -= (signBoxHeight + 14);

  // Pie de página legal
  drawText('Documento generado digitalmente por APGgestor - Cumple con la Guía sobre Registro de Jornada de la Dirección General de Trabajo.', margin, y, {
    size: 6.5,
    color: rgb(0.5, 0.55, 0.6)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

module.exports = {
  generateTimeRecordPDF
};
