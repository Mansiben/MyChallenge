const csv = require('csv-parser')
const fs = require('fs')
const results = [];
const newArr = [];

const filePath = process.argv[2];

fs.createReadStream(filePath)
  .pipe(csv({ separator: ',' }))
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results);
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]

    var data = results[0].json;
    console.log(data);
   for(var i=0; i<data.length; i++){
    newArr.push(data[i].split(","));  

   }
    
    console.log(newArr);
  });