const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
})





app.listen(port, () => {
    console.log(`Rezerwacje dla restauracji Solvro - LISTENING ON PORT ${port}`)
})