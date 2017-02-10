expect = require('chai').expect
ResultTransfomer = require './../lib/resultTransformer'
joinjs = require('join-js').default

config = {

  table: 'tasks'
  mapper: 'task_mapper'

  mappers: {
    'task_mapper': (obj) -> obj
    'task_name_mapper': (name) -> name + ' mapped'
    'employee_name_mapper': (name) -> name + ' mapped [2]'
  }

  collapse: {

    mapId: 'tasksMap',
    columnPrefix: 'this.'

    resultMaps: [

      {
        mapId: 'tasksMap',
        idProperty: 'id',
        properties: [
          'name'
        ],
        associations: [
          {name: 'employee', mapId: 'employeesMap', columnPrefix: 'this.employee.'}
        ]
        collections: [
          {name: 'tags', mapId: 'tagsMap', columnPrefix: 'this.tags[].'}
          {name: 'questions', mapId: 'questionsMap', columnPrefix: 'this.questions[].'}
        ]
      },

      {
        mapId: 'employeesMap',
        idProperty: 'id',
        properties: [
          'name'
        ]
      },

      {
        mapId: 'tagsMap',
        idProperty: 'id',
        properties: [
          'name'
        ]
      },

      {
        mapId: 'questionsMap'
        idProperty: 'id',
        properties: [
          'title', 'required', 'position', 'type'
        ]
        collections: [
          { name: 'options', mapId: 'optionsMap', columnPrefix: 'this.questions[].options[].' }
        ]
      },

      {
        mapId: 'optionsMap'
        idProperty: 'id'
        properties: [
          'value', 'position'
        ]
      }
    ]
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

describe 'Mapping with joinjs', ->

  it 'given a fc\'s real case should bind as expected', ->
    it 'should returns as expected', ->
      data = [
        {
          "this.id": 1,
          "this.name": "Eduardo Luiz",
          "this.account.id": 1,
          "this.contact.email": "eduardoluizsantos@gmail.com",
          "this.contact.phone": "11965874523",
          "this.notes": null,
          "this.archived": false,
          "this.address.zipCode": "05422010",
          "this.address.street": "Rua dos Pinheiros",
          "this.address.number": "383",
          "this.address.complement": null,
          "this.address.neighborhood": null,
          "this.address.city": "Sao Paulo",
          "this.address.state": "Sao Paulo",
          "this.address.coords.latitude": "1",
          "this.address.coords.longitude": "2",
          "this.labels.id": "297726d0-301d-4de6-b9a4-e439b81f44ba",
          "this.labels.name": "Contrato",
          "this.labels.color": "yellow",
          "this.labels.type": 1
        },
        {
          "this.id": 1,
          "this.account.id": 1,
          "this.name": "Eduardo Luiz",
          "this.contact.email": "eduardoluizsantos@gmail.com",
          "this.contact.phone": "11965874523",
          "this.notes": null,
          "this.archived": false,
          "this.address.zipCode": "05422010",
          "this.address.street": "Rua dos Pinheiros",
          "this.address.number": "383",
          "this.address.complement": null,
          "this.address.neighborhood": null,
          "this.address.city": "Sao Paulo",
          "this.address.state": "Sao Paulo",
          "this.address.coords.latitude": "1",
          "this.address.coords.longitude": "2",
          "this.labels.id": "1db6e07f-91e2-42fb-b65c-9a364b6bad4c",
          "this.labels.name": "Particular",
          "this.labels.color": "purple",
          "this.labels.type": 1
        }
      ]

      resultMaps = [
        {
          mapId: 'customersMap'
          idProperty: 'id',
          properties: ['name', 'notes', 'archived'],

          associations: [
            {name: 'contact', mapId: 'contactsMap', columnPrefix: 'this.contact.'}
            {name: 'account', mapId: 'accountsMap', columnPrefix: 'this.account.'}
            {name: 'address', mapId: 'addressMap', columnPrefix: 'this.address.'}
          ]

          collections: [
            {name: 'labels', mapId: 'labelsMap', columnPrefix: 'this.labels.'}
          ]
        },
        {
          mapId: 'contactsMap'
          idProperty: 'phone',
          properties: ['email']
        },
        {
          mapId: 'accountsMap'
          idProperty: 'id',
          properties: []
        },
        {
          mapId: 'addressMap'
          idProperty: 'zipCode',
          properties: ['city', 'street', 'state', 'neighborhood', 'complement', 'number']
          associations: [
            {name: 'coords', mapId: 'coordsMap', columnPrefix: 'this.address.coords.'}
          ]
        },
        {
          mapId: 'coordsMap'
          idProperty: 'latitude',
          properties: ['longitude']
        },
        {
          mapId: 'labelsMap',
          idProperty: 'id',
          properties: ['name', 'color', 'type'],
        }
      ]

      mappedResult = joinjs.map(data, resultMaps, 'customersMap', 'this.');

      expect(mappedResult[0]).to.deep.equal {
        "id": 1,
        "account": {
          "id": 1
        },
        "name": "Eduardo Luiz",
        "contact": {
          "email": "eduardoluizsantos@gmail.com",
          "phone": "11965874523"
        },
        "notes": null,
        "archived": false,
        "address": {
          "zipCode": "05422010",
          "street": "Rua dos Pinheiros",
          "number": "383",
          "complement": null,
          "neighborhood": null,
          "city": "Sao Paulo",
          "state": "Sao Paulo",
          "coords": {
            "latitude": "1",
            "longitude": "2"
          }
        },
        "labels": [
          {
            "id": "297726d0-301d-4de6-b9a4-e439b81f44ba",
            "name": "Contrato",
            "color": "yellow",
            "type": 1
          },
          {
            "id": "1db6e07f-91e2-42fb-b65c-9a364b6bad4c",
            "name": "Particular",
            "color": "purple",
            "type": 1
          }
        ]
      }

  it 'given a simple mapping and rows should be bind as expected', ->
    resultMaps = [
      {
        mapId: 'teamMap',
        idProperty: 'id',
        properties: ['name'],
        associations: [
          {name: 'player', mapId: 'playerMap', columnPrefix: 'player_'}
        ]
      },
      {
        mapId: 'playerMap',
        idProperty: 'name'
      }
    ]

    resultSet = [
      {team_id: 1, team_name: 'New England Patriots', player_name: 'Tom Brady'}
    ];

    mappedResult = joinjs.map(resultSet, resultMaps, 'teamMap', 'team_');

    expect(mappedResult).to.deep.equal [
      {
        id: 1
        name: 'New England Patriots'
        player: {
          name: 'Tom Brady'
        }
      }
    ]


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
            tags: []
            questions: []
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
            employee: null
            tags: []
            questions: []
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
            employee: null
            tags: []
            questions: []
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
            tags: []
            questions: []
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
            tags: []
            questions: []
            employee:
              id: 2
              name: 'Luiz Freneda mapped [2]'
          }

      describe 'with a `to many` inner join', ->

        it 'should bind as expected', ->

          # console.log config.collapse.options

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
            questions: []
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
            employee: null,
            tags: []
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
            tags: []
            employee: null
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
            { id: 1, name: 'Task name 1 mapped', employee: null, tags: [], questions: [] }
            { id: 2, name: 'Task name 2 mapped', employee: null, tags: [], questions: [] }
            { id: 3, name: 'Task name 3 mapped', employee: null, tags: [], questions: [] }
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
              tags: []
              questions: []
            }
            {
              id: 2
              name: 'Task name 2 mapped'
              employee:
                id: 4
                name: 'Nicola Zagari mapped [2]'
              tags: []
              questions: []
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
              questions: []
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
              questions: []
            }
          ]
