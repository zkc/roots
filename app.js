const express = require('express')
const bodyParser = require('body-parser')

const config = require('./config')
const dbConnect = require('./db')


const app = express()
app.use(bodyParser.json())


const knex = dbConnect()
// console.log(knex)

function convertGramsToPounds (grams) {
  return Math.round(grams / 453.59237)
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
app.post('/harvests', (req, res) => {
  console.log(req)
  // confirm all good

  // add to DB

  // generate response

  res.status(201).send('nice harvest')
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
// app.get()

const server = app.listen(config.get('PORT'), () => {
  const port = server.address().port
  console.log(`App listening on port ${port}`)
})
