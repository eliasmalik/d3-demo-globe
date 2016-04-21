'use strict'

const fs = require('fs')
const path = require('path')
const http = require('http')

const server = http.createServer((req, res) => {
  if (/\/public\//.test(req.url)) {
    const ext = req.url.split('.')[1]
    const contentType = ext === 'json' ? 'application/json' : 'text/' + ext
    fs.readFile(path.join(__dirname, req.url), (err, result) => {
      if (err) throw err
      res.writeHead(200, {'Content-Type': contentType})
      res.end(result.toString('utf8'))
    })
  } else {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, result) => {
      if (err) throw err
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(result.toString('utf8'))
    })
  }
})

server.listen(4000)
