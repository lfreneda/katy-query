QueryConfiguration = require './queryConfiguration'
searchQuery = require 'search-query-parser'

class QuerySearchParser
  @parse: (table, syntaxSearch) ->
    searchConfig = QueryConfiguration.getConfiguration table
    parseResult = searchQuery.parse syntaxSearch, @_toOptions(searchConfig)
    delete parseResult.text # not matched text'd
    parseResult

  @_toOptions: (searchConfig) ->
    options = { keywords: (key for own key, value of searchConfig.search) }
    options

module.exports = QuerySearchParser