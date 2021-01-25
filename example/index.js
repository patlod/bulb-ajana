var yo = require('yo-yo')
var createRouter = require('base-router')
var nets = require('nets')

// Takes the relative paths from the place where the code is running which is index.html
var explorer = require('./index.js')
var update = require('./lib/update.js')

/*{
  url: './example/example-fs-tree.json',
  json: true
}*/
var router = createRouter({
  '/': function (params, done) {
    nets({
      url: './example/example-fs-tree.json',
      json: true
    }, 
      function (err, res, files) {
      done(err, files)
    })
  }
}, { location: 'hash' })

router.on('transition', function (router, data) {
  update(app, explorer(data))
})

var app = yo`<div class="loading">
  <i className="fa fa-spinner fa-spin"></i> Loading files....
</div>`

document.body.appendChild(app)
router.transitionTo('/')

// With Dat
// var Dat = require('dat-browserify')
// var db = Dat()
//
// var datURI = '6ce5983b1a2ea0f961337a2959964d105b04bceb85f3577d333a0c86547ca98d'
// var swarm = db.joinWebrtcSwarm(datURI)
//
// var archive = db.drive.get(datURI, '.')
// var entries = []
// var entryStream = archive.createEntryStream()
// entryStream.on('data', function (entry) {
//   console.log('got entry', entry)
// })
