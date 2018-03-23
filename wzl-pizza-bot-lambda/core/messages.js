module.exports = {
  NEW_SESSION_STATE: {
    WELCOME: `Welcome to Wize Pizza Bot. You can: Order a Pizza. Or, Track order.`
  },
  START_STATE: {
    HELP: `You can try: 'alexa, wize pizza bot' or 'alexa, ask wize pizza bot for a pizza with pepperoni and thin crust`,
    UNHANDLED: `Sorry, I didn't get that.You can try: 'alexa, wize pizza bot' or 'alexa, ask wize pizza bot for a pizza with pepperoni and thin crust'`,
    STOP_INTENT: `Ciao!`,
    CANCEL_INTENT: `Ciao!`,
    FAIL_ORDER: `Sorry, we couldn't take your order.`,
    FAIL_TRACK_ORDER: 'Sorry, we couldn\'t track your order.',
    MISING_SLOTS: {
      'response': {
        'directives': [
          {
            'type': 'Dialog.Delegate'
          }
        ],
        'shouldEndSession': false
      },
      'sessionAttributes': {}
    }
  },
  PAYING_STATE: {
    HELP: `You can try: 'alexa, I will pay with cash'`,
    UNHANDLED: `Sorry, I didn't get that.You can try: 'alexa, I will pay with cash'`,
    STOP_INTENT: `Ciao!`,
    CANCEL_INTENT: `Ciao!`,
    MISING_SLOTS: {
      'response': {
        'directives': [
          {
            'type': 'Dialog.Delegate'
          }
        ],
        'shouldEndSession': false
      },
      'sessionAttributes': {}
    },
    PAYMENT_READY: `We've received your payment. Your pizza is on the way!`
  }
}
