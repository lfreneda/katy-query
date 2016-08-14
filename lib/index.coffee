_ = require('lodash');

class KatyQuery
  
  toObjects: (recordSetResult) ->
    []
  
  toObject : (recordSetResult) ->
    type = Object::toString.call recordSetResult

    if type is '[object Array]'
      return @_createObject recordSetResult[0]
    else if type is '[object Object]'
      return @_createObject recordSetResult
    else
      return null

   _createObject: (row) ->
     objectResult = {}
     for own column of row
       _.set objectResult, (column.replace 'this.', ''), row[column]
     objectResult

module.exports = new KatyQuery()