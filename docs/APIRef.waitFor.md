# waitFor
Test async code with waitFor. 


- [`.toBeVisible()`](#tobevisible)
- [`.toBeNotVisible()`](#tobenotvisible)
- [`.toExist()`](#toexist)
- [`.toNotExist()`](#tonotexist)
- [`.toHaveText()`](#tohavetexttext)
- [`.toHaveId()`](#tohaveidid)


- [`.withTimeout()`](#withtimeout)
- [`.whileElement()`](#whileelement)






### `withTimeout()`
Waits for the condition to be met until the specified @c seconds have elapsed

```js
await waitFor(element(by.id('UniqueId336'))).toExist().withTimeout(2000);
```


### `whileElement()`
Performs the @c action repeatedly on the the element matching the @c matcher until the element to interact with
 
```js
await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
```