_    = require 'lodash'
util = require 'util'

`
if (!String.prototype.endsWith) {
String.prototype.endsWith = function(searchString, position) {
var subjectString = this.toString();
if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
position = subjectString.length;
}
position -= searchString.length;
var lastIndex = subjectString.indexOf(searchString, position);
return lastIndex !== -1 && lastIndex === position;
};
}
`
class QueryGenerator

  @toSql: (args, config) ->
    whereResult = @toWhere(args.where, config, args.options)
    relations = _.uniq(whereResult.relations.concat(args.relations || []))

    return {
      sqlCount: "#{@toSelectCount(relations, config)} #{whereResult.where}"
      sqlSelect: "#{@toSelect(relations, config)} #{whereResult.where} #{@toOptions(args.options, config)}"
      params: whereResult.params
      relations: relations
    }

  @toSelectCount: (relations = [], config) ->
    sqlText = "SELECT COUNT(distinct #{config.table}.\"id\")
                 FROM #{config.table}
                 #{@_toJoinSql(relations, config)}"
    sqlText.trim()

  @toSelect: (relations = [], config) ->
    sqlText = "SELECT #{@_toColumnSql(relations, config)}
               FROM #{config.table}
               #{@_toJoinSql(relations, config)}"
    sqlText.trim()

  @toOptions: (options, config) ->
    offset = options.offset or 0
    limit = options.limit or 25

    sort = "#{config.table}.\"id\" ASC"
    if options.sort
      direction = if options.sort.indexOf('-') is 0 then 'DESC' else 'ASC'
      options.sort = options.sort.replace('-', '')
      sort = "#{config.table}.\"#{options.sort}\" #{direction}"

    sqlText = "ORDER BY #{sort} OFFSET #{offset} LIMIT #{limit}"
    sqlText


  @toWhere: (conditions, config, options) ->
    return { where: 'WHERE 1=1', params: [], relations: [] } if _.isEmpty(conditions) and not options?.tenant

    result = { where: [], params: [], relations: [] }

    if options?.tenant
      result.params.push options.tenant.value
      result.where.push "(#{config.table}.\"#{options.tenant.column}\" = $#{result.params.length})"

    for own field, value of conditions
      if _.isArray value
        @_whereClauseAsArray field, value, result, config
      else if value is null
        @_whereNullClause field, value, result, config
      else
        @_whereOperatorClause field, value, result, config

    result.where = "WHERE #{result.where.join ' AND '}"
    result.relations = _.uniq(result.relations)
    result

  @_whereOperatorClause: (field, value, result, configuration) ->
    fieldOperator = @_getWhereOperator field
    field = field.replace fieldOperator.operator, ''
    fieldConfig = @_getFieldConfigurationOrDefault configuration, field, result
    result.params.push fieldConfig.mapper(value)
    result.where.push "#{fieldConfig.table}.\"#{fieldConfig.column}\" #{fieldOperator.operator} $#{result.params.length}"

  @_getWhereOperator: (field) ->
    operators = {
      greaterOrEqualThanOperator: { operator: '>=' }
      greaterThanOperator: { operator: '>' }
      lessOrEqualThanOperator: { operator: '<=' }
      lessThanOperator: { operator: '<' }
      iLikeOperator: { operator: '~~*' }
      equalOperator: { operator: '=' }
    }

    operatorHandler = switch
      when field.endsWith '>=' then operators.greaterOrEqualThanOperator
      when field.endsWith '>' then operators.greaterThanOperator
      when field.endsWith '<=' then operators.lessOrEqualThanOperator
      when field.endsWith '<' then operators.lessThanOperator
      when field.endsWith '~~*' then operators.iLikeOperator
      else operators.equalOperator

    operatorHandler

  @_whereClauseAsArray: (field, value, result, configuration) ->
    arrValues = []
    fieldConfig = @_getFieldConfigurationOrDefault configuration, field, result
    for arrValue in value when arrValue not in ['null', null]
      result.params.push fieldConfig.mapper(arrValue)
      arrValues.push "$#{result.params.length}"
    withNull = 'null' in value or null in value
    if withNull
      result.where.push "(#{configuration.table}.\"#{field}\" in (#{arrValues.join(', ')}) OR #{configuration.table}.\"#{field}\" is null)"
    else
      result.where.push "#{configuration.table}.\"#{field}\" in (#{arrValues.join(', ')})"

  @_whereNullClause: (field, value, result, configuration) ->
    fieldConfig = @_getFieldConfigurationOrDefault configuration, field, result
    result.where.push "#{fieldConfig.table}.\"#{fieldConfig.column}\" is null" if value is null

  @_getFieldConfigurationOrDefault: (config, field, result) -> # TODO should be tested separately

    fieldConfiguration =
      table: config.table
      column: field
      mapper: (value) -> value

    searchConfig = config.search[field]
    if searchConfig
      fieldConfiguration.column = searchConfig.column if searchConfig.column

      if searchConfig.mapper
        mapper = config.mappers[searchConfig.mapper]
        if mapper
          fieldConfiguration.mapper = mapper
        else
          console.log "### WARNING: mapper #{searchConfig.mapper} not found, it will be ignored."

      if searchConfig.relation and config.relations[searchConfig.relation]
        result.relations.push searchConfig.relation
        fieldConfiguration.table = config.relations[searchConfig.relation].table

    fieldConfiguration

  @_toColumnSql: (relations = [], configuration) ->
    columns = configuration.columns.map (column) -> "#{configuration.table}.\"#{column.name}\" \"#{column.alias}\""
    for relation in relations
      relation = configuration.relations[relation]
      if relation
        if relation.requires
          for requiredRelationName in relation.requires
            requiredRelation = configuration.relations[requiredRelationName]
            relationTable = requiredRelation.table
            relationColumns = requiredRelation.columns
            columns.push "#{relationTable}.\"#{column.name}\" \"#{column.alias}\"" for column in relationColumns
        relationTable = relation.table
        relationColumns = relation.columns
        columns.push "#{relationTable}.\"#{column.name}\" \"#{column.alias}\"" for column in relationColumns

    console.log columns
    columns.join ', '

  @_toJoinSql:(relations = [], configuration) ->
    return '' if relations.length <= 0

    joins = []
    getRelationByName: (name) ->

    for relationName in relations
      relation = configuration.relations[relationName]
      if relation
        if relation.requires
          for requiredRelationName in relation.requires
            requiredRelation = configuration.relations[requiredRelationName]
            joins.push requiredRelation.sql if requiredRelation
      joins.push relation.sql

    joins.join(' ')



module.exports = QueryGenerator
