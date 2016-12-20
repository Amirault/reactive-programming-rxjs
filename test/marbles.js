"use strict";

var Rx = require("rx");

const onNext = Rx.ReactiveTest.onNext;
const onCompleted = Rx.ReactiveTest.onCompleted;
const onError = Rx.ReactiveTest.onError;

module.exports = {
    immediately : function (vars){
      const val = Array.from(arguments).map(x => onNext(Rx.ReactiveTest.subscribed,x));
      const thiz = this;
      val.andThen = function (s, values, pdelay){
        return this.concat(thiz.from(s,values,pdelay));
      }
      return val;
    },
    from: function (s, values, pdelay) {
        var delay = pdelay === undefined
            ? Rx.ReactiveTest.subscribed
            : pdelay;
        var messages = [];
        var acc = {
            onError: function (when) {
                messages.push(onError(when));
            },
            onCompleted: function (when) {
                messages.push(onCompleted(when));
            },
            onNext: function (when, letter) {
                var value = values[letter];
                if (Array.isArray(value)) {
                    value.forEach((e) => messages.push(onNext(when, e)));
                } else {
                    messages.push(onNext(when, value));
                }
            }
        };
        var i;
        var letter;
        var when;
        for (/*var*/ i = 0; i < s.length; i += 1) {
            letter = s.charAt(i);
            when = delay + 1 + i;
            switch (letter) {
            case "(":
                acc = {
                    when: when,
                    delegate: acc,
                    onError: function (when) {
                        return this.delegate.onError(this.when);
                    },
                    onCompleted: function (when) {
                        return this.delegate.onCompleted(this.when);
                    },
                    onNext: function (when, letter) {
                        this.delegate.onNext(this.when, letter);
                    }
                };
                break;
            case "!":
                acc.onError(when);
                break;
            case "|":
                acc.onCompleted(when);
                break;
            case ")":
                acc = acc.delegate;
                break;
            case "-":
                //ignore
                break;
            default:
                acc.onNext(when, letter);
                break;
            }
        }
        return messages;
    },
    hotWith: function (scheduler, marbles, values) {
        return scheduler.createHotObservable.apply(scheduler, this.from(marbles, values));
    },
    coldWith: function (scheduler, marbles, values) {
        var events = this.from(marbles, values, 0);
        return scheduler.createColdObservable.apply(scheduler, events);
    },
    toArray: function (observable) {
        var events = [];
        observable.subscribe(
            (e) => events.push(e),
            (err) => events.push("err: " + err),
            () => events.push("Completed")
        );
        return events;
    }
};
