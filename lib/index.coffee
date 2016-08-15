_ = require 'lodash'

class KatyQuery

  toObjects : (recordSetResult) ->
    type = Object::toString.call recordSetResult
    if type is '[object Array]'
      return @_distinctRootEntity(recordSetResult)
    else if type is '[object Object]'
      return @_distinctRootEntity([recordSetResult])
    else
      return null

  toObject : (recordSetResult) -> @toObjects(recordSetResult)[0]

  _distinctRootEntity: (rows) ->

    index = 0
    results = {}

    for row in rows
      rootEntity = results[row['this.id']] or {}

      console.log 'row id: ', row['this.id']

      for own column of row
        path = column.replace 'this.', ''
        path = path.replace('[]', '[' + index + ']') if column.indexOf('[].') isnt -1
        _.set rootEntity, path, row[column]

        console.log path, '=', row[column]

      results[row['this.id']] = rootEntity

      index++

    results = (value for key, value of results)
    for result in results
      for own property of result
        type = Object::toString.call result[property]
        if type is '[object Array]'
          result[property] = _.filter result[property], (item) -> item

    results

module.exports = new KatyQuery()