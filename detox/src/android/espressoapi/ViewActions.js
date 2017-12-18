/**

	This code is generated.
	For more information see generation/README.md.
*/

class ViewActions {
	static clearGlobalAssertions() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "clearGlobalAssertions",
			args: []
		};
	}

	static clearText() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "clearText",
			args: []
		};
	}

	static click() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "click",
			args: []
		};
	}

	static swipeLeft() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "swipeLeft",
			args: []
		};
	}

	static swipeRight() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "swipeRight",
			args: []
		};
	}

	static swipeDown() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "swipeDown",
			args: []
		};
	}

	static swipeUp() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "swipeUp",
			args: []
		};
	}

	static closeSoftKeyboard() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "closeSoftKeyboard",
			args: []
		};
	}

	static pressImeActionButton() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "pressImeActionButton",
			args: []
		};
	}

	static pressBack() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "pressBack",
			args: []
		};
	}

	static pressMenuKey() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "pressMenuKey",
			args: []
		};
	}

	static pressKey(keyCode) {
		if (typeof keyCode !== "number") {
			throw new Error(
				"keyCode should be a number, but got " +
					(keyCode + (" (" + (typeof keyCode + ")")))
			);
		}
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "pressKey",
			args: [
				{
					type: "Integer",
					value: keyCode
				}
			]
		};
	}

	static doubleClick() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "doubleClick",
			args: []
		};
	}

	static longClick() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "longClick",
			args: []
		};
	}

	static scrollTo() {
		return {
			target: {
				type: "Class",
				value: "android.support.test.espresso.action.ViewActions"
			},
			method: "scrollTo",
			args: []
		};
	}
}

module.exports = ViewActions;
