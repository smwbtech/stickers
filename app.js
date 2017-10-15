const   express = require('express'),
        multer = require('multer'),
        fs = require('fs'),
        xlsx2json = require('xlsx2json'),
        stickers = require('./lib/stickers.js').stickers(),
        zipdir = require('zip-dir');

let upload = multer({ dest: './public/upload/' });
let app = express();

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'pug');

app.get('/', (req, res, err) => {
    if(err) console.error(err);
    res.render('index');
});

app.get('/readystatus', (req, res, err) => {
    if(global.readystatus === true) {
        res.status(200);
        res.send('<a download href="/download/stickers.zip">Скачать архив</a>');
    }
    else {
        res.status(100);
        res.send('not ready');
    }

});

app.post('/xlstojson', upload.single('tablefile'), (req, res, err) => {
    if(err) console.error(err);
    let tmp_path = req.file.path;
    let target_path = './public/upload/' + req.file.originalname;
    let src = fs.createReadStream(tmp_path);
    let dest = fs.createWriteStream(target_path);
    src.pipe(dest);
    fs.unlink(tmp_path);
    src.on('end', () => {
        console.log('res');
        global.xlsx = target_path;
        res.status(200);
        res.json({link: '<a href="/stickers">Сгенерировать этикетки</a>'});
    });
    src.on('error', function(err) {
         res.render('error');
     });
});

app.get('/stickers', (req, res, err) => {
    if(err) console.error(err);
    global.readystatus === false;
    xlsx2json(global.xlsx, {
        dataStartingRow: 2,
        mapping: {
        'article': 'A',
        'title': 'B',
        'size': 'C',
        'barcode': 'D'
    }})
    .then( (json) => {
        for(let arr of json) {
            var i = 0;
            let intervalId = setInterval( () => {
                stickers.createSticker(arr[i])
                .then(stickers.compositeSticker)
                .then((obj) => stickers.drawText(obj))
                .catch( (err) => console.error(err));
                if(i < arr.length-1) i++
                else{
                    console.log('done');
                    zipdir('./public/upload', { saveTo: './public/download/stickers.zip' }, (err, buffer) => {
                        if(err) console.error(err);
                    });
                    global.readystatus === true;
                    clearInterval(intervalId);
                }
            }, 600);
        }
        res.status(200);
        res.send('Some text here');
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
