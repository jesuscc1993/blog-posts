# Eight reasons why you should be using RxJS

## Index

0. [Preface](#-0.-preface)
1. [Observables are streams](#-1.-observables-are-streams)
1. [Extensive list of operators](#-2.-extensive-list-of-operators)
1. [Emission debouncing](#-3.-emission-debouncing)
1. [Emission replay](#-4.-emission-replay)
1. [Cancellation of subscriptions](#-5.-cancellation-of-subscriptions)
1. [Error catching](#-6.-error-catching)
1. [Retry on error](#-7.-retry-on-error)
1. [Multicasting](#-8.-multicasting)

## 0. Preface

You might have asked yourself "why should I use RxJS?".  
You might even think "Promises work just fine; no need to change what is not broken".  
The intent of this article is to have readers thinking "I should use RxJS" by the time they have reached its bottom.

This is, by no means, an attempt to force an idea on others. This is an effort to expose the advantages of RxJS so that people realize it can potentially make their code cleaner and their lives easier.

## 1. Observables are streams

[_"A stream is a sequence of data elements made available over time"_](<https://en.wikipedia.org/wiki/Stream_(computing)>).

If you are used to utilizing promises or something more obscure you will most likely implement code that is only run once and then succeed or fail.

[Observables](http://reactivex.io/rxjs/manual/overview.html#observable), on the other hand, are [data streams](https://en.wikipedia.org/wiki/Data_stream). As long as a subscription exist to an observable, the latter can keep emitting values and the former will receive and process them separately at the time they each arrive.  
You can read about [reactive programming](https://en.wikipedia.org/wiki/Reactive_programming) to learn more about how this works.

## 2. Extensive list of operators

[_"Operators are the essential pieces that allow complex asynchronous code to be easily composed in a declarative manner"_](http://reactivex.io/rxjs/manual/overview.html#operators).

RxJS presents [a lot of operators](http://reactivex.io/rxjs/manual/overview.html#categories-of-operators) that facilitate coding, including but not limited to most functions available to arrays. e.g.:

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

The code is extremely readable on its own, but I will explain it nonetheless:

1. [`map`](https://www.learnrxjs.io/operators/transformation/map.html) emitted items to their values \* 10
2. [`filter`](https://www.learnrxjs.io/operators/filtering/filter.html) out items with values not multiple of 20
3. [`reduce`](https://www.learnrxjs.io/operators/transformation/reduce.html) items and sum their values into a single one
4. [`tap`](https://www.learnrxjs.io/operators/utility/do.html) the resulting item and log its value

Note: RxJS follows the [functional programming](https://en.wikipedia.org/wiki/Functional_programming) paradigm so operators do _not_ change the existing observable and instead [return a new one](http://reactivex.io/rxjs/manual/overview.html#what-are-operators-).

## 3. Emission debouncing

If we give the user a text input and subscribe to its changes we will get a stream that will emit for each valid keystroke but we usually will not care about any of these values except for the final one. One way to work around this is debouncing, which means discarding emissions until a set amount of time passed after the last one and then return that last one.

Additionally, thanks to operators, we can further thin out the emissions by discarding emissions of the same value and emissions not meeting a minimum character requirement. e.g.:

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

Unless you are using stores, it is quite likely that different parts of your application will query for the same data.
Thanks to observables, though, this does not mean sending multiple requests. e.g.:

```javascript
// observable
const data$ = of('foo').pipe(
  tap(() => console.log(`data requested`)),
  shareReplay()
);
```

```javascript
// subscription #1
data$
  .pipe(tap(item => console.log(`retrieved ${item} on subscription #1`)))
  .subscribe();
```

```javascript
// subscription #2
data$
  .pipe(tap(item => console.log(`retrieved ${item} on subscription #2`)))
  .subscribe();
```

The data is being retrieved on multiple subscriptions yet it actually is only being requested once.

## 5. Cancellation of subscriptions

Some frameworks mount and unmount components based on their visibility or recreate them from scratch when changes occur.
When this happens, we can cancel all pending requests for those now nonexistent components. e.g:

Take these observables:

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
const stop$ = of(true).pipe(delay(250));
```

...and these two subscriptions:

```javascript
// subscription #1
data$.subscribe();
```

```javascript
// subscription #2
data$.pipe(takeUntil(stop$)).subscribe();
```

The request is started for both independent executions of the observable but only finishes for subscription #1.  
This is due to stop\$ emitting before the request finishes for subscription #2 and its subscription being cancelled in reaction.

## 6. Error catching

RxJS allows you not only to catch errors but to recover from them too, by returning a fallback value. e.g:

```javascript
// observable
const data$ = of([0, 1, 2, 3, undefined, 5]).pipe(
  flatMap((value) =>
    typeof value.includes(undefined)
      ? throwError(`Items cannot be empty.`)
      : of(value)
  )
);
```

```javascript
// subscription
data$
  .pipe(
    tap(val => console.log(val)),
    catchError(error => {
      console.error(error);
      return of([]); // [] is here the fallback value
    })
  )
  .subscribe();
```

## 7. Retry on error

Easy to overlook and even easier to implement, RxJS provides us with the chance to retry on error. e.g:

Given the following observable:

```javascript
// observable
const data$ = from([0, 1, 2, 'foo']).pipe(
  flatMap(value =>
    typeof value !== 'number'
      ? throwError(`Value "${value}" is not a valid number.`)
      : of(value)
  )
);
```

...we can either simply retry n times:

```javascript
// subscription
range$
  .pipe(
    retry(3),
    tap(
      val => console.log(val),
      () => console.debug(`Run out of retry attempts.`)
    ),
    catchError(error => {
      console.error(error);
      return of(undefined);
    })
  )
  .subscribe();
```

...or retry after some conditions are met, thanks to an inner observable:

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

## 8. Multicasting

There are two types of observables, depending on how they handle subscription.

So far we have only covered plain observables, which are unicast (there are, though, [some operators](http://reactivex.io/rxjs/manual/overview.html#multicasting-operators) like the [shareReplay](https://www.learnrxjs.io/operators/multicasting/sharereplay.html) we covered that return a multicast observable from a unicast observable). Subscribing to these observables returns an independent execution of the observable.

The other type are [subjects](http://reactivex.io/rxjs/manual/overview.html#subject), which are both observables and [observers](http://reactivex.io/rxjs/class/es6/MiscJSDoc.js~ObserverDoc.html). Subscribing to these observables simply registers the given subscription in a list internal to the subject.

Subscriptions to observables are ignorant of whether the observable is unicast or multicast and make no difference on their implementation.
