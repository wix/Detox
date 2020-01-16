`element(by.text('tapMe')).tap();`


```json
{
  "type": "action",
  "action": "tap",
  "predicate": {
    "type": "text",
    "value": "Tap Me"
  }
}

```

`element(by.id('uniqueId').and(by.text('some text'))).tap();`

```json
{
  "type": "action",
  "action": "tap",
  "predicate": {
    "type": "and",
    "predicates": [
      {
        "type": "id",
        "value": "uniqueId"
      },
      {
        "type": "text",
        "value": "some text"
      }
    ]
  }
}
```

`element(by.id('child').withAncestor(by.id('parent'))).tap();`

```json
{
  "type": "action",
  "action": "tap",
  "predicate": {
    "type": "and",
    "predicates": [
      {
        "type": "id",
        "value": "child"
      },
      {
        "type": "ancestor",
        "value": {
          "type": "id",
          "value": "parent"
        }
      }
    ]
  }
}
```

`element(by.id('child').withAncestor(by.id('parent').and(by.text('text')))).tap();`
```json
{
  "type": "action",
  "action": "tap",
  "predicate": {
    "type": "and",
    "predicates": [
      {
        "type": "id",
        "value": "child"
      },
      {
        "type": "ancestor",
        "value": {
          "type": "and",
             "predicates": [
                {
                  "type": "id",
                  "value": "parent"
                },
                {
                  "type": "text",
                  "value": "text"   
                }
             ]
        }
      }
    ]
  }
}
```


`await element(by.id('tappable')).tapAtPoint({x:5, y:10});`


```json
{
  "type": "action",
  "action": "tapAtPoint",
  "params": [
    {
      "x": 5,
      "y": 10
    }
  ],
  "predicate": {
    "type": "id",
    "value": "tappable"
  }
}
```


`await expect(element(by.text('Tap Working!!!'))).toBeVisible();`

```json
{
  "type": "expectation",
  "predicate": {
    "type": "text",
    "value": "Tap Working!!!"
  },
  "expectation": "toBeVisible"
}
```

`await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');`

```json
{
  "type": "expectation",
  "predicate": {
    "type": "id",
    "value": "UniqueId204"
  },
  "expectation": "toHaveText",
  "params": ["I contain some text"]
}
```

`await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');`

```json
{
      "type": "action",
      "action": "scroll",
      "params": [50, "down"],
      "predicate": {
         "type": "id",
         "value": "scrollView630"
      },
      "while": {
            "type": "expectation",
            "predicate": {
              "type": "text",
              "value": "Text5"
            },
            "expectation": "toBeVisible"
      }      
  }
```
