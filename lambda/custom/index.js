'use strict';
const Alexa = require('alexa-sdk');
let mongoose = require('mongoose');
require('dotenv').config();

const databaseUri = process.env.MONGO_DB;

exports.handler = function(event, context) {
    let alexa = Alexa.handler(event, context);

    alexa.appId = process.env.ASK_APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function getOrder( context ) {
    // validate if we get id
    const slots = context.event.request.intent.slots;
    if (!slots.orderNumber.value) {
        context.context.succeed( {
            "response": {
                "directives": [
                    {
                        "type": "Dialog.Delegate"
                    }
                ],
                "shouldEndSession": false
            },
            "sessionAttributes": {}
        } );
    } else {
        const orderNumber = parseInt(slots.orderNumber.value);
        
        // Create connection
        console.log( `Connecting to DB: ${ databaseUri }` );
        mongoose.connect( databaseUri );
        mongoose.Promise = global.Promise;

        let db     = mongoose.connection;
        let Schema = mongoose.Schema;

        db.on( 'error', console.error.bind( console, 'MongoDB connection error: ' ) );
            
        let orderSchema = new Schema( {
        orderId: {
            type: Number,
            default: 1
        },
        ingredients: {
            type: String,
            default: ''
        },
        crust: {
            type: String,
            default: ''
        },
        delivered: {
            type: Boolean,
            default: false 
        },
        cooked: {
            type: Boolean,
            default: false 
        }
        } );

        let orderModel = mongoose.model( 'PizzaOrders', orderSchema );

        orderModel.findOne({
            orderId:orderNumber
            }, (error, order) => {
                db.close(() => {
                if (error) {
                    console.log( "error" );
                    console.error( error );
                    context.emit( ':tell', 'Sorry, we couldn\'t find your order.' );
                } else {
                    console.log( "Order obtained! " + order )
                    context.response.cardRenderer( `Wize Pizza Bot – Order #${ order.orderId }`, `Retreived order: Pizza ${ order.crust } ${ order.ingredients } pizza.` );
                    context.response.speak( `The order you searched: ${ order.orderId }, ${ order.ingredients }, ${ order.crust }` );
                    context.emit( ':responseReady' );
                }
                
            })
        })   
    }
}

function getOptionList( options ) {
    if ( options.length === 1 ) {
        return options[0];
    } else if ( options.length === 2 ) {
        return `${ options[0] } and ${ options[1] }`;
    }

    return options.slice( 0, -1 ).join( ', ' ) + ' and ' + options.slice( -1 )
}

function orderPizza( context ) {
    const confirmation     = context.event.request.intent.confirmationStatus;
    const slots            = context.event.request.intent.slots;
    const validIngredients = [ 'pepperoni', 'mushrooms', 'onion', 'pineapple' ];
    const validThicknesses = [ 'thin', 'thick' ];

    if ( !slots.ingredient.value || !slots.thickness.value ) {
        // Some slots are missing.
        context.context.succeed( {
            "response": {
                "directives": [
                    {
                        "type": "Dialog.Delegate"
                    }
                ],
                "shouldEndSession": false
            },
            "sessionAttributes": {}
        } );
    } else if ( !slots.ingredient.resolutions || !slots.ingredient.resolutions.resolutionsPerAuthority || !slots.ingredient.resolutions.resolutionsPerAuthority[0].values || validIngredients.indexOf( slots.ingredient.resolutions.resolutionsPerAuthority[0].values[0].value.name.toLowerCase() ) < 0 ) {
        // The ingredient slot isn't valid
        context.emit( ':elicitSlot', 'ingredient', `We don't have ${ slots.ingredient.value } pizza. We only have ${ getOptionList( validIngredients ) }.` );
    } else if ( !slots.thickness.resolutions || !slots.thickness.resolutions.resolutionsPerAuthority || !slots.thickness.resolutions.resolutionsPerAuthority[0].values || validThicknesses.indexOf( slots.thickness.resolutions.resolutionsPerAuthority[0].values[0].value.name.toLowerCase() ) < 0 ) {
        // The thickness slot isn't valid.
        context.emit( ':elicitSlot', 'thickness', `We don't have ${ slots.thickness.value } crust. We only have ${ getOptionList( validThicknesses ) }.` );
    } else if ( confirmation === 'NONE' ) {
        // The Slots are valid, but confirmation is needed.
        context.context.succeed( {
            "response": {
                "directives": [
                    {
                        "type": "Dialog.Delegate"
                    }
                ],
                "shouldEndSession": false
            },
            "sessionAttributes": {}
        } );
    } else if ( confirmation === 'DENIED') {
        // Confirmation was denied; cancel order.
        context.emit( 'AMAZON.CancelIntent' );
    } else {
        // The Slots are valid and the Intent was confirmed.
        const ingredient = slots.ingredient.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        const thickness  = slots.thickness.resolutions.resolutionsPerAuthority[0].values[0].value.name;

        console.log( `Connecting to DB: ${ databaseUri }` );
        mongoose.connect( databaseUri );
        mongoose.Promise = global.Promise;

        let db     = mongoose.connection;
        let Schema = mongoose.Schema;

        db.on( 'error', console.error.bind( console, 'MongoDB connection error: ' ) );

        let orderSchema = new Schema( {
            orderId: {
                type: Number,
                default: 1
            },
            ingredients: {
                type: String,
                default: ''
            },
            crust: {
                type: String,
                default: ''
            },
            delivered: {
                type: Boolean,
                default: false 
            },
            cooked: {
                type: Boolean,
                default: false 
            }
        } );

        let orderModel = mongoose.model( 'PizzaOrders', orderSchema );

        orderSchema.pre('save', function (next) {
            // Only increment on new Order.
            if ( this.isNew ) {
                orderModel.count().then(quantity => {
                    // Increment count
                    this.orderId = 10 + quantity;
                    next();
                });
            } else {
                next();
            }
        });

        let pizza = new orderModel({
            orderId: 0,
            ingredients: ingredient,
            crust: thickness,
            delivered: false,
            cooked: false
        })

        console.log( `New Order: ${ JSON.stringify( [ ingredient, thickness ] ) }` );

        pizza.save((err, savedPizza) => {
            db.close(() => {
                if (err) {
                    console.log( "error" );
                    console.error( err );
                    context.emit( ':tell', 'Sorry, we couldn\'t take your order.' );
                } else {
                    console.log( "saved! " + savedPizza )
                    context.response.cardRenderer( `Wize Pizza Bot – Order #${ savedPizza.orderId }`, `Successfully ordered a ${ savedPizza.crust } ${ savedPizza.ingredients } pizza.` );
                    context.response.speak( `We've received your order. Your pizza order is number ${ savedPizza.orderId }.` );
                    context.emit( ':responseReady' );
                }
            });
        });
    }

    // Emit unhandled if nothing matched.
    context.emit( 'Unhandled' );
}

let handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', 'Welcome to Wize Pizza Bot. You can: Order a Pizza. Or, Track order.');
    },
    'AddOrder': function () {
        orderPizza( this );
    },
    'GetOrderInfo': function() {
        getOrder( this );
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Ciao!');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak("You can try: 'alexa, open wize pizza bot' or 'alexa, tell wize pizza bot to order a pizza with pepperoni and thin crust");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak('Ciao!');
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        this.response.speak("Sorry, I didn't get that. You can try: 'alexa, open wize pizza bot' or 'alexa, tell wize pizza bot to order a pizza with pepperoni and thin crust'");
        this.emit(':responseReady');
    }
};
