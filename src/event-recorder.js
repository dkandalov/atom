(function () {
  var isRecording = false
  var recordedEvents = []

  var isPlaying = false
  var replayingEvents = []
  var replayEvent = null
  var passHiddenInput = false
  var passHiddenInputCountdown = 0

  exports.onWindowEvent = function (event) {
    console.log(event)

    if (event.code === 'KeyR' && event.shiftKey && event.altKey && event.metaKey) {
      onRecordShortcut(event)
      return true
    }
    if (event.code === 'KeyP' && event.shiftKey && event.altKey && event.metaKey) {
      onPlayShortcut(event)
      return true
    }
    if (isPlaying) {
      if (replayEvent !== null && event.keyCode === replayEvent.keyCode) {
        console.log('skipped')
        return false
      } else {
        event.stopImmediatePropagation()
        event.stopPropagation()
        if (event.type === 'keydown' && replayingEvents.length > 0) {
          replayEvent = replayingEvents.shift()
          if (replayEvent !== null) {
            passHiddenInput = true
            passHiddenInputCountdown = 1
            var http = require('http')
            let path = `/?keyCode=${replayEvent.keyCode}&alt=${replayEvent.alt}&shift=${replayEvent.shift}&ctrl=${replayEvent.ctrl}&meta=${replayEvent.meta}`
            http.get({host: 'localhost', port: '8080', path: path}, (res) => {
              if (res.statusCode !== 200) console.log(res)
            })
          }
        }
        return true
      }
    }
    if (isRecording && event.type === 'keydown') {
      recordedEvents.push(event)
    }
    return false
  }

  exports.onHiddenInputEvent = function (event) {
    console.log(event)
    if (!isPlaying) return false

    if (passHiddenInput) {
      passHiddenInputCountdown -= 1
      if (passHiddenInputCountdown < 0) {
        passHiddenInput = false
        return false
      } else {
        return true
      }
    }
    return true
  }

  function onPlayShortcut (event) {
    event.stopImmediatePropagation()
    event.stopPropagation()

    isPlaying = !isPlaying
    console.log(`isPlaying = ${isPlaying}`)

    if (isPlaying) {
      let fs = require('fs')
      fs.readFile('/tmp/events.json', (err, text) => {
        if (err) return console.log(err)
        replayingEvents = JSON.parse(text)
      })
    } else {
      replayingEvents = []
    }
  }

  function onRecordShortcut (event) {
    event.stopImmediatePropagation()
    event.stopPropagation()

    isRecording = !isRecording
    console.log(`isRecording = ${isRecording}`)

    if (!isRecording && recordedEvents.length > 0) {
      saveRecordedEvents()
      recordedEvents = []
    }
  }

  function saveRecordedEvents () {
    let data = []
    recordedEvents.forEach(it => {
      data.push({
        keyCode: it.keyCode,
        code: it.code,
        shift: it.shiftKey,
        alt: it.altKey,
        ctrl: it.ctrlKey,
        meta: it.metaKey
      })
    })
    let fs = require('fs')
    fs.writeFile('/tmp/events.json', JSON.stringify(data), function (err) {
      if (err) return console.log(err)
      console.log('The file was saved!')
    })
  }
}).call(this)
