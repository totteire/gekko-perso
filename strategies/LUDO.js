// helpers
var log = require('../core/log.js')
const bb = require('./indicators/bb.js')

// let's create our own method
var method = {}

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
method.getCandleCenter = function (candle) {
  return candle.low + ((candle.high - candle.low) / 2)
}

method.init = function () {
  this.name = 'TRIPLE_MA_2'
  this.position = 'OUT'
  this.highest_price = 0
  this.retracementPrice = false
  this.maDiffHistory = []
  this.rsiHistory = []
  this.MAX_MA_DIFF_SIZE = 10
  this.macdDiffHistory = []
  this.bmaHistory = []
  this.candleHistory = []
  this.MAX_MACD_DIFF_SIZE = 2
  this.buy_reason = '?'

  // define the indicators we need
  this.addIndicator('small_ma', 'SMA', this.settings.SMALL_MA)
  this.addIndicator('medium_ma', 'SMA', this.settings.MEDIUM_MA)
  this.addIndicator('big_ma', 'SMA', this.settings.BIG_MA)
  this.addIndicator('rsi', 'RSI', this.settings.RSI)
  this.addIndicator('macd', 'MACD', this.settings.MACD)
  this.addIndicator('bollinger_band', 'bb', this.settings.BB)

  console.log(this.settings)
}

method.update = function (candle) {
  this.indicators.small_ma.update(candle.close)
  this.indicators.medium_ma.update(candle.close)
  this.indicators.big_ma.update(candle.close)
  this.indicators.bollinger_band.update(candle.close)

  this.maDiffHistory.push(this.indicators.small_ma.result - this.indicators.big_ma.result)
  if (this.maDiffHistory.length > this.MAX_MA_DIFF_SIZE) this.maDiffHistory.shift()

  this.bmaHistory.push(this.indicators.big_ma.result)
  if (this.bmaHistory.length > 2) this.bmaHistory.shift()

  this.macdDiffHistory.push(this.indicators.macd.diff)
  if (this.macdDiffHistory.length > this.MAX_MACD_DIFF_SIZE) this.macdDiffHistory.shift()

  this.rsiHistory.push(this.indicators.rsi.result)
  if (this.rsiHistory.length > 2) this.rsiHistory.shift()

  this.candleHistory.push(candle)
  if (this.candleHistory.length > this.settings.CANDLE_HISTORY_SIZE) this.candleHistory.shift()

}

method.log = () => {
}

method.check = function (candle) {
  const sma = this.indicators.small_ma.result
  const mma = this.indicators.medium_ma.result
  const bma = this.indicators.big_ma.result
  const rsi = this.indicators.rsi.result
  const [rsi_old, rsi_new] = this.rsiHistory
  const rsiTrend = (rsi_new > rsi_old) ? 'UP' : 'DOWN'
  const { diff: macd } = this.indicators.macd
  const { upper: bb_up } = this.indicators.bollinger_band

  if (sma > mma && mma > bma) {
    this.currentTrend = 'bull'
  } else if (sma < mma && mma < bma) {
    this.currentTrend = 'bear'
  } else {
    this.currentTrend = '?'
  }

  /*******
   * BUY *
   *******/

  if (this.position === 'OUT') {
    // BULL => BUY
    const [bma_old, bma_new] = this.bmaHistory
    const vol_avg = this.candleHistory.map(c => c.volume).reduce((a, b) => a + b) / this.settings.CANDLE_HISTORY_SIZE
    if (bma_old < bma_new && candle.close > bb_up && candle.volume > vol_avg) {
      this.buy(candle.close)
      this.highest_price = 0
    }
  }
  /*******
   * SELL *
   *******/
  else {
    // CHECK INITIAL STOP LOSS
    if (candle.close < this.buying_price * (1 - this.settings.INITIAL_STOP_LOSS)) {
      this.sell('INITIAL STOP LOSS')
    }

    // START BULL RUN
    if (candle.close > this.buying_price + (this.buying_price * this.settings.WINNING_STOP_LOSS_THRESHOLD)) {

      // on retrace à balle
      if (candle.low < this.highest_price - (this.highest_price - this.buying_price) * this.settings.WAVE_THRESHOLD_RETRACEMENT) {
        if (!this.retracementPrice) this.retracementPrice = candle.low
        if (candle.low < this.retracementPrice) {
          this.retracementPrice = candle.low
        }
      }

      // la vague remonte au dessus du max (la deuxieme vague est là)
      if (this.retracementPrice && candle.close > this.highest_price) {
        this.buying_price = this.retracementPrice
      }

      // si retracement de x% entre high et buying_price SELL
      if (candle.close < this.highest_price - (this.highest_price - this.buying_price) * this.settings.WINNING_STOP_LOSS_RETRACE) {
        this.sell(`Retracement > ${this.settings.WINNING_STOP_LOSS_RETRACE * 100}%`)
      }

      // reset high price
      if (candle.high > this.highest_price)
        this.highest_price = candle.high
    }
  }
}

module.exports = method
