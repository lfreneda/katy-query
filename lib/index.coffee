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

    rootEntities = {}

    for row, index in rows
      id = row['this.id']
      rootEntities[id] or= {}
      _.set rootEntities[id], @_getPath(column, index), value for own column, value of row

    results = (value for key, value of rootEntities)
    for result in results
      result[property] = (_.filter value, (i) -> i) for own property, value of result when _.isArray value
    results

  _getPath: (column, index) ->
    path = column.replace 'this.', ''
    path = path.replace '[]', "[#{index}]" if column.indexOf '[].' isnt -1
    path

module.exports = new KatyQuery()