_ = require 'lodash'

class KatyQuery

  toObjects: (recordSetResult) ->
    return @_distinctRootEntity recordSetResult if _.isArray(recordSetResult)
    return @_distinctRootEntity [recordSetResult] if _.isObject(recordSetResult)
    return null

  toObject: (recordSetResult) -> @toObjects(recordSetResult)[0]

  _distinctRootEntity: (rows) ->

    index = 0
    rootEntities = {}

    for row in rows
      
      modelId = row['this.id'];
      rootEntity = rootEntities[modelId] or {}

      for own column, value of row
        path = column.replace 'this.', ''
        path = path.replace('[]', "[#{index}]") if column.indexOf('[].') isnt -1
        _.set rootEntity, path, value

      rootEntities[modelId] = rootEntity
      index++

    results = (value for key, value of rootEntities)

    for result in results
      for own property, value of result
        value = (_.filter result[property], (item) -> item) if _.isArray(value)
    results

module.exports = new KatyQuery()