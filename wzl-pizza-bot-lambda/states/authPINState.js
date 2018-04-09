const Alexa = require('alexa-sdk')
const states = require('./states')
const messages = require('../core/messages')
const oktaAuthentication = require('../core/oktaAuthentication')

const handlers = Alexa.CreateStateHandler(states.AUTH_PIN_STATE, {
  'AuthenticatePIN': function () {
    authenticatePIN(this)
  },
  'AMAZON.StopIntent': function () {
    this.response.speak(messages.AUTH_PIN_STATE.STOP_INTENT)
    this.emit(':responseReady')
  },
  'AMAZON.HelpIntent': function () {
    this.response.speak(messages.AUTH_PIN_STATE.HELP)
    this.emit(':responseReady')
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak(messages.AUTH_PIN_STATE.CANCEL_INTENT)
    this.emit(':responseReady')
  },
  'Unhandled': function () {
    this.response.speak(messages.AUTH_PIN_STATE.UNHANDLED)
    this.emit(':responseReady')
  }
})

class AuthPINState {
  handlers () {
    return handlers
  }
}

function authenticatePIN (context) {
  const slots = context.event.request.intent.slots

  if (!slots.pinNumber.value) {
    // Some slots are missing.
    console.log('PIN not received')
    context.context.succeed(messages.AUTH_PIN_STATE.MISING_SLOTS)
  } else {
    // Validate here
    console.log('PIN received: ' + slots.pinNumber.value)
    oktaAuthentication.verifyUser(context.attributes['username'], slots.pinNumber.value)
      .then(() => {
        context.response.cardRenderer(messages.AUTH_PIN_STATE.AUTHENTICATED)
        context.response.speak(messages.AUTH_PIN_STATE.AUTHENTICATED)
        context.response.shouldEndSession(true)
        context.emit(':responseReady')
      })
      .catch((err) => {
        console.log('ERROR-handler' + err)
        context.response.cardRenderer(messages.AUTH_PIN_STATE.AUTHENTICATED_FAILED)
        context.response.speak(messages.AUTH_PIN_STATE.AUTHENTICATED_FAILED)
        context.response.shouldEndSession(true)
        context.emit(':responseReady')
      })
  }
}

module.exports = new AuthPINState()
