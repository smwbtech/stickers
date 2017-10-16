const   fs = require('fs'),
        jsBarcode = require('jsbarcode'),
        canvas = require('canvas'),
        gm = require('gm'),
        Image = canvas.Image;


module.exports.stickers = () => {return {
    compositeSticker(obj) {
        return new Promise((res, rej) => {
            console.log(1);
            gm('./public/img/pattern.png')
            .composite(`./public/upload/${obj.barcode}.png`)
            .geometry('+20+455')
            .write('./public/img/pattern-changed.png', (err) => {
                if(err) throw err;
                res(obj);
            });
        });
    },

    drawText(obj) {
        console.log(1)
        gm('./public/img/pattern-changed.png')
        .font("./public/fonts/ArialRegular.ttf", 16)
        .drawText(300, 39, `${obj.article}`)
        .drawText(300, 58, `${obj.size}`)
        .font("./public/fonts/ArialBold.ttf", 16)
        .drawText(12, 105, obj.title.match(/женская/) ? 'ФУТБОЛКА ЖЕНСКАЯ' : 'ФУТБОЛКА МУЖСКАЯ' )
        .font("./public/fonts/ArialItalic.ttf", 17)
        .drawText(12, 460, `${obj.title}`)
        .write(`./public/upload/${obj.article}.png`, (err) => {
            if(err) throw err;
            Promise.resolve(obj);
        });
    },

    createSticker(obj) {
        return new Promise( (res, rej) => {
            let cnv = new canvas(400, 130);
            let barCode = jsBarcode(cnv, `${obj.barcode}`, { format: "ean13", width: 3, font: 'sans-serif'});
            let png = fs.createWriteStream(`./public/upload/${obj.barcode}.png`);
            let stream = cnv.pngStream(barCode);

            stream.on('data', (chunk) => {
              png.write(chunk);
            });

            stream.on('end', () => {
                setTimeout( ()=> res(obj), 300);

            });
        });
    }
}};
