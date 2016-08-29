configurations = {}
mappers = {}

class QueryConfiguration
  @resetConfiguration: ->
    configurations = {}

  @getConfigurations: ->
    configurations

  @getConfiguration: (table)->
    configurations[table]

  @configure: (configuration) ->
    configurations or= {}
    configurations[configuration.table] = configuration

  @addMapper: (name, map) ->
    mappers or= {}
    mappers[name] = map

  @getMapper: (name) ->
    mappers[name]

module.exports = QueryConfiguration