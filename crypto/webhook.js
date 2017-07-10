const cryptocompare = require('./cryptocompare')
const webhook = {}

webhook.converter = (req, res) => {
    console.log("Webhook Triggered for conversion")
    try {
        let speech = '';

        if (req.body) {
            let requestBody = req.body;

            if (requestBody.result) {
                speech = '';

                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }

                if (requestBody.result.action) {
                    speech += 'action: ' + requestBody.result.action + ' ';
                }

                let parameters = requestBody.result.parameters;
                if (parameters) {
                    let exchange = parameters['e'].toString().trim()
                    let quantity = parameters['value']
                    let source = parameters['source']
                    let destination = parameters['destination']
                    if (source && destination) {
                        let elements = {};
                        elements.response = {};
                        cryptocompare.getPrice(source, destination, exchange)
                            .then(price => {
                                if (price[destination]) {
                                    let finalPrice = quantity * price[destination]
                                    speech += `${quantity} ${source} = ${finalPrice} ${destination}`
                                    if (exchange) {
                                        speech += ` on ${exchange}`
                                    }
                                    console.log('Final price 1st', speech)
                                    return {
                                        speech: speech,
                                        done: true
                                    };
                                }
                                else {
                                    return cryptocompare.getPrice(source, destination)
                                }

                            })
                            .catch(error => {
                                console.error('Converter webhook failed', error)
                                speech = 'My wires blew up'
                                return {
                                    speech: speech,
                                    done: false
                                }
                            })
                            .then((result) => {
                                if (result.done) {
                                    speech = result.speech
                                }
                                else if (result[destination]) {
                                    let finalPrice = quantity * result[destination]
                                    speech += `${quantity} ${source} = ${finalPrice} ${destination}`
                                    console.log('Final price 2nd', speech)
                                }
                                else {
                                    speech = `I couldn't find the conversion for ${source} ${destination}`
                                    console.log('Final price 2nd failed', speech)
                                }
                                elements.response.speech = speech;
                                elements.response.displayText = speech;
                                elements.response.data = {};
                                elements.response.contextOut = [];
                                elements.response.source = "apiaiwebhook";
                                let response = elements.response;
                                return res.json(response);
                            })
                    }
                }
            }
        }
    } catch (err) {
        console.error("Can't process request", err);
        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
}

module.exports = webhook