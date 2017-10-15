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


function makingPicture(obj){
    console.log(obj);
    gm('./public/img/pattern.jpg')
    .composite(`./public/upload/${obj.barcode}.png`)
    .geometry('+20+460')
    .write('./public/img/pattern-changed.jpg', (err) => {
      if (!err) {
          gm('/public/img/pattern-changed.jpg')
         .font(__dirname + "LiberationMono-Bold.ttf", 16)
          .drawText(300, 39, `${obj.article}`)
          .drawText(300, 58, `${obj.size}`)
          .drawText(12, 100, obj.title.match(/женская/) ? 'ФУТБОЛКА ЖЕНСКАЯ' : 'ФУТБОЛКА МУЖСКАЯ' )
          .drawText(12, 455, `${obj.title}`)
          .write(`./public/upload/${obj.barcode}.jpg`, (err) => {
            if (err) {
                console.error(err);
            }
            console.log('done');
          });
      }
    });
}


function createSticker(obj) {
    return new Promise( (res, rej) => {
        let cnv = new canvas(400, 140);
        let barCode = jsBarcode(cnv, `${obj.barcode}`, { format: "ean13", width: 3, font: 'sans-serif'});
        let png = fs.createWriteStream(`./public/upload/${obj.barcode}.png`);
        let stream = cnv.pngStream(barCode);

        stream.on('data', (chunk) => {
          png.write(chunk);
        });

        stream.on('end', () => {
            // console.log(obj);
            res(obj);
        });
    });
}



function makingBarcode(obj) {
    let cnv = new canvas(350, 140);
    let barCode = jsBarcode(cnv, `${obj.barcode}`, { format: "ean13"});
    let png = fs.createWriteStream(`./public/upload/${obj.barcode}.png`);
    let stream = cnv.pngStream(barCode);

    stream.on('data', function(chunk){
      png.write(chunk);
    });

    stream.on('end', function(){
        makingPicture(obj);
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
            createSticker(arr[0])
            .then (makingPicture)
            .catch( (err) => console.error(err));
            for(let object of arr) {
                // createSticker(object)
                // .then( barcodeOnPic )
                // .then (makingPicture)
                // .catch( (err) => console.error(err));
            }
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
