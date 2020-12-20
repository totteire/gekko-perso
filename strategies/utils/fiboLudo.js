const log = (candle, log) => console.log(`${candle.start.format()} # ${log}`)

const FiboLudo = {

  start: function ({ buyingCandle }) {
    log(buyingCandle, 'Start FiboLudo')
    this.buyingPrice = buyingCandle.close
    this.waveBottomPrice = buyingCandle.open
    this.isThresholdOver = false
    this.highestPrice = buyingCandle.close
    this.retracementPrice = false
  },
  check: function ({ candle, settings, onSell }) {
    // Start threshold
    if (!this.isThresholdOver) {
      if (candle.close > this.buyingPrice + (this.buyingPrice * settings.WINNING_STOP_LOSS_THRESHOLD)) {
        log(candle, 'Threshold is over')
        this.isThresholdOver = true
      } else {
        return false
      }
    }

    // on retrace à balle
    const diffToHighestPrice = (this.highestPrice - this.waveBottomPrice)
    if (candle.close < this.highestPrice - (diffToHighestPrice * settings.WAVE_THRESHOLD_RETRACEMENT)) {
      if (!this.retracementPrice) this.retracementPrice = candle.close
      if (candle.close < this.retracementPrice) {
        this.retracementPrice = candle.close
        log(candle, `on retrace de ${((this.highestPrice - this.retracementPrice) / diffToHighestPrice * 100).toFixed(2)}%`)
      }
    }

    // la vague remonte au dessus du max (la deuxieme vague est là)
    if (this.retracementPrice && candle.close > this.highestPrice) {
      this.waveBottomPrice = this.retracementPrice
      this.retracementPrice = false
      log(candle, `new wave bottom at ${this.waveBottomPrice}`)
    }

    // si retracement de x% entre high et buying_price SELL
    if (candle.close < this.highestPrice - (this.highestPrice - this.waveBottomPrice) * settings.WINNING_STOP_LOSS_RETRACE) {
      log(candle, `SELL: on a retracé de ${((this.highestPrice - candle.close) / (this.highestPrice - this.waveBottomPrice) * 100).toFixed(2)}%`)
      onSell()
      this.retracementPrice = false
    }

    
    // reset high price
    if (candle.high > this.highestPrice) {
      this.highestPrice = candle.high
    }
    
  },
}

module.exports = FiboLudo