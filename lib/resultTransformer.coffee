_ = require 'lodash'
rowsMapper = require('join-js').default

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
    mappers = @_reduceMappers config
    rows = @_applyMappers rows, mappers

    collapse = config.collapse || {}
    results = rowsMapper.map rows, collapse.resultMaps, collapse.mapId, collapse.columnPrefix

    if config and config.mapper and mappers[config.mapper]
      rootMapper = mappers[config.mapper]
      results = (rootMapper(result) for result in results)

    results

  @_applyMappers: (rows, mappers) ->
    if mappers
      for row in rows
        for alias, value of row
          row[alias] = mappers[alias](value) if mappers[alias]
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