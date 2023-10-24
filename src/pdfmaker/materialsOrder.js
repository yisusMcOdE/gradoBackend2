const pdfmake = require('pdfmake');

const generatePdf = (req, res) => {
    const dd = {
        pageSize: 'A5',
        pageOrientation:'landscape',
        content: [
            {
	        
                table: {
                    body: [
                        [
                            {text:'Univ', colSpan:5},{},{},{},{},
                            {text:'Pedido', colSpan:7},{},{},{},{},{},{},
                            {text:'Seccion', colSpan:4},{},{},{}
                        ],
                        [
                            {text:'Details', colSpan:12, rowSpan:2},{},{},{},{},{},{},{},{},{},{},{},
                            {text:'Estr', colSpan:2},{},
                            {text:'Fuent', colSpan:2}
                        ],
                        [
                            {},{},{},{},{},{},{},{},{},{},{},{},
                            {text:'V_Estr', colSpan:2},{},
                            {text:'V_1'},
                            {text:'V_2'},
                        ],
                        [
                            {text:'cant'},
                            {text:'unid'},
                            {text:'DESCRIPCION', colSpan:8},{},{},{},{},{},{},{},
                            {text:'cant_Apr'},
                            {text:'cant_Ent'},
                            {text:'Cod_pres', colSpan:2},{},
                            {text:'Cod_mat', colSpan:2},{},
                        ],
                        [
                            {text:'1'},
                            {text:''},
                            {text:'', colSpan:8},{},{},{},{},{},{},{},
                            {text:''},
                            {text:''},
                            {text:'', colSpan:2},{},
                            {text:'', colSpan:2},{},
                        ],
                        [
                            {text:'responsable', colSpan:4},{},{},{},
                            {text:'aprob', colSpan:4},{},{},{},
                            {text:'entreg', colSpan:4},{},{},{},
                            {text:'reci', colSpan:4},{},{},{},
                        ],
                        [
                            {text:'1', colSpan:4},{},{},{},
                            {text:'', colSpan:4},{},{},{},
                            {text:'', colSpan:4},{},{},{},
                            {text:'', colSpan:4},{},{},{},
                        ],
                        [
                            {text: 'Fecha'},{text:'00'},{text:'00'},{text:'00'},
                            {text: 'Fecha'},{text:'00'},{text:'00'},{text:'00'},
                            {text: 'Fecha'},{text:'00'},{text:'00'},{text:'00'},
                            {text: 'Fecha'},{text:'00'},{text:'00'},{text:'00'},
                        ]
                        
                        
                    ]
                }
                
            }
          ],
          defaultStyle: {
            font: 'Helvetica'
          }
    };

    var fonts = {
        Courier: {
          normal: 'Courier',
          bold: 'Courier-Bold',
          italics: 'Courier-Oblique',
          bolditalics: 'Courier-BoldOblique'
        },
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        },
        Times: {
          normal: 'Times-Roman',
          bold: 'Times-Bold',
          italics: 'Times-Italic',
          bolditalics: 'Times-BoldItalic'
        },
        Symbol: {
          normal: 'Symbol'
        },
        ZapfDingbats: {
          normal: 'ZapfDingbats'
        }
    }
    
    const printer = new pdfmake(fonts);
    const pdfDoc = printer.createPdfKitDocument(dd);

    res.setHeader('Content_Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end()
}

module.exports={generatePdf}