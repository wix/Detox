const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port = process.env.PORT || 9001;

const router = express.Router();

router.get('/', (req, res) => {
  res.json({message: 'hello world!'});
});

router.route('/delay/:delay')
      .get(async(req, res) => {
        setTimeout(() => {
          res.json({message:`Response was delayed by ${req.params.delay}ms`});
        }, req.params.delay);
      });

app.use('/', router);

app.listen(port);
console.log('Mock server listening on port ' + port);