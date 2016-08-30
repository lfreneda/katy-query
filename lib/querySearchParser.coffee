searchQuery = require 'search-query-parser'

class QuerySearchParser
  @parse: (syntaxSearch, config) ->
    parseResult = searchQuery.parse syntaxSearch, @_toOptions(config)
    delete parseResult.text # not matched text'd
    parseResult

  @_toOptions: (config) ->
    options = { keywords: (key for own key, value of config.search) }
    options

module.exports = QuerySearchParser