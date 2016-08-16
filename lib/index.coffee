_ = require 'lodash'

class KatyQuery

  toModel: (recordSetResult) ->
    results = @toModels recordSetResult
    return null if not results
    return results[0]

  toModels: (recordSetResult) ->
    return @_distinctRootEntity recordSetResult if _.isArray recordSetResult
    return @_distinctRootEntity [ recordSetResult ] if _.isObject recordSetResult
    return null

  _distinctRootEntity: (rows) ->

    index = 0
    rootEntities = {}

    for row in rows

      modelId = row['this.id']
      rootEntity = rootEntities[modelId] or {}

      for own column, value of row
        path = column.replace 'this.', ''
        path = path.replace '[]', "[#{index}]" if column.indexOf '[].' isnt -1
        _.set rootEntity, path, value

      rootEntities[modelId] = rootEntity
      index++

    results = (value for key, value of rootEntities)
    for result in results
      value = (_.filter value, (i) -> i) for own property, value of result when _.isArray value
    results

module.exports = new KatyQuery()