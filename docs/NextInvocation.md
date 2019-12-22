`element(by.text('tapMe')).tap();`

```json
{
   type: "action",
   action: "tap",
   predicate: 
     {
      type: "text",
      value: "Tap Me"
     }
}
```

`element(by.id('uniqueId').and(by.text('some text'))).tap();`

```json
{
 type: "action",
 action: "tap",
 predicate: {
 	type: "and",
 	predicastes: [
		 { 
		   type: "id",
		   value: "uniqueId"
		 }, 
		 {
		   type: "text",
		   value: "some text"
		 }
		 ]
 }
}
```

`element(by.id('child').withAncestor(by.id('parent'))).tap();`

```json
{
 type: "action",
 action: "tap",
 predicate: { 
     type: "and", 
     predicates: [
 		{ 
   		type: "id",
   		value: "child"
 		}, 
		{
		  type: "ancestor",
		  value: 
		  { 
  			type: "id",
  			value: "parent"
  			}
		}
 		]
 	}
}
```

`await element(by.id('tappable')).tapAtPoint({x:5, y:10});`


```json
{
   type: "action",
   action: "tapAtPoint",
   params: [{x:5, y:10}]
   predicate: 
     {
      type: "id",
      value: "tappable"
     }
   
}
```


`await expect(element(by.text('Tap Working!!!'))).toBeVisible();`


`await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');`


`await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');`




Matchers






```json
{
    matchers: [
        matchers
    ],
    action: {
        type: while,
        params: [
            {
                matchers: [
                    matchers
                ],
                assertion: {
                    modifier: not,
                    type: visible
                }
            },
            {
                action: {
                    type: scroll,
                    params: [
                        50,
                        'down'
                    ]
                }
            }
        ]

    }
}
```
