expect = require('chai').expect
QueryGenerator = require './../lib/queryGenerator'

config = {
  table: 'tasks'
  from: 'tasks join orders on orders.id = tasks.order_id'
  useMainTablePagination: false
  mappers: {
    'task_status_from_name_to_ordinal': (statusName) ->
      return 1 if statusName.trim().toLowerCase() == 'scheduled'
      return 2 if statusName.trim().toLowerCase() == 'inprogress'
      return 3 if statusName.trim().toLowerCase() == 'done'
  }
  search: {
    'employee.created_at': {
      relation: 'employee'
      column: 'created_at'
    }
    description: {
      column: 'description'
    }
    employee_name: {
      relation: 'employee'
      column: 'name'
    }
    status: {
      mapper: 'task_status_from_name_to_ordinal'
    }
    hired_at: {
      relation: 'employee'
      column: 'hired_at'
      format: '({{column}} at time zone \'utc\') at time zone \'America/Sao_Paulo\''
    },
    'info.location.code': {
      relation: 'info'
      column: 'json_body'
      format: '({{column}}->\'location\'->>\'code\''
    },
    employeeId: {
      column: 'employee_id'
      pattern: /^\d+$/
      orWhere: [
        {
          table: 'tasks_employees'
          column: 'employee_id'
        }
      ]
    }
  }

  columns: [
    { name: 'id', alias: 'this.id' }
    { name: 'description', alias: 'this.description', format: 'COALESCE({{column}},\'(none)\')' }
    { name: 'created_at', alias: 'this.createdAt' }
    { name: 'employee_id', alias: 'this.employee.id' }
  ]

  relations: {
    employee: {
      table: 'employees'
      sql: 'LEFT JOIN employees ON tasks.employee_id = employees.id'
      columns: [
        { name: 'id', alias: 'this.employee.id' }
        { name: 'name', alias: 'this.employee.name' }
        { name: 'hired_at', alias: 'this.employee.hiredAt' }
        { name: 'created_at', alias: 'this.employee.createdAt' }
      ]
    }
    rating: {
      table: 'rating'
      sql: 'LEFT JOIN rating ON tasks.rating_id = rating.id'
      columns: [
        { name: 'id', alias: 'this.rating.id' }
        { name: 'stars', alias: 'this.rating.stars' }
        { name: 'comments', alias: 'this.rating.comments', format: 'COALESCE({{column}},\'(none)\')' }
      ]
    }
    'employee.account': {
      requires: [ 'employee' ]
      table: 'accounts'
      sql: 'LEFT JOIN accounts ON accounts.id = employees.account_id'
      columns: [
        { name: 'id', alias: 'this.employee.account.id' }
        { name: 'name', alias: 'this.employee.account.name' }
      ]
    }
    'employee.account.tags': {
      requires: [ 'employee.account' ]
      table: 'accounts_tags'
      sql: 'LEFT JOIN accounts_tags ON accounts.id = accounts_tags.account_id'
      columns: [
        { name: 'id', alias: 'this.employee.account.tags[].id' }
        { name: 'label', alias: 'this.employee.account.tags[].label' }
      ]
    },
    info: {
      table: 'info'
      sql: 'LEFT JOIN info ON tasks.info_id = info.id'
      columns: [
        { name: 'id', alias: 'this.info.id' }
        { name: 'json_body', alias: 'this.info.jsonBody' }
      ]
    }
  }
}

