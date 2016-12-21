"use strict";
//return;
const Rx = require("rx");
const chai = require("chai");
const chaiRx = require("chai-rx");
chai.use(chaiRx.default);
chai.should();

const marbles = require("./marbles.js");
const values = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7};
describe("again but with tests", function () {
    it("should be possible to take only the firsts elements of a stream", function () {
        //The stream should take only the first two elements and terminate.
        const source = "ab---cde|";
        const target = "a(b|)";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, values));
    });
    it("should become 10x the original values using map", function () {
        //Elements should be transformed one by one.
        const mapper = (i) => i * 10;
        const source = "abcde|";
        const target = "ABCDE|";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, {A: 10, B: 20, C: 30, D: 40, E: 50}));
    });
    it("should be possible to convert an element to a series of elements", function () {
        //Elements should be transformed each to many elements.
        //combining [1,2,3,4,5] with [10, 20] should become [11, 12, 13, 14, 15, 21, 22, 23, 24, 25 ]
        const source1 = "abcde|";
        const multiplier = x => Rx.Observable.from([10,20]).map(y=> x+y);
        const target  = "ABCDE|";
        const scheduler = new Rx.TestScheduler();
        const rx = marbles.hotWith(scheduler, source1, values);
        const res = scheduler.startScheduler(() => rx/*change here*/);
        return res.should.emit(marbles.from(target, {A: [ 11, 21 ], B: [ 12, 22 ], C: [ 13, 23 ], D: [ 14, 24 ], E: [ 15, 25 ]}));
      });
    it("[1, 2, 3, 4, 5] should be [2, 4] with odd numbers filtered out", function () {
        // The goal is to filter the stream to let only multiples of 2 pass.
        const source = "abcde|";
        const result = "-b-d-|";
        const oddFilter = (i) => i % 2 === 0;
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(result, values));
    });
    it("should be possible to emit statistics at the end : sum - easy", function () {
        //Each element of the flow should be summed with the previous one.
        const source = "abcde|";
        const target = "-----(S|)";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, {S: 15}));
    });
    it("should be possible to emit statistics at the end : mean - less easy", function () {
        //In this case, scanning the flow won't be enough the accumulator can't be a single value.
        const source = "abcde|";
        const target = "-----(M|)";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(
          () => xs/*change here*/
          );
        return res.should.emit(marbles.from(target, {M: 3}));
    });
    it("should be possible to emit statistics as soon as data come : sum - easy", function () {
        //Each element of the flow should be summed with the previous one.
        const source = "abcde";//notice the Observable never end
        const target = "ABCDE";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, {A: 1, B: 3, C: 6, D: 10, E: 15}));
    });
    it("should be possible to emit statistics as soon as data come : mean - less easy", function () {
        //In this case, scanning the flow won't be enough the accumulator can't be a single value.
        const source = "abcde";//notice the Observable never end
        const target = "ABCDE";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(
          () => xs/*change here*/);
        return res.should.emit(marbles.from(target, {A: 1, B: 1.5, C: 2, D: 2.5, E: 3}));
    });
    it("should be possible to recover from errors", ()=>{
      const source= "abcd|";
      const target="-b-d|";
      const scheduler = new Rx.TestScheduler();
      const act = v => ((v % 2) == 0 ? Rx.Observable.just(v) : Rx.Observable.throw())  ;
      const xs = marbles.hotWith(scheduler, source, values);
      const res = scheduler.startScheduler(() => xs/*change here*/);
      return res.should.emit(marbles.from(target,values));
    });
});

