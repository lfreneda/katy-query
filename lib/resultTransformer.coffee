_ = require 'lodash'
collapse = require './util/collapse'

class ResultTransformer

  @toModel: (recordSetResult, config) ->
    results = @toModels recordSetResult, config
    return null if not results
    return results[0]

  @toModels: (recordSetResult, config) ->
    return @_distinctRootEntity recordSetResult, config if _.isArray recordSetResult
    return @_distinctRootEntity [ recordSetResult ], config if _.isObject recordSetResult
    return null

  @_distinctRootEntity: (rows, config) ->
    rows = @_applyMappers rows, config
    config = config || {}
    config.collapse = config.collapse || {}
    rows = collapse 'this', 'id', (config.collapse.options || {}), rows
    rows

  @_applyMappers: (rows, config) ->
    mappers = @_reduceMappers config
    if mappers
      for row in rows
        for alias, value of row
          if mappers[alias] then row[alias] = mappers[alias](value) else row[alias] = value
    rows

  @_reduceMappers: (config) ->
    return null if not config
    mappers = {}
    mappers[config.mapper] = config.mappers[config.mapper] if config.mapper
    mappers[column.alias] = config.mappers[column.mapper] for column in config.columns when column.mapper
    if config.relations
      for own relation, relationConfig of config.relations
        for column in relationConfig.columns when column.mapper
          mappers[column.alias] = config.mappers[column.mapper]
    mappers

module.exports = ResultTransformer