configWithMainTablePagination = {
  table: 'tasks'
  from: 'tasks join orders on orders.id = tasks.order_id'
  useMainTablePagination: true
  mappers: {
    'task_status_from_name_to_ordinal': (statusName) ->
      return 1 if statusName.trim().toLowerCase() == 'scheduled'
      return 2 if statusName.trim().toLowerCase() == 'inprogress'
      return 3 if statusName.trim().toLowerCase() == 'done'
  }
  search: {
    'employee.created_at': {
      relation: 'employee'
      column: 'created_at'
    }
    description: {
      column: 'description'
    }
    employee_name: {
      relation: 'employee'
      column: 'name'
    }
    status: {
      mapper: 'task_status_from_name_to_ordinal'
    }
    hired_at: {
      relation: 'employee'
      column: 'hired_at'
      format: '({{column}} at time zone \'utc\') at time zone \'America/Sao_Paulo\''
    }
  }

  columns: [
    { name: 'id', alias: 'this.id' }
    { name: 'description', alias: 'this.description', format: 'COALESCE({{column}},\'(none)\')' }
    { name: 'created_at', alias: 'this.createdAt' }
    { name: 'employee_id', alias: 'this.employee.id' }
  ]

  relations: {
    employee: {
      table: 'employees'
      sql: 'LEFT JOIN employees ON tasks.employee_id = employees.id'
      columns: [
        { name: 'id', alias: 'this.employee.id' }
        { name: 'name', alias: 'this.employee.name' }
        { name: 'hired_at', alias: 'this.employee.hiredAt' }
        { name: 'created_at', alias: 'this.employee.createdAt' }
      ]
    },
    order: {
      table: 'orders',
      sql: 'INNER JOIN orders ON tasks.order_id = orders.id',
      columns: [
        { name: 'id', alias: 'this.order.id' },
        { name: 'number', alias: 'this.order.address.number' },
        { name: 'complement', alias: 'this.order.address.complement' },
        { name: 'neighborhood', alias: 'this.order.address.neighborhood' },
        { name: 'city', alias: 'this.order.address.city' },
        { name: 'state', alias: 'this.order.address.state' }
      ]
    },
    'order.labels': {
      table: 'orders_labels',
      requires: ['order'],
      sql: 'LEFT JOIN orders_labels ON orders.id = orders_labels.order_id \
            LEFT JOIN labels ON labels.id = orders_labels.label_id ',
      columns: [
        { name: 'id', alias: 'this.order.labels[].id', table: 'labels' },
        { name: 'name', alias: 'this.order.labels[].name', table: 'labels' },
        { name: 'color', alias: 'this.order.labels[].color', table: 'labels' }
      ]
    }
  }
}

