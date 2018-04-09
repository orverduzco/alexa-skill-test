'use strict'
const Alexa = require('alexa-sdk')
const states = require('./states/states')
const startState = require('./states/startState')
const payingState = require('./states/payingState')
const authPINState = require('./states/authPINState')
const messages = require('./core/messages')

module.exports.handler = (event, context, callback) => {
  let alexa = Alexa.handler(event, context)
  alexa.appId = process.env.ASK_APP_ID || 'amzn1.ask.skill.57a085a6-ee65-42a1-b9f2-dafbaf384ea6'
  alexa.registerHandlers(newSessionHandlers, startState.handlers(), payingState.handlers(), authPINState.handlers())
  alexa.execute()
}

let newSessionHandlers = {
  // Almost every request will pass through 'NewSession'
  'NewSession': function () {
    this.handler.state = states.START_STATE
    this.emit(':ask', messages.NEW_SESSION_STATE.WELCOME)
  },
  'Unhandled': function () {
    this.response.speak(messages.NEW_SESSION_STATE.UNHANDLED)
    this.emit(':responseReady')
  }
}
