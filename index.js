'use strict'

const fs = require('fs')
const path = require('path')
const http = require('http')

const server = http.createServer((req, res) => {
  console.log('CLIENT HITS: ', req.url)
  if (/\.js$/.test(req.url)) {
    res.writeHead(200, {'Content-Type': 'text/javascript'})

    if (/script\.js$/.test(req.url)) {
      fs.readFile(path.join(__dirname, 'script.js'), (err, result) => {
        if (err) throw err
        res.end(result.toString('utf8'))
      })
    } else if (/d3\.min\.js$/.test(req.url)) {
      fs.readFile(path.join(__dirname, 'node_modules', 'd3', 'd3.min.js'), (err, result) => {
        if (err) throw err
        res.end(result.toString('utf8'))
      })
    } else {
      res.end('No')
    }
  } else if (/countries.geo.json$/.test(req.url)) {
    res.writeHead(200, {'Content-Type': 'application/javascript'})
    fs.readFile(path.join(__dirname, 'countries.geo.json'), (err, result) => {
      if (err) throw err
      res.end(result.toString('utf8'))
    })
  } else if (/\.csv$/.test(req.url)) {
    res.writeHead(200, {'Content-Type': 'text/csv'})
    fs.readFile(path.join(__dirname, 'Allstorms.ibtracs_wmo.v03r08.csv'), (err, result) => {
      if (err) throw err
      res.end(result.toString('utf8'))
    })
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'})
    fs.readFile(path.join(__dirname, 'index.html'), (err, result) => {
      if (err) throw err
      res.end(result.toString('utf8'))
    })
  }
})

server.listen(4000)
