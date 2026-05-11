import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ReportePdfService {

  constructor() { }

  generarBoleta(curso: string, grado: string, seccion: string, periodo: string, competencias: any[], alumnos: any[]) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- ENCABEZADO ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE PROGRESO DEL APRENDIZAJE DEL ESTUDIANTE - 2026', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Cuadro de Información (Estilo MINEDU)
    const startY = 25;
    const col1 = 15;
    const col2 = 80;
    const rowHeight = 7;

    doc.rect(col1, startY, 180, rowHeight * 4); // Marco principal
    
    // Filas
    doc.setFont('helvetica', 'bold');
    doc.text('DRE:', col1 + 2, startY + 5);
    doc.text('Nivel:', col1 + 2, startY + 5 + rowHeight);
    doc.text('Institución Educativa:', col1 + 2, startY + 5 + rowHeight * 2);
    doc.text('Grado:', col1 + 2, startY + 5 + rowHeight * 3);

    doc.setFont('helvetica', 'normal');
    doc.text('LIMA METROPOLITANA', col1 + 45, startY + 5);
    doc.text('SECUNDARIA', col1 + 45, startY + 5 + rowHeight);
    doc.text('I.E. KUMAMOTO', col1 + 45, startY + 5 + rowHeight * 2);
    doc.text(`${grado}`, col1 + 45, startY + 5 + rowHeight * 3);

    doc.setFont('helvetica', 'bold');
    doc.text('UGEL:', col2 + 20, startY + 5);
    doc.text('Sección:', col2 + 20, startY + 5 + rowHeight * 3);

    doc.setFont('helvetica', 'normal');
    doc.text('03 - BREÑA', col2 + 45, startY + 5);
    doc.text(`${seccion}`, col2 + 45, startY + 5 + rowHeight * 3);

    // --- TABLA DE CALIFICACIONES ---
    let currentY = startY + (rowHeight * 5);

    alumnos.forEach((alumno, index) => {
        if (index > 0) doc.addPage();
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`ESTUDIANTE: ${alumno.nombreCompleto}`, 15, currentY);
        
        const tableBody = competencias.map((comp, i) => {
            return [
                `C${i + 1}: ${comp.nombre}`,
                alumno.promediosCompetencias[comp.id.toString()] || '-'
            ];
        });

        // Añadimos el promedio final
        tableBody.push([{ content: 'CALIFICATIVO FINAL DE ÁREA', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
                       { content: alumno.promedioBimestre, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [[{ content: `ÁREA CURRICULAR: ${curso}`, colSpan: 2, styles: { halign: 'center', fillColor: [63, 81, 181] } }],
                   ['COMPETENCIAS', 'CALIFICATIVO']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 100], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 140 },
                1: { cellWidth: 30, halign: 'center' }
            }
        });

        // --- CONCLUSIÓN DESCRIPTIVA ---
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.rect(15, finalY, 180, 25);
        doc.setFont('helvetica', 'bold');
        doc.text('Conclusión descriptiva por periodo:', 17, finalY + 5);
        
        // --- FIRMAS ---
        const footerY = 270;
        doc.line(30, footerY, 90, footerY);
        doc.line(120, footerY, 180, footerY);
        doc.setFontSize(8);
        doc.text('Firma y Sello del Docente', 60, footerY + 5, { align: 'center' });
        doc.text('Firma y Sello del Director', 150, footerY + 5, { align: 'center' });
    });

    doc.save(`Boletas_${curso}_${periodo}.pdf`);
  }
}
