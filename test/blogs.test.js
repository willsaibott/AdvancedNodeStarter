const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
    await page.waitFor("form");
  });

  test("can see blog create form", async () => {
    const label = await page.getInnerHtml("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("And using invalid inputs", async () => {

    beforeEach(async () => {
      await page.click("form button");
    });

    test("the form shows an error message", async () => {
      const titleError = await page.getInnerHtml(".title .red-text");
      const contentError = await page.getInnerHtml(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");

    });
  });

  describe('And using valid inputs', () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const text = await page.getInnerHtml("form h5");
      const title = await page.getInnerHtml("form div:nth-child(2) div");
      const content = await page.getInnerHtml("form div:nth-child(3) div");

      expect(text).toEqual("Please confirm your entries");
      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });

    test("Submitting then saving adds blog to index page", async () => {
      const titleSelector = ".darken-1:first-child span.card-title";
      const contentSelector = ".darken-1:first-child p";

      await page.click("button.green");
      await page.waitFor(".card");

      const url = page.url();
      expect(url).toEqual(`http://localhost:${page.port}/blogs`);


      const title = await page.getInnerHtml(titleSelector);
      const content = await page.getInnerHtml(contentSelector);

      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });
});

describe("User is not logged in", async () => {

  const actions = [
    {
      method: "get",
      path: "/api/blogs"
    },
    {
      method: "post",
      path: "/api/blogs",
      body: {
        title: "T",
        content: "C",
      }
    },
  ];

  test("Blog related actions are prohibited", async () => {
    const results = await page.req(actions);

    for (let result of results) {
      expect(result).toEqual({ error: "You must log in!"});
    }
  });
});