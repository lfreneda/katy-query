_ = require 'lodash'
QueryConfiguration = require './queryConfiguration'

class ResultTransformer

  @toModel: (table, recordSetResult) ->
    results = @toModels table, recordSetResult
    return null if not results
    return results[0]

  @toModels: (table, recordSetResult) ->
    return @_distinctRootEntity table, recordSetResult if _.isArray recordSetResult
    return @_distinctRootEntity table, [ recordSetResult ] if _.isObject recordSetResult
    return null

  @_distinctRootEntity: (table, rows) ->
    mappers = @_createMappers table
    rootEntities = {}
    for row, index in rows
      id = row['this.id']
      rootEntities[id] or= {}
      _.set rootEntities[id], @_getPath(column, index), @_getValue(mappers, column, value) for own column, value of row

    results = (value for key, value of rootEntities)
    for result in results
      result[property] = (_.filter value, (i) -> i) for own property, value of result when _.isArray value
    results

  @_getPath: (column, index) ->
    path = column.replace 'this.', ''
    path = path.replace '[]', "[#{index}]" if column.indexOf '[].' isnt -1
    path

  @_getValue: (mappers, column, value) ->
    return value if not mappers
    return value if not mappers[column]
    return mappers[column](value)

  @_createMappers: (table) ->
    configuration = QueryConfiguration.getConfiguration table
    return null if not configuration
    mappers = {}
    for column in configuration.columns when column.mapper
      mapper = QueryConfiguration.getMapper column.mapper
      mappers[column.alias] = mapper if mapper
    if configuration.relations
      for relation in configuration.relations
        for column in relation.columns when column.mapper
          mapper = QueryConfiguration.getMapper column.mapper
          mappers[column.alias] = mapper if mapper
    mappers

module.exports = ResultTransformer