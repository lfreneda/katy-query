expect = require('chai').expect
ResultTransfomer = require './../lib/resultTransformer'

config = {

  table: 'tasks'
  mapper: 'task_mapper'

  mappers: {
    'task_mapper': (obj) -> obj
    'task_name_mapper': (name) -> name + ' mapped'
    'employee_name_mapper': (name) -> name + ' mapped [2]'
  }

  columns: [
    {name: 'id', alias: 'this.id'}
    {name: 'name', alias: 'this.name', mapper: 'task_name_mapper'}
  ],

  relations: {
    employee: {
      columns: [
        {name: 'name', alias: 'this.employee.name', mapper: 'employee_name_mapper'}
      ]
    }
    tags: {
      columns: [
        { name: 'id', alias: 'this.tags.id' }
        { name: 'name', alias: 'this.tags.name' }
      ]
    }
  }
}

describe 'Result Transformer', ->

  describe 'given a record set result in KatyQuery format', ->
    describe 'for single entity result', ->
      describe 'when mapper is configured', ->
        it 'value should be map as configured', ->

          model = ResultTransfomer.toModel {
            "this.id": 1,
            "this.name": "Task name",
            "this.employee.id": 2,
            "this.employee.name": "Luiz Freneda"
          }, config

          expect(model).to.deep.equal {
            id: 1,
            name: 'Task name mapped',
            employee: { id: 2, name: 'Luiz Freneda mapped [2]'}
          }

      describe 'as array with no joins', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModel [
            {
              "this.id": 1,
              "this.name": "Task name"
            }
          ], config

          expect(model).to.deep.equal {
            id: 1
            name: 'Task name mapped'
          }

      describe 'as object with no joins', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModel {
            "this.id": 1,
            "this.name": "Task name"
          }, config

          expect(model).to.deep.equal {
            id: 1
            name: 'Task name mapped'
          }

      describe 'as array with a `to one` inner join', ->
        it 'should bind as expected', ->

          model = ResultTransfomer.toModel [
            {
              "this.id": 1,
              "this.name": "Task name",
              "this.employee.id": 2,
              "this.employee.name": "Luiz Freneda"
            }
          ], config

          expect(model).to.deep.equal {
            id: 1
            name: 'Task name mapped'
            employee:
              id: 2
              name: 'Luiz Freneda mapped [2]'
          }

      describe 'as object with a `to one` inner join', ->
        it 'should bind as expected', ->

          model = ResultTransfomer.toModel {
            "this.id": 1,
            "this.name": "Task name",
            "this.employee.id": 2,
            "this.employee.name": "Luiz Freneda"
          }, config

          expect(model).to.deep.equal {
            id: 1
            name: 'Task name mapped'
            employee:
              id: 2
              name: 'Luiz Freneda mapped [2]'
          }

      describe 'with a `to many` inner join', ->

        it 'should bind as expected', ->

          model = ResultTransfomer.toModel [
            {
              "this.id": 1,
              "this.name": "Task name",
              "this.employee.id": 2,
              "this.employee.name": "Luiz Freneda",
              "this.tags[].id": 3,
              "this.tags[].name": "katy"
            },
            {
              "this.id": 1,
              "this.name": "Task name",
              "this.employee.id": 2,
              "this.employee.name": "Luiz Freneda",
              "this.tags[].id": 4,
              "this.tags[].name": "query"
            }
          ], config

          expect(model).to.deep.equal {
            id: 1
            name: 'Task name mapped'
            employee:
              id: 2
              name: 'Luiz Freneda mapped [2]'
            tags: [
              { id: 3, name: 'katy' }
              { id: 4, name: 'query' }
            ]
          }

      describe 'with twice inner join', ->
        it 'should bind as expected', ->

          model = ResultTransfomer.toModel {
            "this.id": "528ad1ca-c889-46f0-b044-689e0986dab2",
            "this.name": "Formulário",
            "this.questions[].id": "acf9af3f-f0ce-4ac9-93c2-c18e06d887ca",
            "this.questions[].type": 6,
            "this.questions[].title": "Qual alimento pode ser ser transformado em código?",
            "this.questions[].required": false,
            "this.questions[].position": 7,
            "this.questions[].options[].id": "a",
            "this.questions[].options[].value": "Carne Completo",
            "this.questions[].options[].position": 2
          }, config

          expect(model).to.deep.equal {
            id: '528ad1ca-c889-46f0-b044-689e0986dab2'
            name: 'Formulário mapped'
            questions: [
              id: 'acf9af3f-f0ce-4ac9-93c2-c18e06d887ca'
              type: 6
              title: 'Qual alimento pode ser ser transformado em código?'
              required: false
              position: 7
              options: [
                id: 'a'
                value: "Carne Completo"
                position: 2
              ]
            ]
          }

        it 'should bind as expected', ->
          model = ResultTransfomer.toModel [
            {
              "this.id": "528ad1ca-c889-46f0-b044-689e0986dab2",
              "this.name": "Formulário",
              "this.questions[].id": "acf9af3f-f0ce-4ac9-93c2-c18e06d887ca",
              "this.questions[].type": 6,
              "this.questions[].title": "Qual alimento pode ser ser transformado em código?",
              "this.questions[].required": false,
              "this.questions[].position": 7,
              "this.questions[].options[].id": "a",
              "this.questions[].options[].value": "Carne Completo",
              "this.questions[].options[].position": 1
            },
            {
              "this.id": "528ad1ca-c889-46f0-b044-689e0986dab2",
              "this.name": "Formulário",
              "this.questions[].id": "acf9af3f-f0ce-4ac9-93c2-c18e06d887ca",
              "this.questions[].type": 6,
              "this.questions[].title": "Qual alimento pode ser ser transformado em código?",
              "this.questions[].required": false,
              "this.questions[].position": 7,
              "this.questions[].options[].id": "b",
              "this.questions[].options[].value": "Café",
              "this.questions[].options[].position": 2
            }
          ], config

          # console.log JSON.stringify(model, null, 2)

          expect(model).to.deep.equal {
            id: '528ad1ca-c889-46f0-b044-689e0986dab2'
            name: 'Formulário mapped'
            questions: [
              id: 'acf9af3f-f0ce-4ac9-93c2-c18e06d887ca'
              type: 6
              title: 'Qual alimento pode ser ser transformado em código?'
              required: false
              position: 7
              options: [
                {
                  id: 'a'
                  value: "Carne Completo"
                  position: 1
                }
                {
                  id: 'b'
                  value: "Café"
                  position: 2
                }
              ]
            ]
          }

    describe 'for list entity result', ->
      describe 'with no joins', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModels [
            {
              "this.id": 1,
              "this.name": "Task name 1"
            },
            {
              "this.id": 2,
              "this.name": "Task name 2"
            },
            {
              "this.id": 3,
              "this.name": "Task name 3"
            }
          ], config

          expect(model).to.deep.equal [
            { id: 1, name: 'Task name 1 mapped' }
            { id: 2, name: 'Task name 2 mapped' }
            { id: 3, name: 'Task name 3 mapped' }
          ]

      describe 'with a `to one` inner join', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModels [
            {
              "this.id": 1,
              "this.name": "Task name 1",
              "this.employee.id": 3,
              "this.employee.name": "Luiz Freneda"
            },
            {
              "this.id": 2,
              "this.name": "Task name 2",
              "this.employee.id": 4,
              "this.employee.name": "Nicola Zagari"
            }
          ], config

          expect(model).to.deep.equal [
            {
              id: 1
              name: 'Task name 1 mapped'
              employee:
                id: 3
                name: 'Luiz Freneda mapped [2]'
            }
            {
              id: 2
              name: 'Task name 2 mapped'
              employee:
                id: 4
                name: 'Nicola Zagari mapped [2]'
            }
          ]


      describe 'with a `to many` inner join', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModels [
            {
              "this.id": 1,
              "this.name": "Task name 1",
              "this.employee.id": 3,
              "this.employee.name": "Luiz Freneda",
              "this.tags[].id": 10,
              "this.tags[].name": "katy"
            },
            {
              "this.id": 1,
              "this.name": "Task name 1",
              "this.employee.id": 3,
              "this.employee.name": "Luiz Freneda",
              "this.tags[].id": 11,
              "this.tags[].name": "query"
            },
            {
              "this.id": 2,
              "this.name": "Task name 2",
              "this.employee.id": 4,
              "this.employee.name": "Nicola Zagari",
              "this.tags[].id": 11,
              "this.tags[].name": "query"
            },
            {
              "this.id": 2,
              "this.name": "Task name 2",
              "this.employee.id": 4,
              "this.employee.name": "Nicola Zagari",
              "this.tags[].id": 12,
              "this.tags[].name": "cto"
            }
          ], config

          # console.log JSON.stringify(model)

          expect(model).to.deep.equal [
            {
              id: 1
              name: 'Task name 1 mapped'
              employee:
                id: 3
                name: 'Luiz Freneda mapped [2]'
              tags: [
                { id: 10, name: 'katy' }
                { id: 11, name: 'query' }
              ]
            }
            {
              id: 2
              name: 'Task name 2 mapped'
              employee:
                id: 4
                name: 'Nicola Zagari mapped [2]'
              tags: [
                { id: 11, name: 'query' }
                { id: 12, name: 'cto' }
              ]
            }
          ]
