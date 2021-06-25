require("dotenv").config();
const { Solver } = require("2captcha");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const logger = require("./logging");
const products = require("./catalog/products.json");
const ips = require("./catalog/ips.json");
puppeteer.use(StealthPlugin());

class Lelouch {
  constructor(
    email,
    password,
    product,
    ip = "local",
    headless = true,
    intervalLimitLow = 2222,
    intervalLimitUp = 4444
  ) {
    logger.info("👁️ Hello ViBritannia, I am Lelouchh");
    this.email = email;
    this.password = password;
    this.headless = headless;
    this.intervalLimitLow = intervalLimitLow;
    this.intervalLimitUp = intervalLimitUp;
    this.product = products[product];
    this.solver = new Solver("53da989db524e94ff5e9cc077cd8322f");
    this.ip = ips[ip];
  }
  async startBrowser() {
    this.logger = logger.child({
      email: this.email,
      product: this.product,
      ip: this.ip,
    });

    this.browser = await puppeteer.launch({
      headless: this.headless,
      slowMo: 100,
      ...(this.ip && {
        args: [`--proxy-server=${this.ip.proxyIP}:${this.ip.proxyPort}`],
      }),
    });
    this.page = await this.browser.newPage();
    await this.page.setExtraHTTPHeaders({
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1",
      referer: "https://www.google.com/",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
    });
    //if (this.headless) {
    //await this.page.setRequestInterception(true);
    //this.page.on("request", (request) => {
    //if (
    //request.resourceType() === "image" ||
    //request.resourceType() === "stylesheet"
    //)
    //request.abort();
    //else request.continue();
    //});
    //}
  }
  async verifyCaptcha() {
    try {
      const captchaSelector =
        "body > div > div.a-row.a-spacing-double-large > div.a-section > div > div > form > div.a-row.a-spacing-large > div > div > div.a-row.a-text-center > img";
      const captchaUrl = await this.page.$eval(captchaSelector, (el) => el.src);
      if (captchaUrl) {
        console.log("Captcha found!");
        const solution = await this.getCaptchaSolution(captchaUrl);
        console.log(`Captcha: ${solution.data}`);
        await this.page.type("#captchacharacters", solution.data);
        await this.page.click(
          "body > div > div.a-row.a-spacing-double-large > div.a-section > div > div > form > div.a-section.a-spacing-extra-large > div > span > span > button"
        );
      }
    } catch (error) {
      console.log("No Captcha... Lets continue");
    }
  }
  async getCaptchaSolution(imgUrl) {
    const imageArrayBuffer = await get(imgUrl, { responseType: "arraybuffer" });
    const imgString =
      "data:image/jpeg;base64," +
      new Buffer.from(imageArrayBuffer.data, "binary").toString("base64");
    const solution = await this.solver.imageCaptcha(imgString);
    return solution;
  }
  getRandomTimeOut() {
    return (
      Math.random() * (this.intervalLimitUp - this.intervalLimitLow + 1) +
      this.intervalLimitLow
    );
  }
  async login() {
    await this.page.goto("https://www.kabum.com.br");
    const loginBtn = await this.page.waitForSelector(
      "#li-login-usuario > a:nth-child(1)"
    );
    loginBtn.click();
    this.logger.info("Going to login page...");
    await this.page.waitForSelector("form[name='login']");
    this.logger.info("Form found. Making login!");
    await this.page.type("#textfield12", this.email);
    await this.page.type("#textfield15", this.password);
    await this.page.click("input[type='image']");
    await this.page.waitForNavigation({ waitUntil: "domcontentloaded" });
  }
  async checkAccount() {
    const userNameElement = await this.page.$("#li-login-usuario");
    if (userNameElement) {
      this.logger.info(`Logged as : ${userNameElement.innerText}`);
    }
  }
  async watchProduct() {
    this.logger.info(`👀 Watching Product ${this.product.name}`);
    await this.page.reload({ waitUntil: "domcontentloaded" });

    const buyBtn = await this.page.$(".botao-comprar");
    if (buyBtn) {
      this.logger.info("🏃 Product in stock.\n Lets buy!!!");
      return;
    }
    const title = await this.page.title();
    this.logger.info({ title });
    this.logger.info("⛔ Product not in stock");
    this.checkAccount();
    const randomTimeOut = this.getRandomTimeOut();
    this.logger.info(`🚧 Trying again in ${randomTimeOut} ms`);
    return setTimeout(async () => {
      return await this.watchProduct();
    }, randomTimeOut);
  }
  async start() {
    try {
      await this.startBrowser();
      await this.login();
      await this.page.goto(this.product.link);
      await this.watchProduct();
    } catch (e) {
      this.logger.error(e);
      await this.restart();
    }
  }
  async restart() {
    this.logger.info("Restarting Lelouch...");
    await this.browser.close();
    await this.start();
  }
}

(async () => {
  const lelouch = new Lelouch(
    process.env.EMAIL,
    process.env.PASSWORD,
    "3060TI_GIGABYTE",
    "usa1",
    false
  );
  lelouch.start();
})();
module.exports = Lelouch;
