const express = require("express");
const app = express();
const https = require('https')
const fs = require('fs')
const path = require('path');
const router = express.Router();


const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}
app.use(express.static(__dirname));

/*app.get("/", (req, res) => {
  res.sendFile(__dirname + "/indexMenu.html");
});*/

router.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
  //__dirname : It will resolve to your project folder.
});

router.get('/indexFull',function(req,res){
  res.sendFile(path.join(__dirname+'/indexFull.html'));
});

router.get('/indexSmall',function(req,res){
  res.sendFile(path.join(__dirname+'/indexSmall.html'));
});

app.use('/static', express.static(__dirname + '/tf'));
app.use('/', router);


const server = https.createServer(httpsOptions, app).listen(3000, () => {
  console.log('server running at ' + 3000)
})

/*app.listen(3000, () => {
  console.log("Application started and Listening on port 3000");
});*/

// serve your css as static


