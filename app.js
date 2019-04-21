const express = require('express')
const bodyParser = require('body-parser')
const uuid = require('uuid/v4')

const config = require('./config')
const dbConnect = require('./db')


const app = express()
app.use(bodyParser.json())

const knex = dbConnect()

app.get('/', (req, res) => {
  res.status(200).send('hello there')
})

/*
  POST harvest
{
  "plantCount": 528,
  "harvestGrams": 202,
  "totalPlantGrams": 3410,
  "classification": "REC",
  "bay": "nw-615",
  "strain": "PEX"
}
*/
app.post('/harvests', async (req, res) => {
  const newHarvest = {
    ...req.body, // add check for all keys
    id: uuid(), 
    date: new Date().toISOString(), 
  }

  const bays = await knex('bays').where({ id : newHarvest.bay })
  const bay = bays[0] // find one?

  if (!bay) {
    res.status(400).send(`bay: ${newHarvest.bay} not found`)
    return
  }

  const harvestRow = {
    id: newHarvest.id,
    date: newHarvest.date,
    plant_count: newHarvest.plantCount,
    harvest_grams: newHarvest.harvestGrams,
    total_plant_grams: newHarvest.totalPlantGrams, 
    classification: newHarvest.classification,
    bay: newHarvest.bay, 
    strain: newHarvest.strain, // confirm exists
  }

  try {
    await knex('harvests').insert(harvestRow)
  } catch (e) {
    //logger here
    res.status(500).send('DB insert error')
    // catches on unknown strain
    return
  }

  // generate response
  const fullHarvest = await expandHarvest(newHarvest)

  res.status(201).send(fullHarvest)
})

/*
  GET harvests

  Parameters
    strain
    Limit response to provided strain
    Example: PEX.
    String

    bay
    Limit response to provided bay ID
    Example: nw615.
    String

    sort_by
    One of date, harvestLbs, percentHarvestedPlantWeight, lbsHarvestedPerSqFt or sqFtPerPlant
    Default: date.
    String
    
    order
    ASC or DESC
    Default: DESC.
    String

    /harvests?strain=PEX&bay=nw615&sort_by=date&order=DESC
*/

const validSortColumns = ['date', 'harvestLbs', 'percentHarvestedPlantWeight', 'lbsHarvestedPerSqFt', 'sqFtPerPlant']
app.get('/harvests', async (req, res) => {
  // check query
  const filter = {}
  if (!!req.query.strain) {
    filter.strain = req.query.strain 
  }

  if (!!req.query.bay) {
    filter.bay = bay
  } 

  const sortColumn = (!!req.query.sort_by && validSortColumns.includes(req.query.sort_by)) ? req.query.sort_by : 'date'
  const order = !!req.query.order ? req.query.order : 'DESC'


  let harvests
  try {
    harvests = await knex('harvests').where(filter)
  } catch (e) {
    res.status(500).send('DB error')
  }

  harvests = harvests.map(objKeysToCamel)
  harvests = await Promise.all(harvests.map(expandHarvest))
  harvests.sort((a, b) => { 
    if (order === 'DESC') { 
      return (a[sortColumn] <= b[sortColumn]) ? 1 : -1
    } else {
      return (a[sortColumn] >= b[sortColumn]) ? 1 : -1
    }
  })
  
  res.status(200).send(harvests)  
})

// helpers
function convertGramsToPounds (grams) {
  return grams / 453.59237
}

async function expandHarvest (harvest) {
  const fullHarvest = { ...harvest }

  const bays = await knex('bays').where({ id : fullHarvest.bay })
  const bay = bays[0] // find one?

  if (!bay) {
    // raise exception?
    return
  }
  // probably should have gone ahead and saved these in DB, lookup wants these too, could sort/order from DB
  fullHarvest.harvestLbs = convertGramsToPounds(fullHarvest.harvestGrams)
  fullHarvest.totalPlantLbs = convertGramsToPounds(fullHarvest.harvestLbs)
  fullHarvest.percentHarvestedPlantWeight = (fullHarvest.harvestGrams / fullHarvest.totalPlantGrams)
  fullHarvest.lbsHarvestedPerSqFt = (fullHarvest.harvestLbs / bay.square_footage)
  fullHarvest.harvestLbsPerLight = (fullHarvest.harvestLbs / bay.light_count)
  fullHarvest.sqFtPerPlant = (bay.square_footage / fullHarvest.plantCount)

  return fullHarvest
}

function objKeysToCamel (obj) {
  const fixed = {}
  Object.keys(obj).forEach(k => {
    fixed[camelCase(k)] = obj[k]
  })
  return fixed
}

function camelCase (str) {
  return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
} 

// server
const server = app.listen(config.get('PORT'), () => {
  const port = server.address().port
  console.log(`App listening on port ${port}`)
})
