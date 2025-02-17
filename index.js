const port = 80;
const express = require('express');
const favicon = require('serve-favicon')
const morgan = require('morgan')
const fs = require('fs');
const path = require('path')
const app = express();
const secret = './public/secret/';
const compression = require('compression');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const thumbnails = './public/thumbnails/'
const { exec } = require("child_process"); // execute thing for the download thing
ffmpeg.setFfmpegPath(ffmpegPath);
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })


function redirect(req, res, next) {
  const link_url = req.url;
  if (link_url.includes('index') || link_url.includes('index.html')) {
    const link_url_without = link_url.substr(0, link_url.lastIndexOf("index"));
    res.redirect(link_url_without)
  }
  if (link_url.includes('.html') || link_url.includes('.htm')) {
    const link_url_without = link_url.substr(0, link_url.lastIndexOf("."));
    res.redirect(link_url_without)
  } else {
    next()
  }
}

morgan.token('date', function getDaate() {
  var dateObj = new Date();
  var month = dateObj.getUTCMonth() + 1; //months from 1-12
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();

  newdate = year + "/" + month + "/" + day;
  return newdate;
})

app.enable("trust proxy");//what is this??
app.use(redirect);
app.use(compression());//compress
app.use(morgan('dev')) // logs requests
app.use(morgan(':remote-addr :date :method :url :status"', { stream: accessLogStream }))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))//serves favicon icon
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public", { extensions: ['html', 'htm'] }));//serves static html files in /public/


app.get("/", (req, res) => {
  res.set("Content-Type", "text/html");
  res.write('<!DOCTYPE html>\n')
  res.write('<html lang="en" data-ng-app="foo">\n')
  res.write('<link rel="stylesheet"href="/styles.scripts/secret.css"/>')
  res.write('<title>Patch Space</title>')
  res.write(`<ng-include src="'/header'"></ng-include> <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.23/angular.min.js"></script> <!-- <html lang="en" ng-app="foo"> --> <script type="text/javascript"> var app = angular.module("foo", []); </script>`)
  res.write('<h1 class="drop" style="--order: 1; text-align: center;">Videos (Click To Play)</h1>')
  res.write('<div class="secret">')
  fs.readdirSync(secret).forEach(file => {
    if (!fs.existsSync(thumbnails+file+'.png')) {
      ffmpeg(secret+file).screenshots({
        timemarks: [100],
        filename: file+'.png',
        folder: thumbnails,
      });
    } else {
      var ext = path.extname(file);
      if (ext == ".mp4" || ext == ".mp3" || ext == ".ogg") {
        res.write("<a href='/secret_player?v=" + file + "'><img class='secret video'style='max-height: 500px;'src='/thumbnails/"+file+".png'></img></a>")
      }
    }
  })
  res.write('<h1 class="drop" style="--order: 1; text-align: center;">Photos</h1>')
  fs.readdirSync(secret).forEach(file => {
    let ext = path.extname(file);
    if (ext == ".jpeg" || ext == ".jpg" || ext == ".png") {
      res.write("<img class='secret photo' src='/secret/" + file + "'>")
    }
  })
  res.end("</div>");
})

app.get("/secret_player",(req,res) => {
  let v = req.query.v;
  if (typeof v == 'undefined'){
    res.redirect("/secret")
  }else{
  res.set("Content-Type", "text/html");
  //MAIN VIDEO PLAYER
  if (typeof v !== 'undefined') {
    let vid;
    fs.readdirSync(secret).every(file => {
      if (v == file) {
        vid = true;
      }
      return true;
    })
    if (vid == true) {
      let ext = path.extname(v);
      if (ext == ".mp4" || ext == ".mp3" || ext == ".ogg") {
        
        res.write(`<!DOCTYPE html><html lang="en" data-ng-app="foo"><head>`)
        res.write(`<meta charset="UTF-8"><title>Video Player</title>`)
        res.write(`<ng-include src="'/header'"></ng-include> <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.23/angular.min.js"></script><script type="text/javascript"> var app = angular.module("foo", []); </script>`)
        res.write(`<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@200&display=swap" rel="stylesheet">`)
        res.write(`<link rel="stylesheet" href="/styles.scripts/player.css">`)
        res.write(`</head><body>`)
        res.write(`<div id="main_vid_bg"><video id="main_vid" src='/secret/`+v+`#t=3.1' controls preload=auto onloadstart='this.volume=0.224' poster=""></video><h1 id="main_vid_title">`+v.substr(0, v.lastIndexOf('.'))+`</h1></div>`)
        res.write('</body></html>')
      }
    }else{
      res.redirect("/secret")
      return
    }
  }
  res.write('<div id="scroll">')
  fs.readdirSync(secret).forEach(file => {
    if (!fs.existsSync(thumbnails+file+'.png')) {
      ffmpeg(secret+file).screenshots({
        timemarks: [100],
        filename: file+'.png',
        folder: thumbnails,
      });
    } else {
      var ext = path.extname(file);
      if (v !== file && ext == ".mp4" || ext == ".mp3" || ext == ".ogg") {
        res.write("<a href='/secret_player?v=" + file + "'><div class='div_of_vid'><img class='vid' src='/thumbnails/"+file+".png'></img><h2 class='vid_title'>"+file.substring(0, file.lastIndexOf('.'))+"</h2></div>");
      }
    }
  })
  res.write('</div>')
  //NOT MAIN VIDEO PLAYER
  res.end(`</body></html>`)
}})



app.listen(port,"0.0.0.0");
console.log("server on port " + port);
