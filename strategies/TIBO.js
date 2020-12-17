// helpers
var log = require('../core/log.js')

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
  this.maDiffHistory = []
  this.rsiHistory = []
  this.MAX_MA_DIFF_SIZE = 10
  this.macdDiffHistory = []
  this.MAX_MACD_DIFF_SIZE = 2
  this.buy_reason = '?'

  // define the indicators we need
  this.addIndicator('small_ma', 'SMA', this.settings.SMALL_MA)
  this.addIndicator('medium_ma', 'SMA', this.settings.MEDIUM_MA)
  this.addIndicator('big_ma', 'SMA', this.settings.BIG_MA)
  this.addIndicator('rsi', 'RSI', this.settings.RSI);
  this.addIndicator('macd', 'MACD', this.settings.MACD);

  console.log(this.settings)
}

method.update = function (candle) {
  this.indicators.small_ma.update(candle.close)
  this.indicators.medium_ma.update(candle.close)
  this.indicators.big_ma.update(candle.close)

  this.maDiffHistory.push(this.indicators.small_ma.result - this.indicators.big_ma.result)
  if (this.maDiffHistory.length > this.MAX_MA_DIFF_SIZE) this.maDiffHistory.shift()

  this.macdDiffHistory.push(this.indicators.macd.diff)
  if (this.macdDiffHistory.length > this.MAX_MACD_DIFF_SIZE) this.macdDiffHistory.shift()

  this.rsiHistory.push(this.indicators.rsi.result)
  if (this.rsiHistory.length > 2) this.rsiHistory.shift()

  if (candle.close > this.highest_price)
    this.highest_price = candle.close
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
    // if (this.currentTrend === 'bull' && macd >= 0) {
    //   this.buy(candle.close)
    // }

    // RSI SIGNAL
    // if (rsi < 30) {
    //   this.buy(candle.close)
    //   this.buy_reason = 'RSI_SIGNAL'
    // }
    // BULL RUN
    console.log(this.currentTrend, macd, rsiTrend)
    if (this.currentTrend === 'bull' && macd > 0 && rsiTrend === 'UP') {
      this.buy(candle.close)
      this.buy_reason = 'BULL_RUN'
    }

    // if (this.currentTrend === 'bear') {
    //   if (candle.open < sma && candle.close < sma) {
    //     this.buy(candle.close)
    //   }
    // }

    // const delta_ma = Math.abs(this.maDiffHistory.reduce((a, b) => a + b) / this.maDiffHistory.length)
    // // @TODO think about macD crossover
    // if (
    //   this.currentTrend === 'bear' &&
    //   this.getCandleCenter(candle) > mma &&
    //   delta_ma > 0.005
    // ) {
    //   console.log(`BUYING: ${candle.start._d} : delta=${delta_ma.toFixed(4)}`)
    //   this.buy(candle.close)
    // }
  }
  /*******
   * SELL *
   *******/
  else {
    // CHECK INITIAL STOP LOSS
    if (candle.close < this.buying_price * (1 - this.settings.INITIAL_STOP_LOSS)) {
      this.sell('INITIAL STOP LOSS')
    }

    if (this.buy_reason === 'BULL_RUN') {
      if (sma < mma) {
          this.sell(`MA${this.settings.SMALL_MA} crossover`)
      }
    }

    // if (candle.close > this.buying_price + (this.buying_price * 0.01)) {
    //   this.sell('made 1%')
    // }

    // if (this.buy_reason === 'RSI_SIGNAL') {
    //   const [rsi_old, rsi_new] = this.rsiHistory
    //   if (rsi_new < rsi_old) {
    //     this.sell('RSI going back down')
    //   }
    // }

    // const [macd_old, macd_new] = this.macdDiffHistory
    // if (macd_new > 0.00005 && macd_new < macd_old) {
    //   this.sell('macd diff going back down')
    // } else if (candle.close > this.buying_price + (this.buying_price * 0.02) && this.currentTrend !== 'bull') {
    //   this.sell('Got 2%')
    // }

    // // CHECK RETRACE STOP LOSS
    // if (candle.close > this.highest_price) this.highest_price = candle.close
    // const didIMakeEnoughMoney = candle.close > this.buying_price * (1 + this.settings.WINNING_STOP_LOSS_THRESHOLD)
    // if (didIMakeEnoughMoney) {
    //   const max_retrace_price = this.buying_price + (this.highest_price - this.buying_price) * (1 - this.settings.WINNING_STOP_LOSS_RETRACE)
    //   if (candle.close < max_retrace_price) {
    //     this.sell('TRAILING STOP LOSS')
    //   }
    // }

    // // CHECK CANDLE CROSSING MMA
    // const candleCenter = this.getCandleCenter(candle)
    // if (candleCenter < mma) {
    //   this.sell(`candle ${candleCenter} < mma ${mma}`)
    // }

  }
}

module.exports = method
