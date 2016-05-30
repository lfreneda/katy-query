# KatyQuery
:microphone: KatyQuery is a query generator and binder to javascript models 

Generator generates queries in Katy queries format:

```
  SELECT 
    tasks.id "this.id",
    tasks.description "this.description",
    tasks.status "this.status",
    employees.id "this.employee.id",
    employees.name "this.employee.name"
  FROM
    tasks
  INNER JOIN 
    employees ON tasks.employeeId = employees.id
  WHERE
    tasks.id = 15
```

Binders binds result set from Katy queries format to javascript objects:

```
{
  id: 1,
  description: 'task description',
  status: 'done',
  employee: { 
    id: 2,
    name: 'Luiz Freneda'
  }
}
```

named by [@maurogarcia](http://github.com/maurogarcia)
