const fs = require('fs')
const toml = require('toml')
const FiboLudo = require('./utils/fiboLudo')
const notif = require('./utils/notification')

const method = {}

method.init = function () {
  this.name = 'TILU'
  this.position = 'OUT'
  this.maDiffHistory = []
  this.maHistory = []
  this.rsiHistory = []
  this.macdDiffHistory = []
  this.buying_price = false
  this.MAX_MA_DIFF_SIZE = 10
  this.MAX_MACD_DIFF_SIZE = 2
  this.fiboLudo = FiboLudo

  this.addIndicator('small_ma', 'SMA', this.settings.SMALL_MA)
  this.addIndicator('medium_ma', 'SMA', this.settings.MEDIUM_MA)
  this.addIndicator('big_ma', 'SMA', this.settings.BIG_MA)
  this.addIndicator('rsi', 'RSI', this.settings.RSI);
  this.addIndicator('macd', 'MACD', this.settings.MACD);

  console.log(this.settings)
}

method.sell = function (log) {
  this.advice('short')
  this.position = 'OUT'
  console.log('SELLING:', log)
}
method.buy = function (price) {
  this.advice('long')
  this.position = 'IN'
  this.buying_price = price
}
method.setTrend = function ({ sma, mma, bma }) {
  if (sma > mma && mma > bma) {
    this.currentTrend = 'bull'
  } else if (sma < mma && mma < bma) {
    this.currentTrend = 'bear'
  } else {
    this.currentTrend = '?'
  }
}
method.setLines = function() {
  try {
    const Lines = toml.parse(fs.readFileSync('../inputs/GRTETH.toml'))
    console.log('read lines: ', lines)
  } catch(err) {
    console.error(err)
  }

}

method.update = function (candle) {
  this.indicators.small_ma.update(candle.close)
  this.indicators.medium_ma.update(candle.close)
  this.indicators.big_ma.update(candle.close)

  this.maDiffHistory.push(this.indicators.small_ma.result - this.indicators.big_ma.result)
  if (this.maDiffHistory.length > this.MAX_MA_DIFF_SIZE) this.maDiffHistory.shift()

  this.maHistory.push({ sma: this.indicators.small_ma.result, mma: this.indicators.medium_ma.result, bma: this.indicators.big_ma.result })
  if (this.maHistory.length > 2) this.maHistory.shift()

  this.macdDiffHistory.push(this.indicators.macd.diff)
  if (this.macdDiffHistory.length > this.MAX_MACD_DIFF_SIZE) this.macdDiffHistory.shift()

  this.rsiHistory.push(this.indicators.rsi.result)
  if (this.rsiHistory.length > 2) this.rsiHistory.shift()
}

method.check = function (candle) {
  const sma = this.indicators.small_ma.result
  const mma = this.indicators.medium_ma.result
  const bma = this.indicators.big_ma.result
  const rsi = this.indicators.rsi.result
  const [rsi_old, rsi_new] = this.rsiHistory
  const rsiTrend = (rsi_new > rsi_old) ? 'UP' : 'DOWN'
  const { diff: macd } = this.indicators.macd

  // this.setTrend({ sma, mma, bma })
  // this.setLines()

  notif.sendNotification({ title: 'GRT/ETH', message: `candle close: ${candle.close}`})

  if (this.position === 'OUT') {
    /*******
     * BUY *
     *******/

    // const [ma_old, ma_new] = this.maHistory
    // if (this.currentTrend === 'bull' && macd > 0 && rsiTrend === 'UP' && ma_old.bma < ma_new.bma) {
    //   this.buy(candle.close)
    //   this.fiboLudo.start({ buyingCandle: candle })
    // }

  }

  else {
    /********
     * SELL *
     *******/

    // // CHECK INITIAL STOP LOSS
    // if (candle.close < this.buying_price * (1 - this.settings.INITIAL_STOP_LOSS)) {
    //   return this.sell(`Trade margin = ${((candle.close - this.buying_price) / candle.close * 100).toFixed(2)}% STOP LOSS`)
    // }
    // // CHECK FIBOLUDO
    // this.fiboLudo.check({
    //   candle,
    //   settings: this.settings,
    //   onSell: () => this.sell(`Trade margin = ${((candle.close - this.buying_price) / candle.close * 100).toFixed(2)}%`)
    // })

  }
}

module.exports = method
