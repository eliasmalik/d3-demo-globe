/* global d3 */
'use strict'

const DIAMETER = 400 // pixels
const RADIUS = DIAMETER / 2

const svg = d3.select('#first')
  .append('svg:svg')
  .attr('width', DIAMETER + 50)
  .attr('height', DIAMETER + 50)
  .attr('background-color', 'black')
  .on('mousedown', mousedown)

d3.select(window)
  .on('mouseup', mouseup)
  .on('mousemove', mousemove)

const projection = d3.geo.orthographic()
  .translate([RADIUS + 25, RADIUS + 25])
  .scale(RADIUS)
  .rotate([0, 0, 0])
  .clipAngle(90)

const path = d3.geo.path()
  .projection(projection)

const circle = d3.geo.circle()

let countries, storms

d3.json('./countries.geo.json', (collection) => {
  countries = svg.selectAll('path')
    .data(collection.features)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', 'steelblue')
    .style('stroke', 'black')

  countries.append('svg:title')
    .text((d) => d.properties.name)

  const keyMap = {
    Basin: (s) => s.trim(),
    Center: (s) => s.trim(),
    ISO_time: (s) => new Date(s),
    Latitude: (s) => +s,
    Longitude: (s) => +s,
    Name: (s) => s.trim(),
    Nature: (s) => s.trim(),
    Num: (s) => +s,
    'Pres(WMO)': (s) => +s,
    'Pres(WMO) Percentile': (s) => +s,
    Season: (s) => +s,
    Serial_Num: (s) => s.trim(),
    Sub_basin: (s) => s.trim(),
    Track_type: (s) => s.trim(),
    'Wind(WMO)': (s) => +s,
    'Wind(WMO) Percentile': (s) => +s,
  }

  d3.csv('Allstorms.ibtracs_wmo.v03r08.csv', (d) => {
    return Object.keys(d).reduce((acc, key) => {
      acc[key] = keyMap[key](d[key])
      return acc
    }, {})
  }, (err, _rows) => {
    const rows = _rows.filter((d) => typeof d['Wind(WMO)'] === 'number').reverse()
    const windSpeed = rows.map((d) => d['Wind(WMO)'])

    let maxWindSpeed = 0
    let i
    const len = rows.length
    for (i = 1; i < len; i++) {
      if (windSpeed[i] > maxWindSpeed) maxWindSpeed = windSpeed[i]
    }

    const map = {}
    map.base = d3.scale.linear
    map.mag = map.base().domain([0, maxWindSpeed]).range([0.5, 5])
    map.R = map.base().domain([0, maxWindSpeed]).rangeRound([0, 255])
    map.G = map.base().domain([0, maxWindSpeed]).rangeRound([255, 0])
    map.B = map.base().domain([0, maxWindSpeed]).rangeRound([0, 0])

    storms = svg.selectAll('circle')
      .data(rows.slice(1, 1000))
      .enter()
      .append('path')
      .attr('fill', (d) => {
        const kt = d['Wind(WMO)']
        return 'rgba(' + map.R(kt) + ',' + map.G(kt) + ',' + map.B(kt) + ',1)'
      })
      .datum((d) => circle.origin([d.Longitude, d.Latitude]).angle(map.mag(d['Wind(WMO)']))())
      .attr('class', 'point')
      .attr('d', path)
      .attr('stroke', 'none')
      .attr('fill-opacity', 0.2)
  })
})

let m0, o0

function mousedown () {
  m0 = [d3.event.pageX, d3.event.pageY]
  o0 = projection.rotate()
  d3.event.preventDefault()
}

function mousemove () {
  if (m0) {
    const m1 = [d3.event.pageX, d3.event.pageY]
    const o1 = [o0[0] + (m0[0] - m1[0]), o0[1] + (m1[1] - m0[1])]
    projection.rotate(o1)
    countries.attr('d', path)
    storms.attr('d', path)
  }
}

function mouseup () {
  if (m0) m0 = null
}
