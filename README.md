# KatyQuery
KatyQuery :microphone: is a Node.js 'n SQL utility library

## Installation

```shell
$ npm install katy-query
```

## Usage

### Query Generator

generates select query in KatyQuery format, so you can use result transformer

```javascript
QueryGenerator = require('katy-query').QueryGenerator
QueryGenerator.configure({
    table: 'tasks'
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
        ]
      },
      tags: {
        table: 'tags'
        sql: 'LEFT JOIN tasks_tags ON tasks_tags.taskId = tasks.id LEFT JOIN tags ON tasks_tags.tagId = tags.id'
        columns: [
          { name: 'id', alias: 'this.tags[].id' }
          { name: 'name', alias: 'this.tags[].name' }
        ]
      }
    }
  });
  
QueryGenerator.toSql('tasks', ['employee', 'tags']);
```


```
  SELECT 
    tasks.id "this.id",
    tasks.description "this.description",
    tasks.status "this.status",
    employees.id "this.employee.id",
    employees.name "this.employee.name",
    tags.id "this.tags[].id",
    tags.name "this.tags[].name"
  FROM
     tasks
   LEFT JOIN employees ON tasks.employeeId = employees.id
   LEFT JOIN tasks_tags ON tasks_tags.taskId = tasks.id
   LEFT JOIN tags ON tasks_tags.tagId = tags.id
  WHERE
    tasks.id = 15
```

### Result transformer 

binds record set result to javascript objects

```javascript
ResultTransfomer = require('katy-query').ResultTransfomer
task = ResultTransfomer.toModel recordSetResult
```

```
{
  id: 1,
  description: 'task description',
  status: 'done',
  employee: { 
    id: 2,
    name: 'Luiz Freneda'
  },
  tags: [
    { id: 3, name: 'katy' },
    { id: 4, name: 'query' }
  ]
}
```

#### Credits
named by [@maurogarcia](http://github.com/maurogarcia)
