/* global d3, C */
'use strict'

// Create an empty svg on the page, attach listener
const svg = d3.select('#first')
  .append('svg:svg')
  .attr('width', C.CANVAS.WIDTH)
  .attr('height', C.CANVAS.HEIGHT)
  .on('mousedown', mousedown)

// Create a circle with the radius of the globe
// (to serve as the 'oceans')
svg.append('svg:circle')
  .attr('cx', C.SPHERE.BACKGROUND.CX)
  .attr('cy', C.SPHERE.BACKGROUND.CY)
  .attr('r', C.SPHERE.BACKGROUND.R)
  .attr('fill', C.SPHERE.BACKGROUND.COLOR)

// Attach listeners on window to stop the click scroll
// and calculate the new rotation
d3.select(window)
  .on('mouseup', mouseup)
  .on('mousemove', mousemove)

// Generate orthographic projection function
// note: clipAngle defines the circle within which the
// back-side of the projection is clipped. Selecting an
// angle of 90 obscures the whole back hemisphere
const projection = d3.geo.orthographic()
  .translate([C.PROJECTION.ORIGIN.X, C.PROJECTION.ORIGIN.Y])
  .scale(C.PROJECTION.SCALE)
  .rotate(C.PROJECTION.ROT_INIT)
  .clipAngle(C.PROJECTION.CLIP_ANGLE)

// Create the path generator and give it the projection to use
const path = d3.geo.path()
  .projection(projection)

// Create a circle generator to help create storm points
const circle = d3.geo.circle()

let countries, storms

// Load geo.json data containing the paths of all the countries
d3.json('/public/countries.geo.json', (collection) => {

  // Create a selection,
  // bind geo.json data to selection
  // append a path element for each data element
  // use the path generator to generate the 'd' attr (path)
  // style it
  countries = svg.selectAll('path')
    .data(collection.features)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', 'steelblue')
    .style('stroke', 'black')

  // add title to each path so country name will appear on hover
  countries.append('svg:title')
    .text((d) => d.properties.name)
})

const trim = (s) => s.trim()
const toNum = (s) => +s

// Data map to clean up raw csv
const stormCsvKeyMap = {
  'Basin': trim,
  'Center': trim,
  'ISO_time': (s) => new Date(s),
  'Latitude': toNum,
  'Longitude': toNum,
  'Name': trim,
  'Nature': trim,
  'Num': toNum,
  'Pres(WMO)': toNum,
  'Pres(WMO) Percentile': toNum,
  'Season': toNum,
  'Serial_Num': trim,
  'Sub_basin': trim,
  'Track_type': trim,
  'Wind(WMO)': toNum,
  'Wind(WMO) Percentile': toNum,
}

// Read csv file; accessor (1st arg) cleans up data with data map
d3.csv('/public/Allstorms.ibtracs_wmo.v03r08.csv', (d) => {
  return Object.keys(d).reduce((acc, key) => {
    acc[key] = stormCsvKeyMap[key](d[key])
    return acc
  }, {})
}, (err, _rows) => {
  // only look at storms for which wind speed data exists
  let rows = _rows.filter((d) => d['Wind(WMO)'] > 0)

  // select only the last N data points
  rows = rows.slice(rows.length - C.DATA.MAX_DATA_POINTS)

  // find the maximum windspeed
  const maxWindSpeed = rows
    .reduce((max, d) => max < d['Wind(WMO)'] ? d['Wind(WMO)'] : max, 0)

  // use d3 scales to map windspeed range to:
  // circle radius and RGB colour values
  // RBG vals restricted to be in the RG plane, integers
  const map = {
    mag: d3.scale.linear().domain([0, maxWindSpeed]).range([0.5, 5]),
    red: d3.scale.linear().domain([0, maxWindSpeed]).rangeRound([0, 255]),
    green: d3.scale.linear().domain([0, maxWindSpeed]).rangeRound([255, 0]),
    blue: d3.scale.linear().domain([0, maxWindSpeed]).rangeRound([0, 0]),
  }

  // create selection
  // bind data
  // append a path element for each storm
  // fill the circle with an rgb value proportional to windspeed
  // transform bound data to circle path w/ colour proportional to windspeed
  // set the path generator and style
  storms = svg.selectAll('circle')
    .data(rows)
    .enter()
    .append('path')
    .attr('fill', (d) => {
      const kt = d['Wind(WMO)']
      return 'rgba(' + map.red(kt) + ',' + map.green(kt) + ',' + map.blue(kt) + ',1)'
    })
    .datum((d) => {
      const origin = [d.Longitude, d.Latitude]
      const radius = map.mag(d['Wind(WMO)'])
      return circle.origin(origin).angle(radius)()
    })
    .attr('class', 'point')
    .attr('d', path)
    .attr('stroke', 'none')
    .attr('fill-opacity', 0.2)
})

let m0, o0

function mousedown () {
  // capture mouse position and current projection orientation
  m0 = [d3.event.pageX, d3.event.pageY]
  o0 = projection.rotate()
  d3.event.preventDefault()
}

function mousemove () {
  // if mousemove && mousedown
  //  calculate the new rotation angle (roll ignored)
  //  update the projection object with new orientation
  //  re-draw countries and storms using path obj (which has reference to projection)
  if (m0) {
    const m1 = [d3.event.pageX, d3.event.pageY]
    const o1 = [o0[0] + (m0[0] - m1[0]), o0[1] + (m1[1] - m0[1])]
    projection.rotate(o1)
    countries.attr('d', path)
    storms.attr('d', path)
  }
}

function mouseup () {
  // reset -- set mouse position to null
  if (m0) m0 = null
}
