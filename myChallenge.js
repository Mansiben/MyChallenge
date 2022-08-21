const fs = require('fs');
const { finished } = require('stream/promises');
const { format } = require('@fast-csv/format');
const csvtojson = require("csvtojson");

//fetch the filepath from arguments parameter
var filePath = process.argv[2];

let activities = [];
const records = [];
var arrToWrite = [];

//output file to store the result
const fileName = 'output.csv';

//processFile function will take the file path from parameter argvs and using csv_parse, it will parse and 
// push the date into records.
const processFile = async () => {

  let fileReadStream = fs.createReadStream(filePath);
  let invalidLineCount = 0;
  csvtojson({ "delimiter": ",", "output": "default", "fork": true })
    .preFileLine((fileLineString, lineIdx) => {
      let invalidLinePattern = /^['"].*[^"'];/;
      if (invalidLinePattern.test(fileLineString)) {
        console.log(`Line #${lineIdx + 1} is invalid, skipping:`, fileLineString);
        fileLineString = "";
        invalidLineCount++;
      }
      return fileLineString
    })
    .fromStream(fileReadStream)
    .subscribe((dataObj) => {
      records.push(dataObj);
    },
      (err) => {
        console.error("Error:", err);
      },
      (success) => {
        // console.log("Skipped lines:", invalidLineCount);
        // console.log("Success");
      });

  await finished(fileReadStream);
  return records
}

//isSquare() function determines if the given length of array is a square or not.
var isSquare = function (n) {
  return n > 0 && Math.sqrt(n) % 1 === 0;
};


// display() function will push the final result into array.
function display(m) {
  for (let l of m)
    arrToWrite.push(l.join())
}


//rotate() function will shift the values of the array elements.
function rotate(mtx, top, left, bottom, right) {
  let elem = mtx[top][left];
  for (let y = top; y < bottom; y++)           // downwards on the left
    mtx[y][left] = mtx[y + 1][left];
  for (let x = left; x < right; x++)           // righwards at the bottom
    mtx[bottom][x] = mtx[bottom][x + 1];
  for (let y = bottom; y > top; y--)           // upwards on the right
    mtx[y][right] = mtx[y - 1][right];
  for (let x = right; x > left + 1; x--)         // leftwards on the top
    mtx[top][x] = mtx[top][x - 1];
  mtx[top][left + 1] = elem;
}

//simpleArraySum () function do the summation of the edges.
function simpleArraySum(ar) {
  var sum = 0;
  for (var i = 0; i < ar.length; i++) {
    if (typeof ar[i] == `number`) sum += ar[i];
  }
  return sum;
}

// CSVtoArray() function will convert comma seperated values from csv stream into array.
function CSVtoArray(text) {
  var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
  var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
  // Return NULL if input string is not well formed CSV string.
  if (!re_valid.test(text)) return null;
  var a = [];                     // Initialize array to receive values.
  text.replace(re_value, // "Walk" the string using replace with callback.
    function (m0, m1, m2, m3) {
      // Remove backslash from \' in single quoted values.
      if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
      // Remove backslash from \" in double quoted values.
      else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
      else if (m3 !== undefined) a.push(m3);
      return ''; // Return empty string.
    });
  // Handle special case of empty last value.
  if (/,\s*$/.test(text)) a.push('');
  return a;
};

(async () => {
  activities = await processFile()
  var data = activities[0].json;
  var finalData = CSVtoArray(data);
  var listNum = [];
  for (var i = 0; i < finalData.length; i++) {
    //creating a list of numbers to determine the square.
    listNum.push(parseInt(finalData[i].replace("[", "").replace("]", "")));
  }

  //metric variable is a number which determines the size of metrics for square.
  //e.g. if metric=3 then 3*3 square.
  var metric = Math.sqrt(listNum.length);

  //Usecase 1: If the list of numbers forms a square?
  if (isSquare(listNum.length)) {

    //Usecase 2: If the array has only one element then it will always form a sqare, so result will be written to output.csv
    if (listNum.length == 1) {
      const csvFile = fs.createWriteStream(fileName);
      const stream = format({ headers: true });
      stream.pipe(csvFile);
      let randoms = [];
      const min = 1;
      const max = 90000;
      const noOfRows = 1;

      for (i = 0; i < noOfRows; i++) {
        randoms.push({
          id: activities[0].id,
          json: "[" + listNum + "]",
          is_valid: 'true'
        });
        stream.write(randoms[i]);
      }

      stream.end();
      console.log("output.csv is generated inside project directory.");
    }

    //Usecase 3: If the array has more than one elements
    else if (listNum.length > 1) {

      //Form the square metric based on the list of numbers:

      let numOfRows = metric;
      var count = 0;
      var index = 0;
      var squares = new Array();

      for (var i = 0; i < numOfRows; i++) {

        squares[i] = new Array();
        for (var j = count; j < metric + index; j++) {
          squares[i].push(listNum[j]);

        }
        count = j;
        index = j;
      }

      console.log("Generated square metric:");
      console.log(squares);

      //After creating the square metric, need to find the sides.

      var side1 = simpleArraySum(squares[0]);
      var side4 = simpleArraySum(squares[metric - 1]);

      var side2 = 0;
      var side3 = 0;
      for (var index = 1; index < metric - 1; index++) {
        side2 = side2 + squares[index][0];
        side3 = side3 + squares[index][metric - 1];
      }

      var squareEdgeLength = side1 + side2 + side3 + side4;

      //Usecase 4: If the square edge length is even then shift the values in the clockwise direction.
      if (squareEdgeLength % 2 == 0) {
        let m1 = [squares];
        display(m1);
        for (let a = 0, b = squares.length - 1; b > a; a++ , b--) {
          rotate(squares, a, a, b, b);
        }
        display(m1);
        const csvFile = fs.createWriteStream(fileName);
        const stream = format({ headers: true });
        stream.pipe(csvFile);
        let randoms = [];
        const min = 1;
        const max = 90000;
        const noOfRows = 1;

        for (i = 0; i < noOfRows; i++) {
          randoms.push({
            id: activities[0].id,
            json: "[" + arrToWrite[1] + "]",
            is_valid: isSquare(listNum.length)
          });
          stream.write(randoms[i]);
        }

        stream.end();
        console.log("output.csv is generated inside project directory.");

      }

      //Usecase 4: If the square edge length is odd and there is a singular field in the middle of
      //the table, it is not moved 
      else {
        const csvFile = fs.createWriteStream(fileName);
        const stream = format({ headers: true });
        stream.pipe(csvFile);
        let randoms = [];
        const min = 1;
        const max = 90000;
        const noOfRows = 1;

        for (i = 0; i < noOfRows; i++) {
          randoms.push({
            id: activities[0].id,
            json: "[" + listNum + "]",
            is_valid: 'false'
          });
          stream.write(randoms[i]);
        }

        stream.end();
        console.log("output.csv is generated inside project directory.");

      }
    }
  }

  //Usecase 5: If the list of numbers does not form a square. Then it will write the result with empty array inside output.csv
  else {
    const csvFile = fs.createWriteStream(fileName);
    const stream = format({ headers: true });
    stream.pipe(csvFile);
    let randoms = [];
    const noOfRows = 1;

    for (i = 0; i < noOfRows; i++) {
      randoms.push({
        id: activities[0].id,
        json: "'[]'",
        is_valid: 'false'
      });
      stream.write(randoms[i]);
    }

    stream.end();
    console.log("output.csv is generated inside project directory.");
  }

})()


