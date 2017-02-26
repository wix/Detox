class Action {
  constructor(type, params) {
    this.type = type;
    this.params = params;
  }
}

class Login extends Action {
  constructor(sessionId) {
    const params = {
      sessionId: sessionId,
      role: 'tester'
    }
    super('login', params);
  }

  async handle(response) {
    console.log(response);

  }
}

class Cleanup extends Action {

}

class Ready extends Action {
  constructor() {
    super('isReady');
  }

  handle(response) {
    if (response === 'ready') {
      console.log('yata')
    }
  }
}

module.exports = {
  Login
};
