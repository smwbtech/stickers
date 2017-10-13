const express = require('express');
const multer = require('multer');
const fs = require('fs');
const xlsx2json = require('xlsx2json');

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './uploads/')
//   },
//   filename: function (req, file, cb) {
//     crypto.pseudoRandomBytes(16, function (err, raw) {
//       cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
//     });
//   }
// });
let upload = multer({ dest: './public/upload/' });

let app = express();

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'pug');

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
