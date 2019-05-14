# Eight reasons why you should be using RxJS (April 10, 2019)

## Index

0. [Preface](#0-preface)
1. [Observables are streams](#1-observables-are-streams)
1. [Extensive list of operators](#2-extensive-list-of-operators)
1. [Emission debouncing](#3-emission-debouncing)
1. [Emission replay](#4-emission-replay)
1. [Cancellation of subscriptions](#5-cancellation-of-subscriptions)
1. [Error catching](#6-error-catching)
1. [Retry on error](#7-retry-on-error)
1. [No callback hell](#8-no-callback-hell)

## 0. Preface

You might have asked yourself "why should I use RxJS?".  
You might even think "Promises work just fine; no need to change what is not broken".  
The intent of this article is to have readers thinking "I should use RxJS" by the time they have reached its bottom.

This is, by no means, an attempt to force an idea on others. This is an effort to expose the advantages of RxJS so that people realize it can potentially make their code cleaner and their lives easier.

Some of the reasons I listed, such as debouncing, cancellation, error catching, etc. are already available to promises and callbacks but they equire more code complexity and often additional libraries. RxJS provides such features in a clean, readable and easy to implement manner.

## 1. Observables are streams

[_"A stream is a sequence of data elements made available over time"_](<https://en.wikipedia.org/wiki/Stream_(computing)>).

If you are used to utilizing promises or something more obscure you will most likely implement code that is only run once and then succeed or fail.

[Observables](http://reactivex.io/rxjs/manual/overview.html#observable), on the other hand, are [data streams](https://en.wikipedia.org/wiki/Data_stream). They can keep emitting values and any [subscriptions](http://reactivex.io/rxjs/class/es6/Subscription.js~Subscription.html) will receive and process them separately at the time they each arrive.

_You can read about [reactive programming](https://en.wikipedia.org/wiki/Reactive_programming) to learn more about how this works._

In addition, there are two types of observables:

- Cold observables are [unicast](https://en.wikipedia.org/wiki/Unicast) so they return an independent execution of the observable on subscription.  
  These might be used when performing pure operations with changing arguments or non-pure operations such as fetching data from a server that might change with time.

- Hot observables are [multicast](https://en.wikipedia.org/wiki/Multicast) so they run by themselves and instead they register subscriptions in an internal list.  
  These might be used for continous streams, such as events, or pure operations with no arguments such as fetching master data from a server.
  - RxJS provides us with [subjects](http://reactivex.io/rxjs/manual/overview.html#subject), which are both observables and [observers](http://reactivex.io/rxjs/class/es6/MiscJSDoc.js~ObserverDoc.html). Additionally to plain subjects, we have some other implementations with added features:
    - [AsyncSubject](https://www.learnrxjs.io/subjects/asyncsubject.html): only emits its last value and only on completion.
    - [BehaviorSubject](https://www.learnrxjs.io/subjects/behaviorsubject.html): keeps track of the last emission and emits it's value to new subscription. If no emission occured yet, the initial value is emitted.
    - [ReplaySubject](https://www.learnrxjs.io/subjects/replaysubject.html): replays all emissions for late subscribers.

_Note:_ [some operators](http://reactivex.io/rxjs/manual/overview.html#multicasting-operators) return a multicast observable from a unicast observable but a first subscription to the original cold observable is required in order to generate the hot observable and get it running.

Subscriptions to observables are ignorant of whether the observable is unicast or multicast and make no difference on their implementation.

## 2. Extensive list of operators

[_"Operators are the essential pieces that allow complex asynchronous code to be easily composed in a declarative manner"_](http://reactivex.io/rxjs/manual/overview.html#operators).

RxJS presents [a lot of operators](http://reactivex.io/rxjs/manual/overview.html#categories-of-operators) that facilitate coding, including but not limited to most functions available to arrays.

_Example:_

```javascript
// observable
const range$ = range(1, 10);
```

```javascript
// subscription
range$
  .pipe(
    map(item => item * 10),
    filter(item => item % 20 === 0),
    reduce((accumulator, item) => accumulator + item),
    tap(sum => console.log(sum))
  )
  .subscribe();
```

_Output:_

```
300
```

The code is extremely readable on its own, but I will explain it nonetheless:

1. [`map`](https://www.learnrxjs.io/operators/transformation/map.html) emitted items to their values \* 10
2. [`filter`](https://www.learnrxjs.io/operators/filtering/filter.html) out items with values not multiple of 20
3. [`reduce`](https://www.learnrxjs.io/operators/transformation/reduce.html) items and sum their values into a single one
4. [`tap`](https://www.learnrxjs.io/operators/utility/do.html) the resulting item and log its value

Note: RxJS operators are [pure functions](https://en.wikipedia.org/wiki/Pure_function) so they do _not_ change the existing observable and instead [return a new one](http://reactivex.io/rxjs/manual/overview.html#what-are-operators-).

## 3. Emission debouncing

If we give the user a text input and subscribe to its changes we will get a stream that will emit for each valid keystroke but we usually will not care about any of these values except for the final one. One way to work around this is debouncing, which means discarding emissions until a set amount of time passed after the last one and then return that last one.

Additionally, thanks to operators, we can further thin out the emissions by discarding emissions of the same value and emissions not meeting a minimum character requirement.

_Example:_

```javascript
// subscription
searchObservable
  .pipe(
    debounceTime(500),
    distinctUntilChanged(),
    filter(search => search.length >= 3),
    tap(search => console.log(search))
  )
  .subscribe();
```

## 4. Emission replay

As [point 1](#1-observables-are-streams) mentions, it is likely that different parts of your application will query for the same master data and thanks to RxJS this does not mean sending multiple requests.

_Example:_

```javascript
// observable
const data$ = of('foo').pipe(
  tap(() => console.log(`data requested`)),
  shareReplay()
);
```

```javascript
// subscription #1
data$.pipe(tap(item => console.log(`retrieved ${item} on subscription #1`))).subscribe();
```

```javascript
// subscription #2
data$.pipe(tap(item => console.log(`retrieved ${item} on subscription #2`))).subscribe();
```

_Output:_

```
data requested
retrieved foo on subscription #1
retrieved foo on subscription #2
```

The data is being retrieved on multiple subscriptions yet it actually is only being requested once.

## 5. Cancellation of subscriptions

Some frameworks mount and unmount components based on their visibility or recreate them from scratch when changes occur.
When this happens, we can cancel all pending requests for those now nonexistent components.

_Example:_

```javascript
// datasource observable
const data$ = of('foo').pipe(
  tap(() => console.log(`request started`)),
  delay(500),
  tap(() => console.log(`request finished`))
);
```

```javascript
// stop observable
const stop$ = timer(250);
```

```javascript
// subscription #1
data$.subscribe({
  complete: () => console.log(`subscription #1 completed`)
});
```

```javascript
// subscription #2
data$.pipe(takeUntil(stop$)).subscribe({
  complete: () => console.log(`subscription #2 completed`)
});
```

_Output:_

```
request started
request started
subscription #2 completed
request finished
subscription #1 completed
```

The request is started for both independent executions of the observable but completes prematurely for subscription #2.  
This is due to stop\$ emitting before the observable's request finishes and its subscription being cancelled in reaction.

## 6. Error catching

RxJS allows you not only to catch errors but to recover from them too, by returning a fallback value.

_Example:_

```javascript
// observable
const data$ = of([0, 1, 2, 3, undefined, 5]).pipe(
  flatMap(value => (typeof value.includes(undefined) ? throwError(`Items cannot be empty.`) : of(value)))
);
```

```javascript
// subscription
data$
  .pipe(
    catchError(error => {
      console.error(error);
      return of([]); // [] is here the fallback value
    }),
    tap(val => console.log(val))
  )
  .subscribe();
```

_Output:_

```
Items cannot be empty.
[]
```

## 7. Retry on error

Easy to overlook and even easier to implement, RxJS provides us with the chance to retry on error.

Given the following observable:

```javascript
// observable
const data$ = from([0, 1, 2, 'foo']).pipe(
  flatMap(value => (typeof value !== 'number' ? throwError(`Value "${value}" is not a valid number.`) : of(value)))
);
```

...we can either simply retry n times:

_Example:_

```javascript
// subscription
range$
  .pipe(
    retry(3),
    tap(val => console.log(val), () => console.debug(`Ran out of retry attempts.`)),
    catchError(error => {
      console.error(error);
      return of(undefined);
    })
  )
  .subscribe();
```

_Output:_

```
0
1
2
0
1
2
0
1
2
0
1
2
Ran out of retry attempts.
Value "foo" is not a valid number.
```

...or retry after some conditions are met, thanks to an inner observable:

_Example:_

```javascript
// subscription
data$
  .pipe(
    retryWhen(error =>
      error.pipe(
        tap(error => console.error(error)),
        tap(() => console.debug('Retrying in 3s...')),
        delayWhen(() => timer(3000))
      )
    )
  )
  .subscribe();
```

_Output:_

```
Value "foo" is not a valid number.
Retrying in 3s...
Value "foo" is not a valid number.
Retrying in 3s...
Value "foo" is not a valid number.
Retrying in 3s...
[...]
```

## 8. No callback hell

Something both promises and callbacks are prone to introduce is known as [callback hell](http://callbackhell.com/). Nested operations can easily grow in complexity and lose readability and generally become messy.

Thanks to the [flatMap](https://www.learnrxjs.io/operators/transformation/mergemap.html) operator, things are much easier and cleaner with RxJS.

_Example:_

Lets say we have three endpoints. One returns the current user, another returns all user lists and a thir one returns all list items. If we want to, we can easily retrieve all this data _in a single subscription_, thanks to nested observables:

```javascript
// user observable
const user$ = of({ id: 0, name: 'User #1', listIds: [0, 1] });
```

```javascript
// lists observable
const lists$ = of([
  { id: 0, name: 'List #1', itemIds: [0, 1] },
  { id: 1, name: 'List #2', itemIds: [2, 3] },
  { id: 3, name: 'List #3', itemIds: [5] }
]);
```

```javascript
// items observable
const items$ = of([
  { id: 0, name: 'Item #1' },
  { id: 1, name: 'Item #2' },
  { id: 2, name: 'Item #3' },
  { id: 3, name: 'Item #4' },
  { id: 4, name: 'Item #5' }
]);
```

```javascript
// subscription

// get current user
user$
  .pipe(
    flatMap(user =>
      // retrieve all lists
      lists$.pipe(
        // rebuild user, adding those lists they own
        map(lists => ({
          ...user,
          lists: lists.filter(list => user.listIds.includes(list.id))
        }))
      )
    ),
    flatMap(user =>
      // retrieve all items
      items$.pipe(
        // rebuild user, adding to each one of their lists those items they include
        map(items => ({
          ...user,
          lists: user.lists.map(list => ({
            ...list,
            items: items.filter(item => list.itemIds.includes(item.id))
          }))
        }))
      )
    ),
    tap(value => console.log(value))
  )
  .subscribe();
```

As you can see, we add steps sequentially but we do not introduce endless nested code blocks and we do not need to deal with having _n_ number of callbacks or resolves within the same scope.

_Output:_

```javascript
{
  id: 0,
  name: 'User #1',
  listIds: [0, 1],
  lists: [
    {
      id: 0,
      name: 'List #1',
      itemIds: [0, 1],
      items: [
        { id: 0, name: 'Item #1' },
        { id: 1, name: 'Item #2' }
      ]
    },
    {
      id: 1,
      name: 'List #2',
      itemIds: [2, 3],
      items: [
        { id: 2, name: 'Item #3' },
        { id: 3, name: 'Item #4' }
      ]
    }
  ]
}
```

## Bonus

You made it this far so hopefully you are at least somewhat interested in RxJS. If that is indeed the case you might want to check out the following list, containing the operators I deem the most commonly useful:

- Creation
  - [from](https://www.learnrxjs.io/operators/creation/from.html): creates an observable based on the parameter passed. If the parameter is iterable, an emission will occur per item.
  - [of](https://www.learnrxjs.io/operators/creation/of.html): creates an observable based on the parameters passed. An emission will occur per parameter.
  - [throwError](https://www.learnrxjs.io/operators/creation/throw.html): returns an observable that emits the passed error on subscription.
- Error Handling
  - [catchError](https://www.learnrxjs.io/operators/error_handling/catch.html): catches errors and returns fallback values based on the passed function.
- Filtering
  - [debounceTime](https://www.learnrxjs.io/operators/filtering/debouncetime.html): discard emissions until a set amount of time passed after the last one and then return that last one.
  - [distinctUntilChanged](https://www.learnrxjs.io/operators/filtering/distinctuntilchanged.html): discard emissions for values matching the last one.
  - [filter](https://www.learnrxjs.io/operators/filtering/filter.html): filter emissions based he passed function.
  - [takeUntil](https://www.learnrxjs.io/operators/filtering/takeuntil.html): stop emitting after the given observable emits.
- Multicasting
  - [shareReplay](https://www.learnrxjs.io/operators/multicasting/sharereplay.html): replay specified number of emissions on subscription (or indefinitely if no number passed).
- Transformation
  - [map](https://www.learnrxjs.io/operators/transformation/map.html): transform editions based on the passed function.
  - [mergeMap / flatMap](https://www.learnrxjs.io/operators/transformation/mergemap.html): subscribes to an inner observable and emits the returned values.
  - [reduce](https://www.learnrxjs.io/operators/transformation/reduce.html): reduce emissions into a single one based on the passed function.
- Utility
  - [tap](https://www.learnrxjs.io/operators/utility/do.html): performs side-effect operations on each emission.
