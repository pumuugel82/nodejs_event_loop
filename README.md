# Analyse des Node JS Event Loop
Da ich keine vollständig erklärenden Informationen zur Event Loop in Nodejs gefunden habe, habe ich es mal selbst versucht zu analysieren.

## Meine Ergebnisse in kurz:
1. Nodejs läuft immer Single-Threaded ab; streng sequentiell
1. Es macht Sinn anzunehmen, dass der Interpreter (Nodejs) bereits zur Entwicklungs-/Compilezeit 3-4 Stacks (oder auch: Kategorien) kennt, welche er nacheinander in einer Schleife abarbeitet.
2. Jeder Funktionsaufruf in einem Nodejs/Javascript-Programm kann einer der 4 Kategorien zugeordnet werden.
3. Erst wenn ein Stack vollständig leer (Kategorie abgearbeitet) ist, kommt der nächste Stack an die Reihe und wird vollständig abgearbeitet.
4. Die 4 Stacks nenne ich (1. Call-Stack, 2. nextTick-Stack, 3. Timeout-Stack, 4. Immediate-Stack)
5. Aufrufe von "process.nextTick(() => {...});" erzeugen einen Eintrag im nextTick-Stack
6. Aufrufe von "setTimeout(() => {...}), 0);" erzeugen einen Eintrag im Timeout-Stack
7. Aurufe von "setImmediate(() => {...})" erzeugen einen Eintrag im Immediate-Stack
8. alle anderen (normalen) function()-Aufrufe erzeugen einen Eintrag im Call-Stack
9. Call-Stack hat Vorrang vor nextTick-Stack,
10. nextTick-Stack hat Vorrang vor timeout-Stack
11. timeout-Stack hat Vorrang vor immediate-Stack

## Die Analysemethode

Das Programm "events.js" ruft nacheinander verschiedenen Funktionen auf. Die 5 Funktionen können sein:
1. eine lokal definierte Funktion
2. setTimeout() - mit Callback
3. setImmediate() - mit Callback
4. process.nextTick() - mit Callback
5. console.log()

Jede Funktion ansich erzeugt in ihrer Folge einen Eintrag in console, entweder direkt mittels console.log() oder über den Callback, in dem dann console.log() aufgerufen wird, sodass im Anschluss an den Programmdurchlauf gesehen werden kann, wann die Funktion/Callback wirklich zur Auführung kam.

Aus der späteren Analyse kann jetzt schon vorweggenommen werden, dass eine lokal definierte Funktion und console.log() sich hinsichtlich der Untersuchung gleich verhalten - sie also beide gleichermaßen einen Eintrag im Call-Stack verursachen.

## Die Reihenfolge der Funktionsaufrufe

Die folgende Aufzählung zeigt die Sequenz der Funktionsaufrufe, wie sie dem Interpreter durch den Programmablauf erscheinen (!!! aber nicht in der gleichen Reihenfolge eine Log-Ausgabe erzeugen!!!).

01. anonym() [44]
02. anonym: process.nextTick() [39]
03. anonym: console.log() [40]
04. anonym: main() [41]
05. anonym.main: process.nextTick() [28]
06. anonym.main: console.log() [29]
07. anonym.main: setTimeout() [30]
08. anonym.main: f1() [31]
09. anonym.main.f1: process.nextTick() [4]
10. anonym.main.f1: console.log() [5]
11. anonym.main.f1: setTimeout() [6]
12. anonym.main.f1: setImmediate() [7]
13. anonym.main.f1: setTimeout() [8]
14. anonym.main.f1: setImmediate() [9]
15. anonym.main.f1: process.nextTick() [10]
16. anonym.main: setTimeout() [32]
17. anonym.main: f2() [33]
18. anonym.main.f2: process.nextTick() [14]
19. anonym.main.f2: console.log() [15]
20. anonym.main.f2: setTimeout() [16]
21. anonym.main.f2: setImmediate() [17]
22. anonym.main.f2: setTimeout() [18]
23. anonym.main.f2: setImmediate() [19]
24. anonym.main.f2: process.nextTick() [20]
25. anonym.main: setTimeout() [34]
26. anonym.main: console.log() [35]
27. anonym.main: process.nextTick() [36]
28. anonym: console.log() [42]
29. anonym: process.nextTick() [43]

## Reihenfolge der Einträge in console

01. callstack: ().veryFirst events.js:40
02. callstack: main().first events.js:29
03. callstacl: f1() events.js:5
04. callstack: f2() events.js:15
05. callstack: main().end events.js:35
06. callstack: ().veryLast events.js:42
07. nextTick: ().veryFirst events.js:39
08. nextTick: main().veryFirst events.js:28
09. nextTick: f1().veryFirst events.js:4
10. nextTick: f1().veryLast events.js:10
11. nextTick: f2().veryFirst events.js:14
12. nextTick; f2().veryLast events.js:20
13. nextTick: main().veryLast events.js:36
14. nextTick: ().veryLast events.js:43
15. timeout-0: main().1 events.js:24
16. timeout-0: f1().1 events.js:24
17. timeout-0: f1().2 events.js:24
18. timeout-0: main().2 events.js:24
19. timeout-0: f2().1 events.js:24
20. timeout-0: f2().2 events.js:24
21. timeout-0: main().3 events.js:24
22. immediate: f1().1 events.js:24
23. immediate: f1().2 events.js:24
24. immediate: f2().1 events.js:24
25. immediate: f2().2 events.js:24

## Bewertung der Ausgabe

Es fällt auf, dass die programmierte Reihenfolge wie oben aufgezeigt nicht mit der Ausgabe der der Logeinträge übereinstimmt.

Vielmehr scheint es so, dass die Ausgaben einer Sorte von Aufrufen immer gebündet auftreten und innerhalb der Bündelung geordnet nach ihrem Auftretem/deklarierten Reihenfolge im Code bzw. der effektiven Abarbeitungsreihenfolge ermittelt zur Laufzeit.

Die 4 Sorten heißen (für mich):
1. Callstack
2. nextTick
3. timeout
4. immediate.

Es ist darauf hinzuweisen, dass setTimeout() hier immer mit "0" aufgerufen wurde. Ein Aufruf mit z.B. "1500" würde die Ausführung des Callbacks von setTimeout() und damit den Log-Eintrag an das Ende der Ausgabeliste verlegen. Das ist insofern zu den Ergebnissen oben kein Widerspruch, da der Interpreter ja überprüfen muss, ob der timeout für den Eintrag im timeout-Stack bereits abgelaufen ist. Und nur wenn der timeout abgelaufen ist, dann wird der anhängende Callback sofot aufgeführt. Anderenfalls, falls es keine abgelaufenden Einträge im timeout-Stack gibt, wird mit der Abarbeitung des Immediate-Stacks begonnen.


## Schlussbetrachtung

1. Das obige kann alles stimmen - muss aber nicht.
2. Kann dann niemals mehr ein neuer Callstack entstehen/abgearbeietet werden? Wenn doch, wie?
3. Wo lassen sich im Code von C++ der V8-Engine belege für die oben aufgestellten Theorien finden?

Christoph Hirte, 27.12.2020
