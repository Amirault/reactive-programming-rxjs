"use strict";
return; 
const Rx = require("rx");

const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;
const onError = Rx.ReactiveTest.onError;

const chai = require("chai");
const chaiRx = require("chai-rx");
chai.use(chaiRx.default);
chai.should();
const marbles = require("./marbles.js");

const values = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7};
//const describe = ()=> {};
describe("Is this hot or not", function () {
    it("should be obvious that hot and cold Observables have different concat behaviors as hot", function () {
        const firstSource = "abcd|";
        const otherSource = "--g-ef|";
        const target      = "abcdef|";
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, firstSource, values);
        const other = marbles.hotWith(scheduler, otherSource, values);
        const res = scheduler.startScheduler(() => xs.concat(other));
        return res.should.emit(marbles.from(target, values));
    });
    it("should be obvious that hot and cold Observables have different concat behaviors as cold", function () {
        const firstSource = "abcd|";
        const otherSource = "--g-ef|";
        const target      = "abcd---g-ef|";
        const schedulerCold = new Rx.TestScheduler();
        const xsCold = marbles.hotWith(schedulerCold, firstSource, values);
        const otherCold = marbles.coldWith(schedulerCold, otherSource, values);
        const resCold = schedulerCold.startScheduler(() => xsCold.concat(otherCold));
        return resCold.should.emit(marbles.from(target, values));
    });
});

describe("Observables", function () {
    it("should be possible to create Observables from Promises", function () {
        // In this exercise, the goal is to create an Observables from a promise
        const schedulerE = new Rx.TestScheduler();
        const schedulerS = new Rx.TestScheduler();

        const rxE = schedulerE.createRejectedPromise(201, new Error());
        const rxS = schedulerS.createResolvedPromise(201, 1);

        const rejected = schedulerE.startScheduler(() => Rx.Observable.fromPromise(rxE, schedulerE));
        const resolved = schedulerS.startScheduler(() => Rx.Observable.fromPromise(rxS, schedulerS));

        return [//TODO 202 ? is that a bug in TestScheduler?
            rejected.should.emit([onError(202, new Error())]),
            resolved.should.emit([onNext(202, 1), onCompleted(202)])
        ];
    });
    it("can be created from Arrays", function () {
        const source = Rx.Observable.from(["element", 3, "stuff"]);
        return marbles.toArray(source).should.be.deep.equal(["element", 3, "stuff", "Completed"]);
    });
    it("can be created from Single items", function () {
        const source = Rx.Observable.just("element");
        return marbles.toArray(source).should.be.deep.equal(["element", "Completed"]);
    });
});
describe("Observers", function () {
    it("is possible to wait for values and act on them", function () {
      //call resolve when a value comes from the object.
      return new Promise(function (resolve, reject) {
        const source = Rx.Observable.just("A");
        source.subscribe(
          (x) => resolve("Next: % s", x),
          (err) => reject("Error: " + err),
          () => reject("Completed")
        );
      });
    });
    it("is possible to wait for completion and act on them", function () {
      //call resolve when the Observable is completed
      return new Promise(function (resolve, reject) {
        const source = Rx.Observable.empty();
        source.subscribe(
          (x) => reject("Next: % s", x),
          (err) => reject("Error: " + err),
          () => resolve("Completed")
        );
      });
    });
    it("is possible to wait for values and act on them", function () {
      //call resolve when the stream closes because of an error
        return new Promise(function (resolve, reject) {
          const source = Rx.Observable.throw("A");
          source.subscribe(
              (x) => reject("Next: % s", x),
              (err) => resolve("Error: " + err),
              () => reject("Completed")
          );
    });
  });
});
describe("Subjects", function () {
    it("is possible to use forward events to observers", function () {
        const subject = new Rx.Subject();
        const subjectEvents = [];
        subject.onNext("a");
        subject.onNext("b");
        subject.subscribe((e) => subjectEvents.push(e));
        subject.onNext("c");
        subject.onNext("d");
        return subjectEvents.should.be.deep.equal(["c", "d"]);
    });
    it("is possible to use them as both observers and observables", function () {
        const source = Rx.Observable.from(["element", 3, "stuff"]);
        const subject = new Rx.Subject();
        const subjectEvents = [];
        subject.subscribe((e) => subjectEvents.push(e));
        source.subscribe(subject);
        return subjectEvents.should.be.deep.equal(["element", 3, "stuff"]);
    });
    it("is possible to use forward events previous and future to observers", function () {
        const replaysubject = new Rx.ReplaySubject(40 /* buffer size */);
        const replayEvents = [];
        replaysubject.onNext("a");
        replaysubject.onNext("b");
        replaysubject.subscribe((e) => replayEvents.push(e));
        replaysubject.onNext("c");
        replaysubject.onNext("d");
        return replayEvents.should.be.deep.equal(["a", "b", "c", "d"]);
    });
    it("is possible to make sure there is always an event in store.", function () {
        const subject = new Rx.BehaviorSubject("No one here but us trees");
        const atfirstEvents = [];
        const laterEvents = [];
        subject.subscribe((e) => atfirstEvents.push(e));
        subject.onNext("a");
        subject.onNext("b");
        subject.subscribe((e) => laterEvents.push(e));
        subject.onNext("c");
        subject.onNext("d");
        return [
            atfirstEvents.should.be.deep.equal(["No one here but us trees", "a", "b", "c", "d"]),
            laterEvents.should.be.deep.equal(["b", "c", "d"])
        ];
    });
});
