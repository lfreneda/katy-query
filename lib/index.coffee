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
      # console.log 'row id: ', modelId
      rootEntity = rootEntities[modelId] or {}

      for own column, value of row
        path = column.replace 'this.', ''
        path = path.replace('[]', "[#{index}]") if column.indexOf('[].') isnt -1
        _.set rootEntity, path, value
        # console.log path, '=', row[column]

      rootEntities[modelId] = rootEntity
      index++

    results = (value for key, value of rootEntities)

    for result in results
      for own property of result
        result[property] = (_.filter result[property], (item) -> item) if _.isArray(result[property])
    results

module.exports = new KatyQuery()