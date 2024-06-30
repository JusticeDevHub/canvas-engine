class LogicObject {
  #variables: { [key: string]: any } = {};
  #functions: { [key: string]: (params?: any) => void } = {};

  setVariable = (key: string, value: any) => {
    this.#variables[key] = value;
    return this;
  };

  getVariable = (key: string): any => {
    return this.#variables[key] ?? null;
  };

  createFunction = (functionName: string, func: (params?: any) => void) => {
    this.#functions[functionName] = func;
    return this;
  };

  callFunction = (functionName: string, params?: any) => {
    const func: ((params?: any) => void) | null = this.#functions[functionName];
    if (!func) {
      return this;
    }
    func(params);
    return this;
  };
}

export default LogicObject;
