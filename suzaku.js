require("dotenv").config();
const { Solver } = require("2captcha");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const logger = require("./logging");
const channels = require("./catalog/channels.json");
puppeteer.use(StealthPlugin());

class Suzaku {
  constructor(email, password, headless = true) {
    logger.info("👳 Hello ViBritannia, I am Suzaku");
    this.email = email;
    this.password = password;
    this.headless = headless;
    this.solver = new Solver("53da989db524e94ff5e9cc077cd8322f");
  }
  async startBrowser() {
    this.logger = logger.child({
      email: this.email,
    });

    this.browser = await puppeteer.launch({
      headless: this.headless,
    });
    this.page = await this.browser.newPage();
    logger.info("Browser started.");
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
  async login() {
    this.page.goto("https://discord.com/app");
    const emailRef = await this.page.waitForSelector("input[name='email']");
    await emailRef.type(this.email);
    const pwdRef = await this.page.waitForSelector("input[name='password']");
    await pwdRef.type(this.password);
    this.page.click("button[type='submit']");
    await this.page.waitForNavigation({ waitUntil: "domcontentloaded" });
  }
  async restart() {
    this.logger.info("Restarting Suzaku...");
    await this.browser.close();
    await this.start();
  }
  async scrollUp() {
    console.log("Scrolling up...");
    return this.page.evaluate(async () => {
      const scrollableSection = document.querySelector(
        "#app-mount > div.app-1q1i1E > div > div.layers-3iHuyZ.layers-3q14ss > div > div > div > div.content-98HsJk > div.chat-3bRxxu > div.content-yTz4x3 > main > div.messagesWrapper-1sRNjr.group-spacing-16 > div"
      );
      scrollableSection.scrollTop = scrollableSection.offsetHeight;
    });
  }
  async scrollUpSequence(n = 15) {
    await this.scrollUp();
    this.scrollCount += 1;

    await setTimeout(async () => {
      console.log({ scrollCount: this.scrollCount });
      if (this.scrollCount < n) {
        return await this.scrollUpSequence(n);
      } else {
        return await this.getMessages();
      }
    }, 2000);
  }
  async getMessages() {
    this.logger.info("Getting messages...");
    const msns = await this.page.$$eval(".message-2qnXI6", (messages) =>
      messages.map((message) => {
        const title = message.querySelector(".embedTitle-3OXDkz");
        const links = message.querySelectorAll("a");
        const date = message.querySelector("time");

        return {
          ...(title && { title: title.innerText }),
          ...(date && { date: date.getAttribute("datetime") }),
          link: Array.from(links).map((link) => link.href),
        };
      })
    );
    console.log(msns.length);
    return msns;
  }
  async getChannelMessages(channel) {
    this.logger.info(`Entering channel ${channel}`);
    const channelUrl = channels[channel];
    this.page.goto(channelUrl);
    await this.page.waitForSelector(".scrollerInner-2YIMLh");
    await this.page.waitForSelector(".embedTitle-3OXDkz");

    this.scrollCount = 0;
    const messages = await this.scrollUpSequence();
    console.log("Ja passo");
    console.log(messages);
  }
  async start() {
    try {
      await this.startBrowser();
      await this.login();
      await this.getChannelMessages("rtx3070");
    } catch (e) {
      this.logger.error(e);
      await this.restart();
    }
  }
}

(async () => {
  const suzaku = new Suzaku(process.env.EMAIL, process.env.PASSWORD, false);
  suzaku.start();
})();
module.exports = Suzaku;