describe("and other things", function () {
    describe("various filters", function () {
      it("should be possible to be interested only on the completion", function () {
        const failingSource = "a-b--c-!";
        const failingTarget = "-------!";
        const workingSource = "a-b--c-d|";
        const workingTarget = "--------|";
        function observableOf(source){
          const scheduler = new Rx.TestScheduler();
          const xs = marbles.hotWith(scheduler, source, values);
          return scheduler.startScheduler(() => xs/*change here*/);
        }
        const workingRes = observableOf(workingSource);
        const failingRes = observableOf(failingSource);

        return [
          workingRes.should.emit(marbles.from(workingTarget, {})),
          failingRes.should.emit(marbles.from(failingTarget, {}))
        ];
      });
      it("should be possible to take only the first element", function () {
          const source = "abcde|";
          const target = "(a|)";
          const scheduler = new Rx.TestScheduler();
          const items = marbles.hotWith(scheduler, source, values);
          const res = scheduler.startScheduler(() => items/*change here*/);
          return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take only the first 3 elements", function () {
        const source = "abcde|";
        const target = "ab(c|)";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take the elements while a predicate is satisfied", function () {
        const source = "abcde|";
        const target = "ab|";
        const predicate = a => a % 3 !==0
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take the elements until an observable emits something", function () {
        const source = "abcde|";
        const emiter = "---a-|"
        const target = "abc(d|)";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const emiterxs = marbles.hotWith(scheduler, emiter, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take all elements except the first 3", function () {
        const source = "abcde|";
        const target = "---de|";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take only the last element", function () {
        const source = "abcde|";
        const target = "-----(e|)";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take only the last 3 elements", function () {
        const source = "abcde|";
        const target = "-----(cde|)";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take the elements after a predicate is not satisfied", function () {
        const source = "abcdef|";
        const target = "--cdef|";
        const predicate = a => a % 3 !==0
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to skip the elements until an observable emits something", function () {
        const source = "abcde|";
        const emiter = "--a---"
        const target = "---de|)";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const emiterxs = marbles.hotWith(scheduler, emiter, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take all elements except the last 3", function () {
        const source = "abcd-e|";
        const target = "---a-b|";//note elements are emited as soon as 3 other elements are availlable to ignore
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take the latest elements from a stream when another emits", function () {
        const source = "abc--defg|";
        const emiter = "-aaa---aa-|"
        const target = "-bc----fg-|";//note the completion is seen as an element
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const emiterxs = marbles.hotWith(scheduler, emiter, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take only distinct elements", function () {
        const source = "abaae|";
        const target = "ab--e|";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
    });
    describe("checks", function () {
      it("should be possible to check if all match a condition", function () {
        // We can check that all events on source match a predicate
        const matchingSource = "ace|";
        const matchingTarget = "---(T|)";
        const failingSource = "abc";
        const failingTarget = "-(F|)";
        const predicate = (x) => x % 2 === 1 ;

        function observableOf(source){
          const scheduler = new Rx.TestScheduler();
          const xs = marbles.hotWith(scheduler, source, values);
          return scheduler.startScheduler(() => xs/*change here*/);
        }
        const matchingRes = observableOf(matchingSource);
        const failingRes = observableOf(failingSource);
        return [
          matchingRes.should.emit(marbles.from(matchingTarget, {T: true, F:false})),
          failingRes.should.emit(marbles.from(failingTarget, {T: true, F:false}))
        ];
      });
      it("should be possible to verify presence", function () {
        // We can check that all events on source match a predicate
        // Note: The documentation is false for this one. Ask or check with the solution for this one
        const matchingSource = "abcde|";
        const matchingTarget = "---(T|)";
        const failingSource  = "abc-e|";
        const failingTarget  = "-----(F|)";
        const value = values.d ;

        function observableOf(source){
          const scheduler = new Rx.TestScheduler();
          const xs = marbles.hotWith(scheduler, source, values);
          return scheduler.startScheduler(() => xs/*change here*/);
        }
        const matchingRes = observableOf(matchingSource);
        const failingRes = observableOf(failingSource);
        return [
          matchingRes.should.emit(marbles.from(matchingTarget, {T: true, F:false})),
          failingRes.should.emit(marbles.from(failingTarget, {T: true, F:false}))
        ];
      });
    });
    describe("grouping", function () {
      it("should be possible to package items by packages of 3", function () {
        //Elements should be put in arrays with a count of 3 elements.
        const source = "abcde|";
        const target = "--A--(B|)";
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, {A: [[1, 2, 3]], B: [[4, 5]]}));
      });
      it("should be possible to group items, do an action on subgroups and merge them", function () {
        // the grouping materializes by emiting Observables of elements.
        // tip: versions exists for spliting stream, durations and predicates for sub-Observables start and termination.
        const source = "abcdef|";
        const result = "------(AB|)"; // (A = a+c+e , B= b+d+f )
        const sorter = (x) => x % 2;
        const sumer = (o) => o.sum();
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(result, {A: 9, B: 12}));
      });
      it("should be possible to group items on a time window instead and do a sum on each sub-Observable",()=>{
        // the grouping materializes by emiting Observables of elements.
        // tip: Observable.sum() exists among other shortcuts for math aggregates
        // tip: versions exists for count, durations and predicates for sub-Observables start and termination.
        const eventSource = "aaaaaa|";// a=1
        const splitSource = "-a--a-|";
        const eventResult = "-b--c-(a|)"; // b= 2, d=4, notice the end of the stream also splits
        const scheduler = new Rx.TestScheduler();
        const eventXs = marbles.hotWith(scheduler, eventSource, values);
        const splitXs = marbles.hotWith(scheduler, splitSource, values);
        const res = scheduler.startScheduler(() => eventXs/*change here*/);
        return res.should.emit(marbles.from(eventResult, values));
      });
    });
    describe("priming and consolation prizes", function () {
      it("should be possible to receive at least one element", function () {
        //Elements should be put in arrays with a count of 3 elements.
        const source = "-----|";
        const target = "-----(a|)";
        const defaultValue = 1;
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to prime an Observable with selected elements", function () {
        //Elements should be put in arrays with a count of 3 elements.
        const source = "-------def|";
        //const defaultValue = 1,2,3;
        const scheduler = new Rx.TestScheduler();
        const items = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => items/*change here*/);
        return res.should.emit(marbles.immediately(1,2,3).andThen("-------def|", values));
      });
      it("should be possible to resubscribe if an error occurs", function () {
      const source = "a-b!-c-|";
      const target = "a-b--c-|";
      const scheduler = new Rx.TestScheduler();
      const xs = marbles.hotWith(scheduler, source, values);
      const res = scheduler.startScheduler(() => xs/*change here*/);
      return res.should.emit(marbles.from(target, values));
    });
    });
    describe("combining Observables", function (){
      it("should be possible to combine an element from each Observable to construct an element", function () {
        // In this case, we wan a+d, b+e and c+f on the resulting Observable.
        const source1 = "ab--c";
        const source2 = "-def";
        const target  = "-AB-C";
        const mapper  = (a, b) => a + b;
        const scheduler = new Rx.TestScheduler();
        const firsts = marbles.hotWith(scheduler, source1, values);
        const seconds = marbles.hotWith(scheduler, source2, values);
        const res = scheduler.startScheduler(() => Rx.Observable.empty()/*change here*/);
        return res.should.emit(marbles.from(target, {A: 5, B: 7, C: 9}));
      });
      it("should be possible to create an element from the latest element from both Observables ", function () {
        // In this case, we wan a+d, b+d, b+e,... on the resulting Observable.
        const source1 = "a-b--c";
        const source2 = "-d-e-f";
        const target  = "-ABC-(DE)";
        const mapper  = (a, b) => a + b;
        const scheduler = new Rx.TestScheduler();
        const firsts = marbles.hotWith(scheduler, source1, values);
        const seconds = marbles.hotWith(scheduler, source2, values);
        const res = scheduler.startScheduler(() => Rx.Observable.empty()/*change here*/);
        return res.should.emit(marbles.from(target, {A: 5, B: 6, C: 7, D: 8, E: 9}));
      });
      it("should be possible to have merged as they come", function () {
        //Here, we will just need the elements to appear on the result at the same time they arrive on the sources.
        const source1 = "a----(de)";
        const source2 = "b---c----f";
        const target  = "(ab)c(de)f";
        const scheduler = new Rx.TestScheduler();
        const firsts = marbles.hotWith(scheduler, source1, values);
        const seconds = marbles.hotWith(scheduler, source2, values);
        const res = scheduler.startScheduler(() => Rx.Observable.empty()/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to take the first source answering", function () {
        //Here we want to use events from the same source as the one answering first.
        const fastestMarbles = "--a-b-----c|";
        const slowestMarbles = "---d-e-f|";
        const targetMarbles  = "--a-b-----c|";
        const scheduler = new Rx.TestScheduler();
        const fastest = marbles.hotWith(scheduler, fastestMarbles, values);
        const slowest = marbles.hotWith(scheduler, slowestMarbles, values);
        const res = scheduler.startScheduler(() => Rx.Observable.empty()/*change here*/);
        return res.should.emit(marbles.from(targetMarbles, values));
      });
      it("should be possible to switch to another Observable when the first one finishes", ()=>{
        // When finishingSource finishes (|) another Observable can provide elements.
        const finishingSource  = "ab----|";
        const fallbacksource = "e-f|"; //cold, the hot example is in the error fallback test.
        const targetMarbles  = "ab-----e-f|";//notice how the cold events keep the time differential
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, finishingSource, values);
        const fallback = marbles.coldWith(scheduler, fallbacksource, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(targetMarbles, values));
      });
      it("should be possible to use another source when an error occurs", function () {
        // When failingsource ends up in error (!) another Observable can provide elements.
        const failingsource  = "ab!";
        const fallbacksource = "cdef|"; //hot
        const targetMarbles  = "abef|";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, failingsource, values);
        const fallback = marbles.hotWith(scheduler, fallbacksource, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(targetMarbles, values));
      });
      it("should be possible to compare their sequences", function () {
        // there is an operator that checks two Observables elements contains the same elements in the same order.
        const source1 = "a--b----c-d|";
        const source2 = "--a-b-c--d--|";
        const target  = "------------(T|)";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source1, values);
        const other = marbles.hotWith(scheduler, source2, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, {T: true}));
      });
      // at the end chack join and switch that are not as test friendly
    });
    describe("time stuff", function (){
      // don't forget to pass the TestScheduler to time operators, otherwise these tests would fail
      it("should be possible to delay elements for a miliseconds value", function () {
        const source = "abc";
        const target  = "-abc";
        const delayValue = 1;
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to delay elements for a the time of an observable", function () {
        /// no need to pass the scheduler here
        const source = "abc";
        const delay  = "---e";
        const target = "----abc";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const delayxs = marbles.coldWith(scheduler, delay, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, values));
      });
      it("should be possible to count the time between elements", function () {
        const source = "a-bc";
        const target  = "A-BC";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, {A: {value:1, interval: 1},B: {value:2, interval: 2},C: {value:3, interval: 1}}));
      });
      it("should be possible to add the emission time to elements", function () {
        const source = "a-bc";
        const target  = "A-BC";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);
        const res = scheduler.startScheduler(() => xs/*change here*/);
        return res.should.emit(marbles.from(target, {A: {value:1, timestamp: 201},B: {value:2, timestamp: 203},C: {value:3, timestamp: 204}}));
      });
      //If you still have time, take a look at timeout and debounce. Thoses are not as test friendly
    });
});
