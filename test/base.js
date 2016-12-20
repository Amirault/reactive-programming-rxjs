"use strict";
const Rx = require("rx");
const chai = require("chai");
const chaiRx = require("chai-rx");
chai.use(chaiRx.default); // Chai a un système de plugins
chai.should(); // Choix: utiliser le mode "should" de chai. cf plus bas
const marbles = require("./marbles.js");

const values = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7};
describe("categorie", function () {
    it("nom du test", function () {
        // Les effets de l'opérateur: (ici: rien)
        const source = "(ab)---cde|";
        const target = "(ab)---cde|)";

        const scheduler = new Rx.TestScheduler();
        const xs = marbles.hotWith(scheduler, source, values);

        const res = scheduler.startScheduler(() => xs);//ici, l'opérateur à tester

        return res.should.emit(marbles.from(target, values));
    });
});
