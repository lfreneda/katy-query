_ = require 'lodash'
ResultTransformerIndexHandler = require './resultTransformerIndexHandler'

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
    resultTransformerIndexHandler = new ResultTransformerIndexHandler
    mappers = @_reduceMappers config

    for row, index in rows
      id = row['this.id']
      rootEntities[id] or= {}
      for own column, value of row
        propertyPath = @_getPath column, value, resultTransformerIndexHandler
        propertyValue = @_getValue column, value, mappers
        # console.log "#{propertyPath} = #{propertyValue}"
        _.set rootEntities[id], propertyPath, propertyValue

    results = (value for key, value of rootEntities)
    for result in results
      result[property] = (_.filter value, (i) -> i) for own property, value of result when _.isArray value

    if config and config.mapper and mappers[config.mapper]
      rootMapper = mappers[config.mapper]
      results = (rootMapper(result) for result in results)

    results

  @_getPath: (column, value, resultTransformerIndexHandler) ->

    path = column
    resultTransformerIndexHandler.keep column, value

    if column.indexOf '[]' isnt -1
      result = resultTransformerIndexHandler.splitColumns column
      if result.items and result.items.length > 0
        result.items.forEach (item) ->
          idValue = resultTransformerIndexHandler.getLastedValue item.idPath
          # console.log 'idValue', idValue
          index = resultTransformerIndexHandler.getBy item.idPath, idValue
          # console.log 'index', index
          replacePathWithValue = item.replacePath.replace '[]', "[#{index}]"
          # console.log 'replacePathWithValue', replacePathWithValue
          # console.log 'item.replacePath', item.replacePath
          path = path.replace item.replacePath, replacePathWithValue
          # console.log 'path', path

    path = path.replace 'this.', ''
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