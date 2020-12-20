// helpers
var log = require('../core/log.js')

// let's create our own method
var method = {}

// prepare everything our method needs
method.init = function () {
  this.name = 'TRIPLE_MA'
  // No asset bought so far
  this.position = 'OUT'

  this.highest_price = 0
  console.log(this.settings)
  // define the indicators we need
  this.addIndicator('small_ma', 'SMA', this.settings.SMALL_MA)
  this.addIndicator('medium_ma', 'SMA', this.settings.MEDIUM_MA)
  this.addIndicator('big_ma', 'SMA', this.settings.BIG_MA)
}

method.update = function (candle) {
  this.indicators.small_ma.update(candle.close)
  this.indicators.medium_ma.update(candle.close)
  this.indicators.big_ma.update(candle.close)
  if (candle.close > this.highest_price)
    this.highest_price = candle.close
}

method.log = () => {
}

method.check = function (candle) {
  const sma = this.indicators.small_ma.result
  const mma = this.indicators.medium_ma.result
  const bma = this.indicators.big_ma.result

  let isBullNow = sma > mma && bma > mma
  if (!this.currentTrend) this.currentTrend = (isBullNow) ? 'bull' : 'bear'

  if (this.position === 'IN') {
    // CHECK INITIAL STOP LOSS
    if (candle.close < this.buying_price * (1 - this.settings.INITIAL_STOP_LOSS)) {
      this.advice('short')
      this.position = 'OUT'
    }

    // CHECK RETRACE STOP LOSS
    const didIMakeEnoughMoney = candle.close > this.buying_price * (1 + this.settings.WINNING_STOP_LOSS_THRESHOLD)
    if (didIMakeEnoughMoney) {
      const max_retrace_price = this.buying_price + (this.highest_price - this.buying_price) * (1 - this.settings.WINNING_STOP_LOSS_RETRACE)
      // if down > STOP LOSS RETRACE all time high GET OUT!!!
      if (candle.close < max_retrace_price) {
        this.advice('short')
        this.position = 'OUT'
      }
    }
  }

  if (this.currentTrend === 'bull' && !isBullNow) {

    this.currentTrend = 'bear'

  } else if (this.position === 'OUT' && this.currentTrend === 'bear' && isBullNow) {

    this.currentTrend = 'bull'
    this.highest_price = candle.close
    this.advice('long')
    this.position = 'IN'
    this.buying_price = candle.close

  }
}

module.exports = method
