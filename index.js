global.fetch = require('node-fetch');

const cryptocompare = require('cryptocompare')
const NLP_THRESHOLD = process.env.NLP_THRESHOLD || 0.6 // 60%

module.exports = function(bp) {
  bp.hear(/GET_STARTED/i, (event, next) => {
    event.reply('#faq-hello')
  })


  // Syntax "subscribe absolute 500"
  bp.hear(/subscribe .+/, (event, next) => {

    var cmd = event.text.split(" ")

    bp.db.kvs.get(`users/id/${event.user}/alerts`)
    .then(alerts => {

      var als = alerts || []
      
      als.push({
        id: als.length,
        type: cmd[1],
        threshold: cmd[2],
        user_id: cmd.user
      })

      bp.db.kvs.set(`users/id/${cmd.user}/alerts`, als)

      console.log("Registered Alert")
    })
    
    event.reply('#subscribed')
  })

  bp.hear('list', (event, next) => {

    bp.db.kvs.get(`users/id/${event.user}/alerts`)
    .then(alerts => {

      var als = alerts || []

      bp.messenger.sendText(event.user, "Here are your alerts:", {waitDelivery: true})

      for (x in als) {

        var alert = als[x]
        bp.messenger.sendText(event.user, "Alert " + alert.id + ": " + alert.type + " " + alert.threshold, {waitDelivery: true})
      }
    })
  })

  // Syntax /unsubscribe 1 
  bp.hear(/unsubscribe .+/, (event, next) => {

    var cmd = event.message.text.split(" ")

    bp.db.kvs.get(`users/id/${event.user}/alerts`)
    .then(alerts => {

      var als = alerts || []
      
      als = als.filter(object => {
        return object.id !== cmd[1]
      })

      bp.db.kvs.set(`users/id/${event.user}/alerts`, als)
    })
    
    event.reply('#unsubscribed')
  })

  bp.hear({
    'nlp.score': score => score >= NLP_THRESHOLD,
    'nlp.metadata.intentName': name => name.startsWith('convert-')
  }, async (event, next) => {

    const { nlp } = event

    // If there is missing "required" parameters
    if (nlp.actionIncomplete) {
      if (nlp.fulfillment && nlp.fulfillment.speech) {
        // If you defined a fulfillment in API.AI's UI
        return event.reply('#text', { text: nlp.fulfillment.speech })
      } else {
        return event.reply('#convert-missing-param')
      }
    }

    const { destination, source, value: quantity, e = '' } = nlp.parameters
    const exchange = e.trim()

    if (source && destination) {
      try {
        let price = await cryptocompare.getPrice(source, destination, exchange)
        
        if (!price[destination]) {
          bp.logger.debug(`[Fetch #1] Couldn't find ${source} -> ${destination} on ${exchange}`)
          price = await cryptocompare.getPrice(source, destination)
        }

        if (!price[destination]) {
          bp.logger.warn(`[Fetch #2] Couldn't find ${source} -> ${destination}`)
          return event.reply('#convert-no-result', { source, destination })
        }
        
        const finalPrice = formatMoney(Number(quantity || 1) * Number(price[destination]))
        return event.reply('#convert-success', { quantity, source, destination, price: finalPrice })
      } catch (err) {
        bp.logger.error('Error getting price: ' + err.message)
        return event.reply('#convert-error')
      }
    }
  })

  bp.hear({
    'nlp.score': score => score >= NLP_THRESHOLD,
    'nlp.metadata.intentName': name => name.startsWith('faq-')
  }, (event, next) => {
    event.reply('#' + event.nlp.metadata.intentName)
  })

  // If we couldn't handle the request in any bp.hear()
  bp.fallbackHandler = (event, next) => {
    if (/text|message/i.test(event.type)) {
      event.reply('#default-fallback')  
    }
  }

  bp.coinPriceCheck = () => {

    cryptocompare.price('BTC', 'USD')
    .then(prices => {

      var price = prices.USD

      bp.db.get()
      .then(knex => knex('users'))
      .then(users => {

          for (user in users) {

            bp.db.kvs.get(`users/id/${user.id}/alerts`)
            .then(alerts => {

              var als = alerts || []

              for (x in als) {

                var alert = als[x]
                
                if (price >= alert.threshold) {
                  bp.messenger.sendText(user.id, "BTC just hit " + price)
                }
              }

            })

          }
      })
    })
  }

  // Trigger price check immediatley to make sure it all works
  bp.coinPriceCheck()
}

function formatMoney(n) {
  return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
}

function schedule() {

}
