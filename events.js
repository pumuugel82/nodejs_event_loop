(function(){

    function f1() {
        process.nextTick(() => console.log("nextTick: f1().veryFirst"));
        console.log("callstacl: f1()");
        setTimeout(callback,0,"timeout-0: f1().1");
        setImmediate(callback, "immediate: f1().1");
        setTimeout(callback,0,"timeout-0: f1().2");
        setImmediate(callback, "immediate: f1().2");
        process.nextTick(() => console.log("nextTick: f1().veryLast"));
    }

    function f2() {
        process.nextTick(() => console.log("nextTick: f2().veryFirst"));
        console.log("callstack: f2()");
        setTimeout(() => {console.log("timeout-0: f2().1")}, 0);
        setImmediate(callback, "immediate: f2().1");
        setTimeout(callback,0,"timeout-0: f2().2");
        setImmediate(callback, "immediate: f2().2");
        process.nextTick(() => console.log("nextTick; f2().veryLast"));
    }

    function callback(caller) {
        console.log(caller);
    }

    function main() {
        process.nextTick(() => console.log("nextTick: main().veryFirst"));
        console.log("callstack: main().first");
        setTimeout(callback,0,"timeout-0: main().1");
        f1();
        setTimeout(callback,0,"timeout-0: main().2");
        f2();
        setTimeout(callback,0,"timeout-0: main().3");
        console.log("callstack: main().end");
        process.nextTick(() => console.log("nextTick: main().veryLast"));
    }

    process.nextTick(() => console.log("nextTick: ().veryFirst"));
    console.log("callstack: ().veryFirst");
    main();
    console.log("callstack: ().veryLast");
    process.nextTick(() => console.log("nextTick: ().veryLast"));
}());