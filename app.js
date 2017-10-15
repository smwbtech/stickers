const   express = require('express'),
        multer = require('multer'),
        fs = require('fs'),
        xlsx2json = require('xlsx2json'),
        jsBarcode = require('jsbarcode'),
        canvas = require('canvas'),
        gm = require('gm'),
        im = require('gm').subClass({imageMagick: true}),
        Image = canvas.Image;


let upload = multer({ dest: './public/upload/' });
let app = express();

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'pug');

function compositeSticker(obj) {
    return new Promise((res, rej) => {
        console.log(1);
        gm('./public/img/pattern.jpg')
        .composite(`./public/upload/${obj.barcode}.png`)
        .geometry('+20+460')
        .write('./public/img/pattern-changed.jpg', (err) => {
            if(err) throw err;
            res(obj);
        });
    });
}

function drawText(obj) {
    console.log(1)
    gm('./public/img/pattern-changed.jpg')
    .font(__dirname + "/public/fonts/ArialRegular.ttf", 16)
    .drawText(300, 39, `${obj.article}`)
    .drawText(300, 58, `${obj.size}`)
    .font(__dirname + "/public/fonts/ArialBold.ttf", 16)
    .drawText(12, 100, obj.title.match(/женская/) ? 'ФУТБОЛКА ЖЕНСКАЯ' : 'ФУТБОЛКА МУЖСКАЯ' )
    .font(__dirname + "/public/fonts/ArialItalic.ttf", 17)
    .drawText(12, 460, `${obj.title}`)
    .write(`./public/upload/${obj.barcode}sticker.jpg`, (err) => {
        if(err) throw err;
        Promise.resolve(obj);
    });
}

function createSticker(obj) {
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

app.get('/', (req, res, err) => {
    if(err) console.error(err);
    res.render('index');
});

app.post('/xlstojson', upload.single('tablefile'), (req, res, err) => {
    if(err) console.error(err);
    console.log(req.file);
    var tmp_path = req.file.path;
    /** The original name of the uploaded file
        stored in the variable "originalname". **/
    let target_path = './public/upload/' + req.file.originalname;

    /** A better way to copy the uploaded file. **/
    let src = fs.createReadStream(tmp_path);
    let dest = fs.createWriteStream(target_path);
    src.pipe(dest);
    fs.unlink(tmp_path); //deleting the tmp_path
    src.on('end', function() {
        // res.render('complete');
        xlsx2json(target_path, {
            mapping: {
            'article': 'A',
            'title': 'B',
            'size': 'C',
            'barcode': 'D'
        }
        })
        .then( (json) => {
            res.status(200);
            res.send(json);
        })
        .catch( (err) => console.error(err));
    });
    src.on('error', function(err) {
         res.render('error');
     });
    // res.status(200);
    // res.send('{"name":"json"}');

});

app.get('/stickers', (req, res, err) => {
    if(err) console.error(err);
    xlsx2json('./public/upload/tablefile.xlsx', {
        dataStartingRow: 2,
        mapping: {
        'article': 'A',
        'title': 'B',
        'size': 'C',
        'barcode': 'D'
    }})
    .then( (json) => {

        // console.log(json[0][0]);
        for(let arr of json) {
            var i = 0;
            var intervalId = setInterval( () => {
                createSticker(arr[i])
                .then(compositeSticker)
                .then((obj) => drawText(obj))
                .catch( (err) => console.error(err));
                i < arr.length ? i++ : clearInterval(intervalId);
            }, 300);
        }

    })
    .catch( (err) => console.error(err));

});

app.use(express.static(__dirname + '/public'));

// 404
app.use( (req, res) => {
    res.status(404);
    res.render('404');
});

//500
app.use( (err, req, res, next) => {
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Ошибка сервера');
});

app.listen(app.get('port'), () => {
    console.log('Наш сервер работает на 3000 порту');
});

// var arr = [[1,2,3,4,5,6,7,8]];
//
// for (let prop of arr) {
//     var i = 0;
//     var intervalId = setInterval( () => {
//         console.log(prop[i]);
//         i < prop.length ? i++ : clearInterval(intervalId);
//     }, 300);
// }
