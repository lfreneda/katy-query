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
          
    return {
      isValid: _.isEmpty(errors)
      errors: errors
    }

module.exports = QuerySearchParser