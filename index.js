const cryptocompare = require('./cryptocompare')

const NLP_THRESHOLD = process.env.NLP_THRESHOLD || 0.6 // 60%

module.exports = function(bp) {

  bp.hear(/GET_STARTED/i, (event, next) => {
    event.reply('#faq-hello')
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
}

function formatMoney(n) {
  return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
}
