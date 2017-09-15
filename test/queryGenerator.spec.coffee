expect = require('chai').expect
QueryGenerator = require './../lib/queryGenerator'

config = {
  table: 'tasks'
  mappers: {
    'task_status_from_name_to_ordinal': (statusName) ->
      return 1 if statusName.trim().toLowerCase() == 'scheduled'
      return 2 if statusName.trim().toLowerCase() == 'inprogress'
      return 3 if statusName.trim().toLowerCase() == 'done'
  }
  search: {
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
    { name: 'description', alias: 'this.description' }
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
    }
  }
}

describe 'Query generator', ->
  describe 'Columns', ->
    it 'simple (with no relation)', ->
      expect(QueryGenerator._toColumnSql([], config)).to.equal '
              tasks."id" "this.id",
              tasks."description" "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id"'

    it 'with provided relation', ->
      expect(QueryGenerator._toColumnSql(['employee'], config)).to.equal '
              tasks."id" "this.id",
              tasks."description" "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt"'

    it 'with provided relation which requires previous relation', ->
      expect(QueryGenerator._toColumnSql(['employee.account.tags'], config)).to.equal '
              tasks."id" "this.id",
              tasks."description" "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              accounts."id" "this.employee.account.id",
              accounts."name" "this.employee.account.name",
              accounts_tags."id" "this.employee.account.tags[].id",
              accounts_tags."label" "this.employee.account.tags[].label"'

    it 'with provided relation which requires previous relation [2]', ->
      expect(QueryGenerator._toColumnSql(['employee.account'], config)).to.equal '
              tasks."id" "this.id",
              tasks."description" "this.description",
              tasks."created_at" "this.createdAt",
              tasks."employee_id" "this.employee.id",
              employees."id" "this.employee.id",
              employees."name" "this.employee.name",
              employees."hired_at" "this.employee.hiredAt",
              accounts."id" "this.employee.account.id",
              accounts."name" "this.employee.account.name"'

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

      it 'single greater or equal than condition, result should be as expected', ->
        expect(QueryGenerator._toWhere({
          'employee_id>=': 15
        }, config)).to.deep.equal {
          where: 'tasks."employee_id" >= $1'
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

  describe 'Options', ->

    describe 'sorting', ->
      it 'given options sort -name, result should be as expected', ->
        optionsSql = QueryGenerator._toOptions({ sort: '-name' }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."name" DESC'

      it 'given options sort name, result should be as expected', ->
        optionsSql = QueryGenerator._toOptions({ sort: 'name' }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."name" ASC'

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

    describe 'sorting n paging', ->
      it 'when all configurations were provided', ->
        optionsSql = QueryGenerator._toOptions({ sort: '-name', limit: 30, offset: 5 }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."name" DESC OFFSET 5 LIMIT 30'

  describe 'Whole Sql', ->

    it 'should generate a complete n executable sql text for the given input', ->

      result = QueryGenerator.toSql {
        relations: ['employee']
        where: {
          employee_id: [1,3,2]
          employee_name: 'Luiz Freneda'
          service_id: null
          customer_id: [15,'null']
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
        },
        options:  {
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
            SELECT COUNT(distinct tasks."id")
            FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8;
        '
        sqlSelect: '
            SELECT
                tasks."id" "this.id",
                tasks."description" "this.description",
                tasks."created_at" "this.createdAt",
                tasks."employee_id" "this.employee.id",
                employees."id" "this.employee.id",
                employees."name" "this.employee.name",
                employees."hired_at" "this.employee.hiredAt"
            FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE
              tasks."id" IN (
                 SELECT
                  DISTINCT tasks."id"
                 FROM tasks
                   LEFT JOIN employees ON tasks.employee_id = employees.id
                 WHERE
                      (tasks."account_id" = $1)
                  AND tasks."employee_id" in ($2, $3, $4)
                  AND employees."name" = $5
                  AND tasks."service_id" is null
                  AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
                  AND tasks."created_at" > $7
                  AND tasks."updated_at" < $8
              )
            ORDER BY tasks."description" DESC OFFSET 15 LIMIT 28;
        '
        params: [ 1505, 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15' ]
        relations: [ 'employee' ]
      }