var express = require('express');
var bodyParser = require('body-parser');
var fetch = require('isomorphic-fetch');
var cp = require('child_process');
var path = require('path');
var fs = require('fs');

//construct our router
var router = express.Router();
router.use(bodyParser.text());

router.route('*')
  .get(function (req, res, next) {
    res.send('use post instead');
  })
  .post(function (req, res, next) {
    var posted = req.body;

    console.log('received body:', posted);

    var fileLocation = path.resolve(__dirname, 'temp.txt');
    var scriptLocation = path.resolve(__dirname, 'helper.py');

    //write a file with the post body, so we can easily communicate between the javascript and python process
    fs.writeFile(fileLocation, posted, 'utf8', function fileWriter(err) {
      if (err) {
        return res.status(500).send('error writing file');
      }

      //execute our python helper, passing the file name
      cp.exec('python ' + scriptLocation + ' ' + fileLocation, function runPython(error, stdout, stderr) {
        if (error) {
          console.error(`exec error: ${error}`);
          res.status(500).send('error running python');
        }

        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);

        res.send(`${stdout}`);
      });
    });
  });

module.exports = router;
