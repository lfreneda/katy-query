searchQuery = require 'search-query-parser'
_    = require 'lodash'

class QuerySearchParser
  @parse: (syntaxSearch, config) ->
    parseResult = searchQuery.parse syntaxSearch, @_toOptions(config)
    delete parseResult.text
    for own key, value of parseResult
      if _.isArray value
        for own newKey, newValue of value
          parseResult[key][newKey] = @_replace(newValue)
      else
        parseResult[key] = @_replace(value)

      _.remove parseResult[key], _.isEmpty
      delete parseResult[key] if parseResult[key].length is 0

    parseResult

  @_toOptions: (config) ->
    options = { keywords: (key for own key, value of config.search) }
    options

  @_replace: (value) ->
    value.replace /\*/g,'%' if _.isString value

  @validate: (whereObject, config) ->
    errors = []
    for key of whereObject
      if config.search and config.search[key] and config.search[key].pattern
        if not whereObject[key].match config.search[key].pattern
          errors.push {
            property: key
            message: "must match #{config.search[key].pattern}"
          }
      if config.search and config.search[key] and config.search[key].orWhere
        if not _.isArray config.search[key].orWhere
          errors.push {
            property: key
            message: "property orWhere must be an array"
          }
        else
          for value in config.search[key].orWhere
            if not (value.table and value.column)
              errors.push {
                property: value
                message: "invalid orWhere configuration, must have table and column"
              }

    return {
      isValid: _.isEmpty(errors)
      errors: errors
    }

module.exports = QuerySearchParser