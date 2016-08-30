_ = require 'lodash'
QueryConfiguration = require './queryConfiguration'

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

    rootEntities = {}
    mappers = @_reduceMappers config

    for row, index in rows
      id = row['this.id']
      rootEntities[id] or= {}
      for own column, value of row
        propertyPath = @_getPath column, index
        propertyValue = @_getValue column, value, mappers
        _.set rootEntities[id], propertyPath, propertyValue

    results = (value for key, value of rootEntities)
    for result in results
      result[property] = (_.filter value, (i) -> i) for own property, value of result when _.isArray value

    if config and config.mapper and mappers[config.mapper]
      rootMapper = mappers[config.mapper]
      results = (rootMapper(result) for result in results)

    results

  @_getPath: (column, index) ->
    path = column.replace 'this.', ''
    path = path.replace '[]', "[#{index}]" if column.indexOf '[].' isnt -1
    path

  @_getValue: (alias, value, mappers) ->
    return value if not mappers
    return value if not mappers[alias]
    return mappers[alias](value)

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