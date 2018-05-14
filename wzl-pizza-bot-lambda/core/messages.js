module.exports = {
  NEW_SESSION_STATE: {
    WELCOME: `Welcome to Wize Pizza Bot. You can: Order a Pizza. Or, Track order. Or, Login.`,
    UNHANDLED: `Sorry, I didn't get that.You can: Order a Pizza. Or, Track order. Or, Login.'`
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
  },
  AUTH_NAME_STATE: {
    HELP: `You can try: 'My name is Alejandro'`,
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
    NAME_FOUND: `What is your PIN?`,
    NAME_NOT_FOUND: `Error. Your Username does not exist`
  },
  AUTH_PIN_STATE: {
    HELP: `You can try: 'My PIN is 1234'`,
    UNHANDLED: `Sorry, I didn't get that.You can try: 'alexa, My PIN is 1234'`,
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
    AUTHENTICATED: `You've been authenticated!`,
    AUTHENTICATED_FAILED: `Error. You haven't been authenticated`
  }
}
