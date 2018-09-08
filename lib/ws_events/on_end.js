'use strict'

const _isFunction = require('lodash/isFunction')
const { closeOpenPositions } = require('bfx-hf-strategy')

const debug = require('../util/debug')
const debugResults = require('../util/debug_results')
const sendResults = require('../ws/send_results')

/**
 * Called for incoming backtest end messages
 *
 * (ws client must exist, as this func is triggered by a ws event)
 *
 * @param {Object} btState
 * @param {*[]} msg
 * @return {Object} nextBtState
 */
module.exports = async (btState = {}, msg = []) => {
  const { strategy = {}, ws } = btState
  const { onEnd } = strategy
  let strategyState = strategy

  if (_isFunction(onEnd)) {
    strategyState = await onEnd(strategyState)
  }

  strategyState = await closeOpenPositions(strategyState)

  const { trades = [] } = strategyState

  debug(
    'backtest ended (%d trades, %d candles)',
    trades.length, btState.nCandles
  )

  debugResults({
    ...btState,
    strategy: strategyState
  })

  if (ws) {
    sendResults({
      ...btState,
      strategy: strategyState
    })

    ws.close()
  }

  return {
    ...btState,

    isWSClosing: true,
    execPeriod: null,
    strategy: strategyState
  }
}