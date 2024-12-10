/**
 * Unit tests for the action's main functionality, src/main.js
 */
const main = require("../src/main");

// Mock the action's main function
const runMock = jest.spyOn(main, "run");

describe("index", () => {
  it("runs", () => {
    main.run();
    expect(runMock).toHaveBeenCalled();
  });
});
