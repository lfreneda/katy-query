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

  @_operators: {
      notEqualOperator: { operator: '<>' },
      greaterOrEqualThanOperator: { operator: '>=' },
      greaterThanOperator: { operator: '>' },
      lessOrEqualThanOperator: { operator: '<=' },
      lessThanOperator: { operator: '<' },
      iNotLikeOperator: { operator: '!~~*' },
      iLikeOperator: { operator: '~~*' },
      equalOperator: { operator: '=' }
    }

  @toSql: (args, config) ->

    args.options = args.options || {}
    whereResult = @_toWhere(args.where, config, args.options)
    relations = _.uniq(whereResult.relations.concat(args.relations || []))
    joins = @_toJoinSql(relations, config)
    columns = @_toColumnSql(relations, config, args.options)

    pageOptions = @_toOptions({ limit: args.options.limit, offset: args.options.offset }, config)
    sortOptions = @_toOptions({ sort: args.options.sort }, config)

    return {

      sqlCount: "SELECT
                  COUNT(DISTINCT #{config.table}.\"id\")
                FROM #{config.from || config.table}
                  #{joins}
                WHERE 
                #{whereResult.where};"

      sqlSelectIds: "SELECT #{config.table}.\"id\"
                    FROM #{config.from || config.table}
                    #{joins}
                    WHERE 
                    #{whereResult.where} 
                    GROUP BY #{config.table}.\"id\"
                    #{sortOptions} 
                    #{pageOptions};"

      sqlSelect: "SELECT #{columns}
                  FROM #{config.from || config.table}
                  #{joins}
                  WHERE 
                  #{whereResult.where} 
                  #{sortOptions} 
                  #{pageOptions};"

      params: whereResult.params
      relations: relations
    }

  @_toOptions: (options, config) ->

    sqlText = ''

    if options.sort
      sort = "#{config.table}.\"id\" ASC"
      direction = if options.sort.indexOf('-') is 0 then 'DESC' else 'ASC'
      field = options.sort.replace(/-|;/g, '')
      fieldConfig = @_getFieldConfigurationOrDefault config, field
      if (@_isSearchField(config, field))
        sort = "#{fieldConfig.table}.\"#{fieldConfig.column}\" #{direction}"
      sqlText += "ORDER BY #{sort} " if sort

    if options.limit or options.offset
      offsetValue = parseInt(options.offset) || 0
      limitValue = parseInt(options.limit) || 10
      if _.isNumber(offsetValue) and _.isNumber(limitValue)
        sqlText += "OFFSET #{offsetValue} "
        sqlText += "LIMIT #{limitValue}"

    sqlText = sqlText.trim()

  @_toWhere: (conditions, config, options) ->

    if _.isEmpty(conditions) and not options?.tenant
      return { where: '1=1', params: [], relations: [] }

    result = { where: [], params: [], relations: [] }

    if options?.tenant
      if _.isArray options.tenant.value
        tenantValues = []
        for tenantValue in options.tenant.value
          result.params.push tenantValue
          tenantValues.push "$#{result.params.length}"
        result.where.push "(#{config.table}.\"#{options.tenant.column}\" in (#{tenantValues.join(', ')}))"
      else
        result.params.push options.tenant.value
        result.where.push "(#{config.table}.\"#{options.tenant.column}\" = $#{result.params.length})"

    for own field, value of conditions
      if _.isArray value
        @_whereClauseAsArray field, value, result, config
      else if value is null or value is 'null' or value is '!null'
        @_whereNullClause field, value, result, config
      else
        @_whereOperatorClause field, value, result, config

    result.where = "#{result.where.join ' AND '}"
    result.relations = _.uniq(result.relations)
    result

  @_whereOperatorClause: (field, value, result, configuration) ->
    fieldOperator = @_getWhereOperator field
    field = field.replace fieldOperator.operator, ''
    fieldConfig = @_getFieldConfigurationOrDefault configuration, field, result

    columnName = "#{fieldConfig.table}.\"#{fieldConfig.column}\""

    if @_isSearchField(configuration, value)
      comparedFieldConfig = @_getFieldConfigurationOrDefault configuration, value, result
      comparedColumnName = "#{comparedFieldConfig.table}.\"#{comparedFieldConfig.column}\""
      result.where.push "#{columnName} #{fieldOperator.operator} #{comparedColumnName}"
    else
      columnName = fieldConfig.format.replace('{{column}}', columnName) if fieldConfig.format
      result.params.push fieldConfig.mapper(value)
      result.where.push "#{columnName} #{fieldOperator.operator} $#{result.params.length}"

  @_isSearchField: (config, value) ->
    if config.search[value] then yes else no

  @_getWhereOperator: (field) ->
    operatorHandler = switch
      when field.endsWith '<>' then @_operators.notEqualOperator
      when field.endsWith '>=' then @_operators.greaterOrEqualThanOperator
      when field.endsWith '>' then @_operators.greaterThanOperator
      when field.endsWith '<=' then @_operators.lessOrEqualThanOperator
      when field.endsWith '<' then @_operators.lessThanOperator
      when field.endsWith '!~~*' then @_operators.iNotLikeOperator
      when field.endsWith '~~*' then @_operators.iLikeOperator
      else @_operators.equalOperator

    operatorHandler

  @_whereClauseAsArray: (field, value, result, configuration) ->
    arrValues = []
    fieldOperator = @_getWhereOperator field
    field = field.replace fieldOperator.operator, ''
    fieldConfig = @_getFieldConfigurationOrDefault configuration, field, result
    for arrValue in value when arrValue not in ['null', null]
      result.params.push fieldConfig.mapper(arrValue)
      arrValues.push "$#{result.params.length}"
    withNull = 'null' in value or null in value

    whereResult = null
    if !fieldConfig.format
      whereResult = "#{fieldConfig.table}.\"#{fieldConfig.column}\""
    else
      columnName = fieldConfig.format.replace('{{column}}', "#{fieldConfig.table}.\"#{fieldConfig.column}\"") if fieldConfig.format
      whereResult =  "#{columnName}"

    if fieldOperator.operator == @_operators.iLikeOperator.operator
      whereResult += " LIKE ANY(ARRAY[#{arrValues.join(', ')}])"
    else if fieldOperator.operator == @_operators.iNotLikeOperator.operator
      whereResult += " NOT LIKE ANY(ARRAY[#{arrValues.join(', ')}])"
    else if fieldOperator.operator == @_operators.notEqualOperator.operator
      whereResult += " NOT IN (#{arrValues.join(', ')})"
    else
      whereResult += " in (#{arrValues.join(', ')})"
    if withNull
      whereResult = "(#{whereResult} OR #{fieldConfig.table}.\"#{fieldConfig.column}\" is null)"

    result.where.push whereResult

  @_whereNullClause: (field, value, result, configuration) ->
    fieldConfig = @_getFieldConfigurationOrDefault configuration, field, result
    if value is null or value is 'null'
      result.where.push "#{fieldConfig.table}.\"#{fieldConfig.column}\" is null"
    if value is '!null'
      result.where.push "#{fieldConfig.table}.\"#{fieldConfig.column}\" is not null"

  @_getFieldConfigurationOrDefault: (config, field, result) -> # TODO should be tested separately

    fieldConfiguration =
      table: config.table
      column: field
      mapper: (value) -> value

    searchConfig = config.search[field]

    if searchConfig
      fieldConfiguration.column = searchConfig.column if searchConfig.column
      fieldConfiguration.format = searchConfig.format if searchConfig.format

      if searchConfig.mapper
        mapper = config.mappers[searchConfig.mapper]
        if mapper
          fieldConfiguration.mapper = mapper
        else
          console.log "### WARNING: mapper #{searchConfig.mapper} not found, it will be ignored."

      if searchConfig.relation and config.relations[searchConfig.relation]
        result.relations.push searchConfig.relation if result
        fieldConfiguration.table = config.relations[searchConfig.relation].table

    fieldConfiguration

  @_toColumnSql: (relations = [], configuration, options) ->
    columns = []

    for column in configuration.columns
      columnName = "#{column.table || configuration.table}.\"#{column.name}\""
      columnName = column.format.replace('{{column}}', columnName) if column.format

      if options && options.columns && options.columns.length
        if column.alias && options.columns.includes(column.alias.replace('this.', ''))
          columns.push "#{columnName} \"#{column.alias}\""
      else
        columns.push "#{columnName} \"#{column.alias}\""

    @_getRelationRequiredChain configuration, relations, (relation) ->
      for column in relation.columns
        columnName = "#{column.table || relation.table}.\"#{column.name}\""
        columnName = column.format.replace('{{column}}', columnName) if column.format

        if options && options.columns && options.columns.length
          if column.alias && options.columns.includes(column.alias.replace('this.', ''))
            columns.push "#{columnName} \"#{column.alias}\""
        else
          columns.push "#{columnName} \"#{column.alias}\""

    _.uniq(columns).join ', '

  @_toJoinSql:(relations = [], configuration) ->
    return '' if relations.length <= 0
    joins = []
    @_getRelationRequiredChain configuration, relations, (relation) -> joins.push relation.sql
    _.uniq(joins).join ' '

  @_getRelationRequiredChain: (configuration, relations, callback) ->
    for relationName in relations
      relation = configuration.relations[relationName]
      if relation
        @_getRelationRequiredChain(configuration, relation.requires, callback) if relation.requires
        callback relation

module.exports = QueryGenerator
