_ = require 'lodash'

`if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
            var subjectString = this.toString();
            if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }`

class ResultTransformerIndexHandler

  columnsIndexes = {}

  splitColumns: (path) ->
    result = {}
    result.count = (path.match(/\[]/g) || []).length
    if result.count > 0
      result.items = []
      splitResult = path.split('[]')
      propertyPath = ''
      for part in splitResult
        propertyPath += "#{part}[]"
        result.items.push {
          replacePath: "#{part}[]"
          idPath: "#{propertyPath}.id"
        }
      result.items.pop()
    result

  keep: (path, value) ->
    if path.endsWith 'id'
      if columnsIndexes[path] isnt undefined
        if columnsIndexes[path][value] is undefined
          columnsIndexes[path][value] = columnsIndexes[path]['next']
          columnsIndexes[path]['current'] = columnsIndexes[path]['next']
          columnsIndexes[path]['lastValue'] = value
          columnsIndexes[path]['next'] = columnsIndexes[path]['next'] + 1
      else
        columnsIndexes[path] = {};
        columnsIndexes[path][value] = 0
        columnsIndexes[path]['lastValue'] = value
        columnsIndexes[path]['current'] = 0
        columnsIndexes[path]['next'] = 1

  getLastedValue: (path) ->
    if columnsIndexes[path] isnt undefined
      if columnsIndexes[path]['lastValue'] isnt undefined
        return columnsIndexes[path]['lastValue']
      else
        return null

  getCurrent: (path) ->
    if columnsIndexes[path] isnt undefined
      if columnsIndexes[path]['current'] isnt undefined
        return columnsIndexes[path]['current']
      else
        return 0

  getBy: (path, value) ->
    if columnsIndexes[path] isnt undefined
      if columnsIndexes[path][value] isnt undefined
        return columnsIndexes[path][value]
      else
        columnsIndexes[path][value] = columnsIndexes[path]['next']
        columnsIndexes[path]['next'] = columnsIndexes[path]['next'] + 1
        return columnsIndexes[path][value]
    else
      columnsIndexes[path] = {};
      columnsIndexes[path][value] = 0;
      columnsIndexes[path]['next'] = 1;
      return columnsIndexes[path][value]

module.exports = ResultTransformerIndexHandler