describe 'Query generator', ->
  describe 'Columns', ->
    it 'simple (with no relation)', ->
      expect(QueryGenerator._toColumnSql([], config)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id"'

    it 'with provided relation', ->
      expect(QueryGenerator._toColumnSql(['employee'], config)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              employees."created_at" "this.employee.createdAt"',

    it 'with provided relation with format', ->
      expect(QueryGenerator._toColumnSql(['rating'], config)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              rating."id" "this.rating.id",
              rating."stars" "this.rating.stars",
              COALESCE(rating."comments",\'(none)\') "this.rating.comments"'

    it 'with provided relation which requires previous relation', ->
      expect(QueryGenerator._toColumnSql(['employee.account.tags'], config)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              employees."created_at" "this.employee.createdAt",
              accounts."id" "this.employee.account.id",
              accounts."name" "this.employee.account.name",
              accounts_tags."id" "this.employee.account.tags[].id",
              accounts_tags."label" "this.employee.account.tags[].label"'

    it 'with provided relation which requires previous relation [2]', ->
      expect(QueryGenerator._toColumnSql(['employee.account'], config)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              employees."created_at" "this.employee.createdAt",
              accounts."id" "this.employee.account.id",
              accounts."name" "this.employee.account.name"'

    it 'with provided relation which requires previous relation [3]', ->
      expect(QueryGenerator._toColumnSql(['employee.account', 'employee.account.tags'], config)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              employees."created_at" "this.employee.createdAt",
              accounts."id" "this.employee.account.id",
              accounts."name" "this.employee.account.name",
              accounts_tags."id" "this.employee.account.tags[].id",
              accounts_tags."label" "this.employee.account.tags[].label"'

    it 'with provided relation which specified columns [1]', ->
      options = {
        columns: ['createdAt', 'employee.id', 'employee.name']
      }
      expect(QueryGenerator._toColumnSql(['employee'], config, options)).to.equal '
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name"'

    it 'with provided relation which specified columns [2]', ->
      options = {
        columns: ['id', 'description']
      }
      expect(QueryGenerator._toColumnSql([], config, options)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description"'

    it 'with provided relation which specified columns [3]', ->
      options = {
        columns: ['id', 'description', 'notExist']
      }
      expect(QueryGenerator._toColumnSql([], config, options)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description"'

    it 'with provided relation which specified columns [4]', ->
      options = {
        columns: [
          'id', 'description',
          'employee.name', 'employee.hiredAt',
          'rating.stars', 'rating.comments'
        ]
      }
      expect(QueryGenerator._toColumnSql(['rating', 'employee'], config, options)).to.equal '
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              rating."stars" "this.rating.stars",
              COALESCE(rating."comments",\'(none)\') "this.rating.comments",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt"'

    it 'with provided relation which specified columns is empty, must by ignored', ->
      options = {
        columns: []
      }
      expect(QueryGenerator._toColumnSql([], config, options)).to.equal 'tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id"'

    it 'with provided relation which options empty object', ->
      options = {}
      expect(QueryGenerator._toColumnSql([], config, options)).to.equal 'tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id"'

    it 'with provided relation which options empty', ->
      options = null
      expect(QueryGenerator._toColumnSql([], config, options)).to.equal 'tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id"'

  describe 'Joins', ->

    it 'simple (with no relation)', ->
      expect(QueryGenerator._toJoinSql([], config)).to.equal ''

    it 'with provided relation', ->
      expect(QueryGenerator._toJoinSql(['employee'], config)).to.equal '
        LEFT JOIN employees ON tasks.employee_id = employees.id
      '

    it 'with provided relation which requires previous relation', ->
      expect(QueryGenerator._toJoinSql(['employee.account.tags'], config)).to.equal '
        LEFT JOIN employees ON tasks.employee_id = employees.id
        LEFT JOIN accounts ON accounts.id = employees.account_id
        LEFT JOIN accounts_tags ON accounts.id = accounts_tags.account_id
      '

    it 'with provided relation which requires previous relation [2]', ->
      expect(QueryGenerator._toJoinSql(['employee.account'], config)).to.equal '
        LEFT JOIN employees ON tasks.employee_id = employees.id
        LEFT JOIN accounts ON accounts.id = employees.account_id
      '

  describe 'Where', ->
    it 'when conditions is null', ->
      expect(QueryGenerator._toWhere(null, config)).to.deep.equal { where: '1=1', params: [], relations: [] }

    it 'when conditions is empty', ->
      expect(QueryGenerator._toWhere({}, config)).to.deep.equal { where: '1=1', params: [], relations: [] }

    describe 'with tenant config', ->
      it 'when empty conditions and options tenant is provided, should be the first where clause', ->
        expect(QueryGenerator._toWhere({}, config, { tenant: { column: "account_id", value: 1 }})).to.deep.equal {
          where: '(tasks."account_id" = $1)'
          params: [1]
          relations: []
        }

      it 'when empty conditions and options tenant as array is provided, should be the first where clause', ->
        expect(QueryGenerator._toWhere({}, config, { tenant: { column: "account_id", value: [1,2,3] }})).to.deep.equal {
          where: '(tasks."account_id" in ($1, $2, $3))'
          params: [1,2,3]
          relations: []
        }

      it 'when conditions and options tenant are provided, should be the first where clause', ->
        expect(QueryGenerator._toWhere({ employee_id: 2 }, config, { tenant: { column: "account_id", value: 1 }})).to.deep.equal {
          where: '(tasks."account_id" = $1) AND tasks."employee_id" = $2'
          params: [1,2]
          relations: []
        }

      it 'when conditions and options tenant as array are provided, should be the first where clause', ->
        expect(QueryGenerator._toWhere({ employee_id: 2 }, config, { tenant: { column: "account_id", value: [1,2,3] }})).to.deep.equal {
          where: '(tasks."account_id" in ($1, $2, $3)) AND tasks."employee_id" = $4'
          params: [1,2,3,2]
          relations: []
        }

    describe 'basic comparison', ->
      it 'single equal condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: 1
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" = $1'
          params: [ 1 ]
          relations: []
        }

      it 'single is null as null condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: null
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" is null'
          params: []
          relations: []
        }

      it 'single is null as string condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: 'null'
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" is null'
          params: []
          relations: []
        }

      it 'single equal condition with mapper configured, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          status: 'done'
        }, config)).to.deep.equal {
          where: 'tasks."status" = $1'
          params: [3]
          relations: []
        }

      it 'single equal condition with orWhere configured, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employeeId: '1'
        }, config)).to.deep.equal {
          where: '(tasks.\"employee_id\" = $1 or tasks_employees.employee_id = $1)'
          params: ['1']
          relations: []
        }

      it 'single equal format column with mapper configured, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          hired_at: '2017-07-15'
        }, config)).to.deep.equal {
          where: '(employees."hired_at" at time zone \'utc\') at time zone \'America/Sao_Paulo\' = $1'
          params: ['2017-07-15']
          relations: ['employee']
        }

      it 'single equal column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_name: 'Luiz Freneda'
        }, config)).to.deep.equal {
          where: 'employees."name" = $1'
          params: [
            'Luiz Freneda'
          ]
          relations: [ 'employee' ]
        }

      it 'single ilike column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name~~*': 'Luiz Freneda'
        }, config)).to.deep.equal {
          where: 'employees."name" ~~* $1'
          params: [
            'Luiz Freneda'
          ]
          relations: [ 'employee' ]
        }

      it 'single ilike column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name!~~*': 'Vinícius'
        }, config)).to.deep.equal {
          where: 'employees."name" !~~* $1'
          params: [
            'Vinícius'
          ]
          relations: [ 'employee' ]
        }

      it 'single is not null condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id': '!null'
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" is not null'
          params: []
          relations: []
        }

      it 'single is null condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: null
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" is null'
          params: []
          relations: []
        }

      it 'single is null column of an relation condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_name: null
        }, config)).to.deep.equal {
          where: 'employees."name" is null'
          params: []
          relations: [ 'employee' ]
        }

      it 'single is not null column of an relation condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_name: '!null'
        }, config)).to.deep.equal {
          where: 'employees."name" is not null'
          params: []
          relations: [ 'employee' ]
        }

      it 'single greater or equal than condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id>=': 15
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" >= $1'
          params: [ 15 ]
          relations: []
        }

      it 'single not equal condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id<>': 15
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" <> $1'
          params: [ 15 ]
          relations: []
        }

      it 'single greater or equal than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name>=': 15
        }, config)).to.deep.equal {
          where: 'employees."name" >= $1'
          params: [ 15 ]
          relations: [ 'employee' ]
        }

      it 'single greater than condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id>': 16
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" > $1'
          params: [ 16 ]
          relations: []
        }

      it 'single greater than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name>': 159
        }, config)).to.deep.equal {
          where: 'employees."name" > $1'
          params: [ 159 ]
          relations: [ 'employee' ]
        }

      it 'single less than condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id<': 88
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" < $1'
          params: [ 88 ]
          relations: []
        }

      it 'single less than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name<': 34
        }, config)).to.deep.equal {
          where: 'employees."name" < $1'
          params: [ 34 ]
          relations: [ 'employee' ]
        }

      it 'single less or equal than condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id<=': 5
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" <= $1'
          params: [ 5 ]
          relations: []
        }

      it 'single less than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name<=': 36
        }, config)).to.deep.equal {
          where: 'employees."name" <= $1'
          params: [ 36 ]
          relations: [ 'employee' ]
        }

      it 'multiples equal conditions, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: 1
          description: 'task description here'
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" = $1 AND tasks."description" = $2'
          params: [ 1, 'task description here' ]
          relations: []
        }

      it 'multiple equal format column with mapper configured, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'info.location.code': ['0255', '0213']
        }, config)).to.deep.equal {
          where: "(info.\"json_body\"->'location'->>'code' in ($1, $2)"
          params: ['0255', '0213']
          relations: ['info']
        }

      it 'multiples ilike column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name~~*': ['Luiz%', '%Vinícius%']
        }, config)).to.deep.equal {
          where: 'employees."name" LIKE ANY(ARRAY[$1, $2])'
          params: [
            'Luiz%',
            '%Vinícius%'
          ]
          relations: [ 'employee' ]
        }

      it 'multiples ilike column and has null of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name~~*': ['Luiz%', '%Vinícius%', null]
        }, config)).to.deep.equal {
          where: '(employees."name" LIKE ANY(ARRAY[$1, $2]) OR employees."name" is null)'
          params: [
            'Luiz%',
            '%Vinícius%'
          ]
          relations: [ 'employee' ]
        }

      it 'multiples not ilike column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name!~~*': ['Katy%', '%Query']
        }, config)).to.deep.equal {
          where: 'employees."name" NOT LIKE ANY(ARRAY[$1, $2])'
          params: [
            'Katy%',
            '%Query'
          ]
          relations: [ 'employee' ]
        }

      it 'multiples not in column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_name<>': ['Katy', 'Query', 'SQL', 'builder']
        }, config)).to.deep.equal {
          where: 'employees."name" NOT IN ($1, $2, $3, $4)'
          params: [
            'Katy',
            'Query',
            'SQL',
            'builder'
          ]
          relations: [ 'employee' ]
        }

    describe 'comparison between search fields', ->

      # FIXME: Isso é bad, bater no banco com uma syntax errada de tipo de dado
      # Exemplo: Dado timespan bater como string D:
      # PS: isso acontece em todos os casos, não só nesse :S

      it 'single greater than with no configured search fields', ->
        expect(QueryGenerator._toWhere({
          'created_at>': 'employee.created_date'
        }, config)).to.deep.equal {
          where: 'tasks."created_at" > $1'
          params: [ 'employee.created_date' ]
          relations: []
        }

      it 'single greater than with configured search fields', ->
        expect(QueryGenerator._toWhere({
          'created_at>': 'employee.created_at'
        }, config)).to.deep.equal {
          where: 'tasks."created_at" > employees."created_at"'
          params: []
          relations: ['employee']
        }

      it 'single greater than or equal with configured search fields', ->
        expect(QueryGenerator._toWhere({
          'created_at>=': 'employee.created_at'
        }, config)).to.deep.equal {
          where: 'tasks."created_at" >= employees."created_at"'
          params: []
          relations: ['employee']
        }

      it 'single less than or equal with configured search fields', ->
        expect(QueryGenerator._toWhere({
          'created_at<=': 'employee.created_at'
        }, config)).to.deep.equal {
          where: 'tasks."created_at" <= employees."created_at"'
          params: []
          relations: ['employee']
        }

      it 'single less than with configured search fields', ->
        expect(QueryGenerator._toWhere({
          'created_at<': 'employee.created_at'
        }, config)).to.deep.equal {
          where: 'tasks."created_at" < employees."created_at"'
          params: []
          relations: ['employee']
        }

      it 'single equal to with configured search fields', ->
        expect(QueryGenerator._toWhere({
          'created_at': 'employee.created_at'
        }, config)).to.deep.equal {
          where: 'tasks."created_at" = employees."created_at"'
          params: []
          relations: ['employee']
        }

    describe 'array comparison', ->

      it 'single in condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: [1,3,2]
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" in ($1, $2, $3)'
          params: [ 1, 3, 2 ]
          relations: []
        }

      it 'single in condition with mapper configured, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          status: ['scheduled','inprogress']
        }, config)).to.deep.equal {
          where: 'tasks."status" in ($1, $2)'
          params: [ 1, 2 ]
          relations: []
        }

      it 'single in conditions with null (as string) included, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: [1,3,2,'null']
        }, config)).to.deep.equal {
          where: '(tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null)'
          params: [ 1, 3, 2 ]
          relations: []
        }

      it 'single in conditions with null included, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: [1,3,2,null]
        }, config)).to.deep.equal {
          where: '(tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null)'
          params: [ 1, 3, 2 ]
          relations: []
        }

      it 'multiples in condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: [1,3,2]
          customer_id: [9,8,7]
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" in ($1, $2, $3) AND tasks."customer_id" in ($4, $5, $6)'
          params: [ 1, 3, 2, 9, 8, 7 ]
          relations: []
        }

      it 'multiples in condition with null included, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: [1,3,2, 'null']
          customer_id: [9,8,7]
        }, config)).to.deep.equal {
          where: '(tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null) AND tasks."customer_id" in ($4, $5, $6)'
          params: [ 1, 3, 2, 9, 8, 7 ]
          relations: []
        }

      it 'multiples in/equal condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: [1,3,2]
          customer_id: 9
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" in ($1, $2, $3) AND tasks."customer_id" = $4'
          params: [ 1, 3, 2, 9 ]
          relations: []
        }

      it 'multiples in/notEqual condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id<>': [5,6,4]
          customer_id: 1
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" NOT IN ($1, $2, $3) AND tasks."customer_id" = $4'
          params: [ 5, 6, 4, 1 ]
          relations: []
        }

      it 'multiples in/notLikeIn condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id!~~*': [8,9,7]
          customer_id: 1
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" NOT LIKE ANY(ARRAY[$1, $2, $3]) AND tasks."customer_id" = $4'
          params: [ 8, 9, 7, 1 ]
          relations: []
        }


    describe 'pattern matching', ->
      it.skip 'tbd', ->

    describe 'regex', ->
      it.skip 'tbd', ->

    describe 'complex conditions', ->

      it 'complex conditions, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          employee_id: [1,3,2]
          employee_name: 'Luiz Freneda'
          service_id: null
          customer_id: [15,'null']
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" in ($1, $2, $3)
                    AND employees."name" = $4
                    AND tasks."service_id" is null
                    AND (tasks."customer_id" in ($5) OR tasks."customer_id" is null)
                    AND tasks."created_at" > $6
                    AND tasks."updated_at" < $7
          '
          params: [ 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15' ]
          relations: [ 'employee' ]
        }

  describe 'orWhere', ->

  describe 'Options', ->

    describe 'sorting', ->
      it 'given options sort -name, result should be as expected', ->
        optionsSql = QueryGenerator._toOptions({ sort: '-description' }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."description" DESC'

      it 'given options sort name, result should be as expected', ->
        optionsSql = QueryGenerator._toOptions({ sort: 'description' }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."description" ASC'

    describe 'paging', ->
      it 'when limit was provided but no offset', ->
        optionsSql = QueryGenerator._toOptions({ limit: 12, }, config)
        expect(optionsSql).to.equal 'OFFSET 0 LIMIT 12'

      it 'when offset was provided but have no limit, limit should be 10', ->
        optionsSql = QueryGenerator._toOptions({ offset: 5 }, config)
        expect(optionsSql).to.equal 'OFFSET 5 LIMIT 10'

      it 'when both limit and offset were provided', ->
        optionsSql = QueryGenerator._toOptions({ limit: 30, offset: 5 }, config)
        expect(optionsSql).to.equal 'OFFSET 5 LIMIT 30'

      it 'when both limit and offset were provided', ->
        optionsSql = QueryGenerator._toOptions({ limit: '30', offset: '00005' }, config)
        expect(optionsSql).to.equal 'OFFSET 5 LIMIT 30'

    describe 'sorting n paging', ->

      it 'when all configurations were provided', ->
        optionsSql = QueryGenerator._toOptions({ sort: '-description', limit: 30, offset: 5 }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."description" DESC OFFSET 5 LIMIT 30'

      it 'should block sql injection attack', ->
        optionsSql = QueryGenerator._toOptions({ sort: '-description;--delete from table;', limit: '-name;--delete from table;', offset: '-name;--delete from table;' }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."id" ASC OFFSET 0 LIMIT 10'

  describe 'Whole Sql', ->

    it 'should generate a complete n executable sql text for the given input', ->

      result = QueryGenerator.toSql {
        relations: ['employee']
        where: {
          employee_id: [1,3,2]
          employee_name: 'Luiz Freneda'
          service_id: null
          customer_id: [15,'null']
          created_at: '!null'
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
          'created_at>=': 'employee.created_at'
          'employee_name~~*': ['Luiz%', '%Vinícius%']
          'employee_name!~~*': ['Katy%', 'Query']
          'employee_id<>': [4,5]
        },
        options: {
          sort: '-description',
          offset: 15,
          limit: 28,
          tenant: {
            column: 'account_id'
            value: 1505
          }
        }
      }, config

      expect(result).to.deep.equal {

        sqlCount: '
            SELECT COUNT(DISTINCT tasks."id")
            FROM tasks join orders on orders.id = tasks.order_id
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14);
        '

        sqlSelectIds: '
            SELECT
              tasks."id"
            FROM tasks join orders on orders.id = tasks.order_id
            LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14)
            GROUP BY tasks."id"
            ORDER BY tasks."description" DESC
            OFFSET 15 LIMIT 28;
        '

        sqlSelect: '
            SELECT
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              employees."created_at" "this.employee.createdAt"
            FROM tasks join orders on orders.id = tasks.order_id
            LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14)
            ORDER BY tasks."description" DESC
            OFFSET 15 LIMIT 28;
        '

        params: [ 1505, 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15', 'Luiz%', '%Vinícius%', 'Katy%', 'Query', 4, 5 ]
        relations: [ 'employee' ]
      }

    it 'should generate a complete main table pagination n executable sql text for the given input', ->

      result = QueryGenerator.toSql {
        relations: ['employee']
        where: {
          employee_id: [1,3,2]
          employee_name: 'Luiz Freneda'
          service_id: null
          customer_id: [15,'null']
          created_at: '!null'
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
          'created_at>=': 'employee.created_at'
          'employee_name~~*': ['Luiz%', '%Vinícius%']
          'employee_name!~~*': ['Katy%', 'Query']
          'employee_id<>': [4,5]
        },
        options: {
          sort: '-description',
          offset: 15,
          limit: 28,
          tenant: {
            column: 'account_id'
            value: 1505
          }
        }
      }, configWithMainTablePagination

      expect(result).to.deep.equal {

        sqlCount: '
            SELECT COUNT(DISTINCT tasks."id")
            FROM tasks join orders on orders.id = tasks.order_id
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14);
        '

        sqlSelectIds: '
            SELECT
              tasks."id"
            FROM (
              SELECT tasks.*
              FROM tasks join orders on orders.id = tasks.order_id
              OFFSET 15 LIMIT 28
            ) AS tasks
            LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14)
            GROUP BY tasks."id"
            ORDER BY tasks."description" DESC ;
        '

        sqlSelect: '
            SELECT
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              employees."created_at" "this.employee.createdAt"
            FROM (
              SELECT tasks.*
              FROM tasks join orders on orders.id = tasks.order_id
              OFFSET 15 LIMIT 28
            ) AS tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14)
            ORDER BY tasks."description" DESC ;
        '

        params: [ 1505, 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15', 'Luiz%', '%Vinícius%', 'Katy%', 'Query', 4, 5 ]
        relations: [ 'employee' ]
      }

    it 'should generate a complete n executable sql text for the given input, where has specified columns', ->

      result = QueryGenerator.toSql {
        relations: ['employee']
        where: {
          employee_id: [1,3,2]
          employee_name: 'Luiz Freneda'
          service_id: null
          customer_id: [15,'null']
          created_at: '!null'
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
          'created_at>=': 'employee.created_at'
          'employee_name~~*': ['Luiz%', '%Vinícius%']
          'employee_name!~~*': ['Katy%', 'Query']
          'employee_id<>': [4,5]
        },
        options: {
          sort: '-description',
          offset: 15,
          limit: 28,
          columns: [
            'id',
            'description',
            'employee.name'
          ]
          tenant: {
            column: 'account_id'
            value: 1505
          }
        }
      }, config

      expect(result).to.deep.equal {

        sqlCount: '
            SELECT COUNT(DISTINCT tasks."id")
            FROM tasks join orders on orders.id = tasks.order_id
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14);
        '

        sqlSelectIds: '
            SELECT
              tasks."id"
            FROM tasks join orders on orders.id = tasks.order_id
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14)
            GROUP BY tasks."id"
            ORDER BY tasks."description" DESC
            OFFSET 15 LIMIT 28;
        '

        sqlSelect: '
            SELECT
              tasks."id" "this.id",
              COALESCE(tasks."description",\'(none)\') "this.description",
              employees."name" "this.employee.name"
            FROM tasks join orders on orders.id = tasks.order_id
            LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE
                (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" is not null
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
              AND tasks."created_at" >= employees."created_at"
              AND employees."name" LIKE ANY(ARRAY[$9, $10])
              AND employees."name" NOT LIKE ANY(ARRAY[$11, $12])
              AND tasks."employee_id" NOT IN ($13, $14)
            ORDER BY tasks."description" DESC
            OFFSET 15 LIMIT 28;'

        params: [ 1505, 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15', 'Luiz%', '%Vinícius%', 'Katy%', 'Query', 4, 5 ]
        relations: [ 'employee' ]
      }