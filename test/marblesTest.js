"use strict";
return; 
var Rx = require("rx");

const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;
const onError = Rx.ReactiveTest.onError;

var chai = require("chai");
var chaiRx = require("chai-rx");
chai.use(chaiRx.default);
chai.should();

var marbles = require("./marbles.js");

//const describe = ()=> {};
describe("marbles", function () {
    it("should work with conclusion", function () {
        const scheduler = new Rx.TestScheduler();
        var xs = marbles.hotWith(scheduler, "a-b|", {a: 1, b: 2});
        var res = scheduler.startScheduler(() => xs);
        return res.should.emit([
            onNext(Rx.ReactiveTest.subscribed + 1, 1),
            onNext(Rx.ReactiveTest.subscribed + 3, 2),
            onCompleted(Rx.ReactiveTest.subscribed + 4)
        ]);
    });
    it("should also work with () conclusion events", function () {
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, "a(b|)", {a: 1, b: 2});
        const res = scheduler.startScheduler(() => xs);
        return res.should.emit([
            onNext(Rx.ReactiveTest.subscribed + 1, 1),
            onNext(Rx.ReactiveTest.subscribed + 2, 2),
            onCompleted(Rx.ReactiveTest.subscribed + 2)
        ]);
    });
    it("should work with errors", function () {
        const scheduler = new Rx.TestScheduler();
        var xs = marbles.hotWith(scheduler, "a-b!", {a: 1, b: 2});
        var res = scheduler.startScheduler(() => xs);
        return res.should.emit([
            onNext(Rx.ReactiveTest.subscribed + 1, 1),
            onNext(Rx.ReactiveTest.subscribed + 3, 2),
            onError(Rx.ReactiveTest.subscribed + 4)
        ]);
    });
    it("should also work with () error events", function () {
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, "a(b!)", {a: 1, b: 2});
        const res = scheduler.startScheduler(() => xs);
        return res.should.emit([
            onNext(Rx.ReactiveTest.subscribed + 1, 1),
            onNext(Rx.ReactiveTest.subscribed + 2, 2),
            onError(Rx.ReactiveTest.subscribed + 2)
        ]);
    });
    it("should work with uncompleted", function () {
        const scheduler = new Rx.TestScheduler();
        var xs = marbles.hotWith(scheduler, "a-b", {a: 1, b: 2});
        var res = scheduler.startScheduler(() => xs);
        return res.should.emit([
            onNext(Rx.ReactiveTest.subscribed + 1, 1),
            onNext(Rx.ReactiveTest.subscribed + 3, 2)
        ]);
    });
    it("should also work as a hot test", function () {
        const scheduler = new Rx.TestScheduler();
        var xs = marbles.hotWith(scheduler, "a-b|", {a: 1, b: 2});
        var res = scheduler.startScheduler(() => xs);
        return res.should.emit(marbles.from("a-b|", {a: 1, b: 2}));
    });
    it("should also work as a cold test", function () {
        const scheduler = new Rx.TestScheduler();
        var xs = marbles.coldWith(scheduler, "a-b|", {a: 1, b: 2});
        var res = scheduler.startScheduler(() => xs);
        return res.should.emit(marbles.from("a-b|", {a: 1, b: 2}));
    });
    it("should allow simultaneous events", function () {
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, "ab", {a: 1, b: [2, 3, 4]});
        const res = scheduler.startScheduler(() => xs.filter((x) => x < 3));
        return res.should.emit(marbles.from("ab", {a: 1, b: 2}));
    });
    it("should also work with () events", function () {
        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, "ab", {a: 1, b: [2, 3, 4]});
        const res = scheduler.startScheduler(() => xs);
        return res.should.emit(marbles.from("a(cde)", {a: 1, c: 2, d: 3, e: 4}));
    });
    it("should should allow for immediate events", function (){
      const scheduler = new Rx.TestScheduler();
      const xs = Rx.Observable.from([1,2]).concat(Rx.Observable.never());
      const res = scheduler.startScheduler(() => xs);
      return res.should.emit(marbles.immediately(1,2));
    });
    it("should should allow for immediate events followed by marbles", function (){
      const scheduler = new Rx.TestScheduler();
      const then = marbles.hotWith(scheduler, "a-b|", {a: 1, b: 2});
      const xs = Rx.Observable.from([1,2]).concat(then);
      const res = scheduler.startScheduler(() => xs);
      return res.should.emit(marbles.immediately(1,2).andThen("a-b|",{a:1, b:2}));
    });
});
