function jqMethodApplier(methods, defaultMethod) {
	if (typeof defaultMethod === 'undefined') {
		for (methodName in methods) {
			defaultMethod = methodName;
			break;
		}
	}
	var applyMethod = function(name, args) {
		return methods[name].apply(methods, args);
	};
	this.apply = function(args) {
		var methodName, methodArgs;
		if (args.length === 0) {
			methodName = defaultMethod;
			methodArgs = [];
		} else {
			var startArg;
			if (typeof args[0] !== 'string') {
				methodName = defaultMethod;
				startArg = 0;
			} else {
				methodName = args[0];
				startArg = 1;
			}
			methodArgs = [];
			for (var i = startArg; i < args.length; i++) {
				methodArgs.push(args[i]);
			}
		}

		return applyMethod(methodName, methodArgs);
	};
}