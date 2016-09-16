searchQuery = require 'search-query-parser'
_    = require 'lodash'

class QuerySearchParser
  @parse: (syntaxSearch, config) ->
    parseResult = searchQuery.parse syntaxSearch, @_toOptions(config)
    delete parseResult.text 
    for own key, value of parseResult
      parseResult[key] = value.replace '*','%' if _.isString value
    parseResult

  @_toOptions: (config) ->
    options = { keywords: (key for own key, value of config.search) }
    options

module.exports = QuerySearchParser