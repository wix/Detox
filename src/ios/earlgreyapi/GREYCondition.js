/**

	This code is generated.
	For more information see generation/README.md.
*/



class GREYCondition {
  /*Waits for the condition to be met until the specified @c seconds have elapsed.
  
  Will poll the condition as often as possible on the main thread while still giving a fair chance
  for other sources and handlers to be serviced.
  
  @remark Waiting on conditions with this method is very CPU intensive on the main thread. If
  you do not need to return immediately after the condition is met, the consider using
  GREYCondition::waitWithTimeout:pollInterval:
  
  @param seconds Amount of time to wait for the condition to be met, in seconds.
  
  @return @c YES if the condition was met before the timeout, @c NO otherwise.*/
  static waitWithTimeout(element, seconds) {
    if (typeof seconds !== "number") throw new Error("seconds should be a number, but got " + (seconds + (" (" + (typeof seconds + ")"))));
    return {
      target: element,
      method: "waitWithTimeout:",
      args: [{
        type: "CGFloat",
        value: seconds
      }]
    };
  }

  /*Waits for the condition to be met until the specified @c seconds have elapsed. Will poll the
  condition immediately and then no more than once every @c interval seconds. Will attempt to poll
  the condition as close as possible to every @c interval seconds.
  
  @remark Will allow the main thread to sleep instead of busily checking the condition.
  
  @param seconds  Amount of time to wait for the condition to be met, in seconds.
  @param interval The minimum time that should elapse between checking the condition.
  
  @return @c YES if the condition was met before the timeout, @c NO otherwise.*/
  static waitWithTimeoutPollInterval(element, seconds, interval) {
    if (typeof seconds !== "number") throw new Error("seconds should be a number, but got " + (seconds + (" (" + (typeof seconds + ")"))));
    if (typeof interval !== "number") throw new Error("interval should be a number, but got " + (interval + (" (" + (typeof interval + ")"))));
    return {
      target: element,
      method: "waitWithTimeout:pollInterval:",
      args: [{
        type: "CGFloat",
        value: seconds
      }, {
        type: "CGFloat",
        value: interval
      }]
    };
  }

}

module.exports = GREYCondition;