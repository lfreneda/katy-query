_ = require('lodash');

class KatyQuery
  
  toObjects: (recordSetResult) ->
    []
  
  toObject : (recordSetResult) ->
    type = Object::toString.call recordSetResult

    if type is '[object Array]'
      return @_createObject recordSetResult
    else if type is '[object Object]'
      return @_createObject [ recordSetResult ]
    else
      return null

   _createObject: (rows) ->
    rootObject = {}
    rowIndex = 0
    for row in rows
      for own column of row
        if column.indexOf('[].') isnt -1
          _.set rootObject, (column.replace 'this.', '').replace('[]', '['+rowIndex+']'), row[column]
        else
          _.set rootObject, (column.replace 'this.', ''), row[column]
      rowIndex++
    rootObject

module.exports = new KatyQuery()