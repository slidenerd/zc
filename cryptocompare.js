
const cryptocompare = {}
const exchanges = {
    bit2c: "Bit2C",
    bitbay: "BitBay",
    bitfinex: "Bitfinex",
    bitflyer: "bitFlyer",
    bitflyerfx: "bitFlyerFX",
    bitmarket: "BitMarket",
    bitso: "Bitso",
    bitsquare: "BitSquare",
    bitstamp: "Bitstamp",
    bittrex: "Bittrex",
    bluetrade: "Bleutrade",
    btc38: "BTC38",
    btcc: "BTCC",
    btce: "BTCE",
    btcmarkets: "BTCMarkets",
    bter: "BTER",
    btxcindia: "BTCXIndia",
    ccedk: "CCEDK",
    cexio: "Cexio",
    coinbase: "Coinbase",
    coincheck: "CoinCheck",
    coinfloor: "Coinfloor",
    coinone: "Coinone",
    coinse: "Coinse",
    coinsetter: "Coinsetter",
    cryptopia: "Cryptopia",
    cryptsy: "Cryptsy",
    etherdelta: "EtherDelta",
    ethexindia: "EthexIndia",
    gatecoin: "Gatecoin",
    gemini: "Gemini",
    hitbtc: "HitBTC",
    huobi: "Huobi",
    itBit: "itBit",
    korbit: "Korbit",
    kraken: "Kraken",
    lakebtc: "LakeBTC",
    liqui: "Liqui",
    livecoin: "LiveCoin",
    localbitcoins: "LocalBitcoins",
    luno: "Luno",
    mercadobitcoin: "MercadoBitcoin",
    monetago: "MonetaGo",
    okcoin: "OKCoin",
    paymium: "Paymium",
    poloniex: "Poloniex",
    quadrigacx: "QuadrigaCX",
    quoine: "Quoine",
    therocktrading: "TheRockTrading",
    tidex: "Tidex",
    unocoin: "Unocoin",
    vaultoro: "Vaultoro",
    yacuna: "Yacuna",
    yobit: "Yobit",
    yunbi: "Yunbi"
}

const request = require('request')

function fireRequest(options, resolve, reject) {
    request(options, (error, response, body) => {
        if (error) {
            reject(error)
        }
        else {
            resolve(body)
        }
    })
}

/**
 * Get the list of all coins from cryptocompare via API
 */
cryptocompare.getAllCoins = () => {
    let options = {
        url: 'https://www.cryptocompare.com/api/data/coinlist/',
        json: true
    }
    return new Promise((resolve, reject) => fireRequest(options, resolve, reject))
}

/**
 * Get the latest price for a list of one or more currencies. Really fast, 20-60 ms. Cached each 10 seconds.
 * Parameter	Type	Required	Default 	Info
 * fsym	string	true	 	From Symbol
 * tsyms	string	true	 	To Symbols, include multiple symbols
 * e	string	false	CCAGG	Name of exchange. Default: CCCAGG
 * extraParams	string	false	NotAvailable	Name of your application
 * sign	bool	false	false	If set to true, the server will sign the requests.
 * tryConversion	bool	false	true	If set to false, it will try to get values without using any conversion at all
 */

cryptocompare.getPrice = (fsym, tsyms, e, extraParams, sign, tryConversion) => {
    let params = {
        fsym: fsym,
        tsyms: tsyms,
        extraParams: extraParams,
        sign: sign,
        tryConversion: tryConversion
    }
    //If the user has specified the exchange
    if (e && e.toString().trim()) {
        params.e = e
    }
    let options = {
        url: 'https://min-api.cryptocompare.com/data/price',
        qs: params,
        json: true
    };
    return new Promise((resolve, reject) => fireRequest(options, resolve, reject))
}

/**
 * Get a matrix of currency prices.
 * Parameter	Type	Required	Default 	Info
 * fsyms	string	true	 	From Symbols, include multiple symbols
 * tsyms	string	true	 	To Symbols, include multiple symbols
 * e	string	false	CCAGG	Name of exchange. Default: CCCAGG
 * extraParams	string	false	NotAvailable	Name of your application
 * sign	bool	false	false	If set to true, the server will sign the requests.
 * tryConversion	bool	false	true	If set to false, it will try to get values without using any conversion at all
 */

cryptocompare.getPriceMulti = (fsyms, tsyms, e, extraParams, sign, tryConversion) => {
    let options = {
        url: 'https://min-api.cryptocompare.com/data/pricemulti',
        qs: {
            fsyms: fsyms,
            tsyms: tsyms,
            e: e,
            extraParams: extraParams,
            sign: sign,
            tryConversion: tryConversion
        },
        json: true
    };
    return new Promise((resolve, reject) => fireRequest(options, resolve, reject))
}

/**
 * Get all the current trading info (price, vol, open, high, low etc) of any list of cryptocurrencies in any
 * other currency that you need.If the crypto does not trade directly into the toSymbol requested, BTC will
 * be used for conversion. This API also returns Display values for all the fields.If the opposite pair
 * trades we invert it (eg.: BTC-XMR).
 */

cryptocompare.getPriceMultiFull = (fsyms, tsyms, e, extraParams, sign, tryConversion) => {
    let options = {
        url: 'https://min-api.cryptocompare.com/data/pricemultifull',
        qs: {
            fsyms: fsyms,
            tsyms: tsyms,
            e: e,
            extraParams: extraParams,
            sign: sign,
            tryConversion: tryConversion
        },
        json: true
    };
    return new Promise((resolve, reject) => fireRequest(options, resolve, reject))
}

module.exports = cryptocompare

function testGetAllCoins() {
    cryptocompare.getAllCoins()
        .then(items => {
            let coins = []
            for (let item in items['Data']) {
                coins.push({
                    CoinName: items['Data'][item]['CoinName'],
                    Name: items['Data'][item]['Name'],
                    SortOrder: items['Data'][item]['SortOrder']
                })
            }
            coins.sort((a, b) => {
                let sortOrder1 = parseInt(a.SortOrder)
                let sortOrder2 = parseInt(b.SortOrder)
                if (sortOrder1 < sortOrder2) {
                    return -1
                }
                else if (sortOrder1 > sortOrder2) {
                    return 1
                }
                return 0
            })
            console.log(JSON.stringify(coins))
        })
        .catch(error => {
            console.log(error)
        })
}

function testGetPrice() {
    /**
     * 'ETH', 'BTC,USD,INR'
     * 'ETH','BTC,USD,INR',null,'Bitfinex'
     */
    let source = 'BTC'
    let destination = 'INR'
    cryptocompare.getPrice(source, destination, ' ')
        .then(items => {
            if (items[destination]) {
                console.log('First time', items, `1 ${source} = ${items[destination]} ${destination}`)
                return null
            }
            else {
                return cryptocompare.getPrice(source, destination)
            }
        })
        .catch(error => {
            console.log(error)
        })
        .then(price => {
            if (price) {
                console.log('Second time', price)
            }
        })
}

function testGetPriceMulti() {
    /**
     * 'ETH,BTC,XRP,SC,DOGE', 'USD,INR'
     */
    cryptocompare.getPriceMulti('ETH,BTC,XRP,SC,DOGE', 'USD,INR')
        .then(items => {
            console.log(items)
        })
        .catch(error => {
            console.log(error)
        })
}

function testGetPriceMultiFull() {
    /**
     * 'ETH,BTC,XRP,SC,DOGE', 'USD,INR'
     */
    cryptocompare.getPriceMultiFull('ETH', 'INR')
        .then(items => {
            console.log(JSON.stringify(items))
        })
        .catch(error => {
            console.log(error)
        })
}