/**
* non-disruptive function for logging errors
*/
function assert(expression: boolean, message = "unknown error"): void {
	if (expression) {
		return
	}
	console.error(message)
}

export { assert }
