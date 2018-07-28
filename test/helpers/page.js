const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");
const port = process.env.PORT || 3000;

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: ['production', 'ci'].includes(process.env.NODE_ENV),
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function(target, property) {
        return target[property] ||
               browser[property] ||
               page[property];
      }
    });
  }

  constructor(page) {
    this.page = page;
    this.port = port;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });
    await this.page.goto(`http://localhost:${port}/blogs`);
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getInnerHtml(selector) {
    return this.page.$eval(selector, el => {
      console.log(el);
      console.log(el.innerHTML);
      return el.innerHTML
    });
  }

  get(path) {
    return this.page.evaluate((_path) => {
      return fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
        "Content-Type": "application/json"
        }
      }).then(res => res.json());
    },
    path);
  }

  post(path, body) {
    return this.page.evaluate((_path, _body) => {
      return fetch(_path, {
        method: "POST",
        credentials: "same-origin",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(_body)
      }).then(res => res.json());
    },
    path, body);
  }

  req(actions) {
    return Promise.all(
      actions.map(({ method, path, body }) => {
        return this[method](path, body);
    }));
  }
}

module.exports = CustomPage;