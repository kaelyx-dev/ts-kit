# Query strings

`toQueryString` and `fromQueryString` are thin wrappers around `URLSearchParams`. They work
with flat objects only. The output is a standard URL-encoded query string, so other software
can read it.

```ts
import { fromQueryString, toQueryString } from '@kaelyx/ts-kit/object'

toQueryString({ q: 'red shoes', page: 2, tags: ['new', 'sale'] })
// 'q=red+shoes&page=2&tags=new&tags=sale'

fromQueryString('q=red+shoes&page=2&tags=new&tags=sale')
// { q: 'red shoes', page: '2', tags: ['new', 'sale'] }
```

## How values are written

| Input value | `toQueryString` writes |
| --- | --- |
| A string | The string |
| A number or a boolean | `String(value)`, for example `2` or `true` |
| `null` | An empty string: `a=` |
| `undefined` | Nothing. The key is omitted. |
| A date | An ISO string. An invalid date throws a `RangeError`. |
| An array | One key for each item: `tags=new&tags=sale`. `undefined` items are omitted. |

## How values are read

| Query string | `fromQueryString` returns |
| --- | --- |
| `a=1` | `{ a: '1' }`. Values are always strings. |
| `a=` or `a` | `{ a: '' }` |
| `tags=new&tags=sale` | `{ tags: ['new', 'sale'] }` |
| `a.b=1` or `a[b]=1` | `{ 'a.b': '1' }` or `{ 'a[b]': '1' }`. Keys are not split. |

A leading `?` is removed. The keys `__proto__` and `constructor` become normal properties of the
result. They do not change its prototype.

## Round trips

`fromQueryString(toQueryString(value))` does not always give `value` back. These values change:

- Numbers, booleans and dates come back as strings. Convert them in your code.
- `null` comes back as `''`.
- An array with one item comes back as its item: `{ tags: ['a'] }` gives `{ tags: 'a' }`.
- An empty array is omitted.

If you need nested objects or exact types, write the value with `JSON.stringify` and put the
result in one key:

```ts
const query = toQueryString({ filters: JSON.stringify({ size: 9, colours: ['red'] }) })
const filters = JSON.parse(fromQueryString(query).filters as string)
```

## Other software

Repeated keys are the most common way to write a list in a query string. Node.js
(`URLSearchParams.getAll`), Express, Spring, ASP.NET, Django, Flask, FastAPI and Go read them as
a list. PHP and Rails keep only the last value. They expect `tags[]=new&tags[]=sale`.
