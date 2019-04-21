const express = require('express')
const bodyParser = require('body-parser')
const uuid = require('uuid/v4')

const config = require('./config')
const dbConnect = require('./db')


const app = express()
app.use(bodyParser.json())

const knex = dbConnect()

function convertGramsToPounds (grams) {
  return grams / 453.59237
}

app.get('/', (req, res) => {
  res.status(200).send('hello there')
})


// add harvest
/*
{
  "plantCount": 528,
  "harvestGrams": 202,
  "totalPlantGrams": 3410,
  "classification": "REC",
  "bay": "nw-615",
  "strain": "PEX"
}
*/

app.get('/test-bay', (req, res) => { 
  knex('bays').where({id : "nw-615"})
    .then(row => {
      res.status(200).send({row})
    })
})

app.post('/harvests', async (req, res) => {
  // confirm all good

  // add to DB
  // plant_count
  // harvest_grams
  // total_plant_grams
  // classification
  // bay -fk
  // strain -fk
  // date 
  // id - pk

  const newHarvest = {
    ...req.body, 
    id: uuid(), 
    date: new Date().toISOString().split('T')[0], 
  }

  let bay = await knex('bays').where({ id : newHarvest.bay })
  bay = bay[0] //find one?

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
    console.log(e) //logger
    res.status(500).send('DB insert error')
    // catches on unknown strain
    return
  }


  // generate response
  /*
  {
  "id": "uih4r9u8ewafu",
  "plantCount": 528,
  "harvestGrams": 202,
  "totalPlantGrams": 3410,
  "classification": "REC",
  "bay": "nw-615",
  "strain": "PEX",
  "date": "01/01/2019",
  
  "totalPlantLbs": 7.6116071429, -
  "harvestLbs": 0.4508928571, -

  "percentHarvestedPlantWeight": 5.923753666,
  "lbsHarvestedPerSqFt": 0.008318696331,
  "plantsPerLight": 9.4285714286, --- need bay!
  "harvestLbsPerLight": 0.008051658162,
  "sqFtPerPlant": 0.5770491803
  }

  bay: 
  id
  light_count
  square_footage 
  */
  newHarvest.harvestLbs = convertGramsToPounds(newHarvest.harvestGrams)
  newHarvest.totalPlantLbs = convertGramsToPounds(newHarvest.harvestLbs)
  newHarvest.percentHarvestedPlantWeight = (newHarvest.harvestGrams / newHarvest.totalPlantGrams)
  newHarvest.lbsHarvestedPerSqFt = (newHarvest.harvestLbs / bay.square_footage)
  newHarvest.harvestLbsPerLight = (newHarvest.harvestLbs / bay.light_count)
  newHarvest.sqFtPerPlant = (bay.square_footage / newHarvest.plantCount)

  res.status(201).send(newHarvest)
})

// get harvests
/*
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
*/
// app.get('/harvests', (req, res) => {
//   // check query

//   // get from db

//   // return list  
// })

const server = app.listen(config.get('PORT'), () => {
  const port = server.address().port
  console.log(`App listening on port ${port}`)
})
