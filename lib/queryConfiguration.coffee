configurations = null

class QueryConfiguration
  @resetConfiguration: ->
    configurations = null

  @getConfigurations: ->
    configurations

  @getConfiguration: (table)->
    configurations[table]

  @configure: (configuration) ->
    configurations or= {}
    configurations[configuration.table] = configuration

module.exports = QueryConfiguration