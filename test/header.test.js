const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto(`http://localhost:${page.port}/blogs`);
});

afterEach(async () => {
  await page.close();
});

test('The header has the correct text', async () => {
  const text = await page.getInnerHtml("a.brand-logo");
  expect(text).toEqual("Blogster");
});

test("clicking login starts oauth flow", async () => {
  await page.click(".right a");
  const url = page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test("When signed in, shows logout button", async () => {
  await page.login();
  const text = await page.getInnerHtml('a[href="/auth/logout"]');
  expect(text).toEqual("Logout");
});