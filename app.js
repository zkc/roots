const express = require('express')

const config = require('./config')


const app = express()

app.get('/', (req, res) => {
  res.status(200).send('hello there')
})

const server = app.listen(config.get('PORT'), () => {
  const port = server.address().port;
  console.log(`App listening on port ${port}`);
});
