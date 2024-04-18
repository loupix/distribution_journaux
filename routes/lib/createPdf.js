// in some service
var PdfTable = require('voilab-pdf-table'),
    PdfDocument = require('pdfkit'),
    config = require('../../config/environment');

module.exports = {
    create: function (zones) {
        // create a PDF from PDFKit, and a table from PDFTable
        var pdf = new PdfDocument({
                autoFirstPage: false
            }),
            table = new PdfTable(pdf, {
                topMargin:20,
                bottomMargin: 30
            });
 
        table
            // add some plugins (here, a 'fit-to-width' for a column)
            // .addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
            //     column: 'name',
            // }))
            // set defaults to your columns
            .setColumnsDefaults({
                headerBorder: 'B',
                align: 'left'
            })
            // add table columns
            .addColumns([
                {
                    id: 'name',
                    header: 'Nom',
                    width:200
                },
                {
                    id: 'region',
                    header: 'Région',
                    width:200
                },
                {
                    id: 'net',
                    header: 'Net',
                    width: 200
                }
            ])
            // add events (here, we draw headers on each new page)
            .onPageAdded(function (tb) {
                tb.addHeader();
            });
 
        // if no page already exists in your PDF, do not forget to add one
        pdf.addPage();
 
        // draw content, by passing data to the addBody method
        var bodyZones = zones.map(function(z){return {name:z.Ville, region:z.region, net:z.net}});
        table.addBody(bodyZones);
 
        return pdf;
    }
};