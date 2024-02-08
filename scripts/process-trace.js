const fs = require('node:fs');

function main() {
    const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const output = [];
    const handle = createEventProcessor(output);
    for (const event of input) {
        handle(event);
    }

    console.log('[\n' + output.map(o => JSON.stringify(o)).join(',\n') + '\n]');
}

const createEventProcessor = (output) => {
    const beginEvents = new Map(); // Storage for 'B' events and their indices

    const processEvent = (event) => {
        const key = `${event.pid}:${event.tid}`; // Unique key for matching B and E events
        // if (event.ph === 'i') { return; }

        if (event.ph === 'E') {
            // Look for the matching 'B' event index
            const beginStack = beginEvents.get(key);
            const beginIndex = beginStack != null ? beginStack.pop() : undefined;
            const beginEvent = output[beginIndex];
            if (beginIndex >= 0) {
                if (!beginEvent) { console.log(beginIndex, beginStack, output); }
                const duration = event.ts - beginEvent.ts;

                // Update the 'B' event to an 'X' event with duration
                output[beginIndex] = {
                    ...beginEvent,
                    ...event,
                    ts: beginEvent.ts,
                    ph: 'X', // Set phase to 'X'
                    dur: duration, // Set duration
                };
            } else {
                output.push(event);
            }
        } else {
            const index = output.push(event) - 1;
            if (event.ph === 'B') {
                if (beginEvents.has(key)) {
                    beginEvents.get(key).push(index);
                } else {
                    beginEvents.set(key, [index]);
                }
            }
        }
    };

    return processEvent;
};

main();
