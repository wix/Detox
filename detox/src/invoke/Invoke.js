function call(targetThunk, method, ...args) {
	return function() {
		let target = targetThunk;
		if (typeof targetThunk === "function") {
			target = {
				type: "Invocation",
				value: targetThunk()
			};
		}
		for (let i = 0; i < args.length; i++) {
			if (typeof args[i] === "function") {
				args[i] = {
					type: "Invocation",
					value: args[i]()
				};
			}
		}
		return {
			target: target,
			method: method,
			args: args
		};
	};
}

function callDirectly(json) {
	return {
		type: "Invocation",
		value: json
	};
}

const genericInvokeObject = new Proxy(
	{},
	{
		get: (target, prop) => {
			return p => {
				return {
					type: prop,
					value: p
				};
			};
		}
	}
);

module.exports = {
	call,
	callDirectly,
	genericInvokeObject
};
