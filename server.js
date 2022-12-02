const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const totp = require("totp-generator");
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('credential.json'));
(async function() {
    const app = express();
    await app.use(bodyParser.json());
    module.exports = app.listen(3000, '0.0.0.0');
    await puppeteer.use(StealthPlugin());
    await puppeteer.use(AdblockerPlugin({
        blockTrackers: true
    }))
    const argsz = [
        "--no-sandbox",
        "--no-first-run",
        "--lang=en-US,en",
        "--window-size=1920x1080",
        '--user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"'
    ];
    const browser = await puppeteer.launch({
        timeout: 0,
        userDataDir: "./user_data",
        // executablePath : "/Applications/Chromium.app/Contents/MacOS/Chromium",
        // executablePath: "/usr/bin/chromium",
        headless: true,
        args: argsz
    });
    const page = await browser.newPage();
    let mng = "https://developer.tokopedia.com/console/" + config.fs_id + "/shop-management";
    await page.goto(mng, {
        waitUntil: 'load'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    // console.log(`User Agent: ${await browser.userAgent()}`);
    try {
        await loginTokopedia(page);
    } catch (e) {
        console.log(e)
    }
    let message = '';

    app.post('/helloworld', async (req, res) => {
        console.log(req.body);
        if (req.body.domain && req.body.identifier) {
            let args = req.body.domain;
            let identifier = req.body.identifier;
            if (req.get('user-agent') === 'marco-polo-2110') {
                let mng = "https://developer.tokopedia.com/console/" + config.fs_id + "/shop-management";
                await page.goto(mng, {
                    waitUntil: 'load'
                });
                await new Promise(resolve => setTimeout(resolve, 8000));
                if (page.url() !== mng) {
                    await loginTokopedia(page);
                    await page.goto(mng, {
                        waitUntil: 'load'
                    });
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                try {
                    //click add shop
                    await page.waitForXPath('(/html/body/div[1]/div/div/div[3]/main/div/div[2]/div[2]/div[1]/div[2]/button)')
                    const elements = await page.$x('(/html/body/div[1]/div/div/div[3]/main/div/div[2]/div[2]/div[1]/div[2]/button)')
                    await elements[0].click()
                    //click on text area
                    await page.waitForXPath('(/html/body/div[5]/div[2]/div[1]/div[1]/div[1]/textarea)[1]')
                    let txt = await page.$x('(/html/body/div[5]/div[2]/div[1]/div[1]/div[1]/textarea)[1]');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await txt[0].click();
                    //type the shop domain
                    await txt[0].focus();
                    await page.keyboard.down('Control');
                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');
                    await page.keyboard.press('Backspace');
                    await txt[0].type(args, {
                        delay: 20
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await page.keyboard.press('Enter');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    try {
                        let apply = await page.$x('(/html/body/div[5]/div[2]/div[1]/div[3]/button[2]/span)[1]');
                        let [shopId] = await page.$x('(/html/body/div[5]/div[2]/div[1]/div[1]/div[2]/div/div[2]/p)[1]');
                        let [shopName] = await page.$x('(/html/body/div[5]/div[2]/div[1]/div[1]/div[2]/div/div[2]/h1)[1]');
                        let shopIdTxt = await page.evaluate(element => element.textContent, shopId);
                        let shopNameTxt = await page.evaluate(element => element.textContent, shopName);
                        await apply[0].click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        message = {
                            status: 200,
                            message: "email sent",
                            shopId: shopIdTxt,
                            shopName: shopNameTxt,
                            identifier: identifier,
                            domain: args
                        };
                    } catch (e) {
                        let errors = [
                            "Shop Type Is Not Official Store or Power Merchant",
                            "Shop has been connected to another app of your organization",
                            "Shop Domain Not Found"
                        ];

                        //if process adding shop to dashboard failed
                        let [error] = await page.$x('(/html/body/div[5]/div[2]/div[1]/div[1]/div[2]/div/div[1]/p)[1]');
                        let errorTxt = await page.evaluate(element => element.textContent, error);
                        let code = errors.indexOf(errorTxt);
                        message = {
                            status: 500,
                            message: "Error from tokopedia when activating : " + errorTxt,
                            code: code,
                            identifier: identifier,
                            domain: args
                        };
                    }

                } catch (e) {
                    message = {
                        status: 500,
                        message: "Unexpected code error when activating domain",
                        identifier: identifier,
                        domain: args
                    };
                    console.log(e);
                    res.send({
                        data: "failed",
                        status: 500
                    });
                }
                await callback(message);
                res.send({
                    data: message,
                    status: 200
                });
            }
        } else {
            res.sendStatus(500);
        }
    });

    //for deleting shop from dashboard, since the search on the dashboard is not working, currently this function is not working
    app.post('/hellosekai', async (req, res) => {
        console.log(req.body);
        if (req.body.domain) {
            let args = req.body.domain;
            if (req.get('user-agent') === 'marco-polo-2110') {
                try {
                    let mng = "https://developer.tokopedia.com/console/" + config.fs_id + "/shop-management";
                    if (page.url() !== mng) {
                        await loginTokopedia(page);
                    }
                    //click on search input
                    let txt = await page.$x('(//*[@id="content"]/div/div/div[3]/main/div/div[2]/div[2]/div[1]/form/div/input)[1]');
                    await txt[0].click();
                    //type the shop name
                    await txt[0].focus();
                    await page.keyboard.down('Control');
                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');
                    await page.keyboard.press('Backspace');
                    await txt[0].type(args)
                    await page.keyboard.press('Enter');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    try {
                        //click delete button
                        let del = await page.$x('(//*[@id="content"]/div/div/div[3]/main/div/div[2]/div[2]/div[2]/table/tbody/tr/td[6]/button)[1]');
                        console.log(del);
                        if (del.length === 0) {
                            message = {
                                status: 404,
                                message: "Not Found",
                                domain: args
                            };
                            res.send({
                                data: "Not Found",
                                status: 500
                            });
                            return;
                        }
                        await del[0].hover();
                        await del[0].click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        let confirm = await page.$x('(/html/body/div[4]/div[2]/div/button[2])[1]');
                        await confirm[0].hover();
                        await confirm[0].click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        res.send({
                            data: "success",
                            status: 200
                        });
                        message = {
                            status: 200,
                            message: "Shop Deleted",
                            domain: args
                        };
                    } catch (e) {
                        message = {
                            status: 404,
                            message: "Not Found",
                            domain: args
                        };
                        console.log(e);
                        res.send({
                            data: "failed",
                            status: 500
                        });
                    }

                } catch (e) {
                    message = {
                        status: 500,
                        message: "Unexpected code error when deleting domain",
                        domain: args
                    };
                    console.log(e);
                    res.send({
                        data: "failed",
                        status: 500
                    });
                }

                await callback(message);
                // await activateTokopediaToMongo(message);
                console.log("done");
                res.send({
                    data: "success",
                    status: 200
                });
            }
        } else {
            res.sendStatus(500);
        }
    });

    //for resend email confirmation shop from dashboard, since the search on the dashboard is not working, currently this function is not working
    app.post('/gutentag', async (req, res) => {
        console.log(req.body);
        if (req.body.domain) {
            let args = req.body.domain;
            if (req.get('user-agent') === 'marco-polo-2110') {
                let mng = "https://developer.tokopedia.com/console/" + config.fs_id + "/shop-management";
                await page.goto(mng);
                if (page.url() !== mng) {
                    loginTokopedia(page);
                }
                //run here
                try {
                    //click on waiting for approval
                    let waiting = await page.$x('(//*[@id="content"]/div/div/div[3]/main/div/div[2]/div[1]/div/div[2])[1]');
                    await waiting[0].click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    //click on search input
                    let txt = await page.$x('(//*[@id="content"]/div/div/div[3]/main/div/div[2]/div[2]/div[1]/form/div/input)[1]');
                    await txt[0].click();
                    await txt[0].focus();
                    await page.keyboard.down('Control');
                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');
                    await page.keyboard.press('Backspace');
                    await txt[0].type(args)
                    await page.keyboard.press('Enter');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    try {
                        //click resend email button
                        let resend = await page.$x('(//*[@id="content"]/div/div/div[3]/main/div/div[2]/div[2]/div[2]/table/tbody/tr/td[6]/div)[1]');
                        if (resend.length === 0) {
                            message = {
                                status: 404,
                                message: "Not Found",
                                domain: args
                            };
                            res.send({
                                data: "Not Found",
                                status: 500
                            });
                            return;
                        }
                        await resend[0].hover();
                        await resend[0].click();
                        let [email] = await page.$x('(//*[@id="content"]/div/div/div[3]/main/div/div[2]/div[2]/div[2]/table/tbody/tr/td[3])[1]');
                        let emailTxt = await page.evaluate(element => element.textContent, email);
                        res.send({
                            data: "success",
                            status: 200
                        });
                        message = {
                            status: 200,
                            message: "Email Activation resend success ",
                            domain: args,
                            email: emailTxt
                        };
                    } catch (e) {
                        message = {
                            status: 404,
                            message: "Not Found",
                            domain: args
                        };
                        console.log(e);
                        res.send({
                            data: "failed",
                            status: 500
                        });
                    }

                } catch (e) {
                    message = {
                        status: 500,
                        message: "Unexpected code error when resend email for domain",
                        domain: args
                    };
                    console.log(e);
                    res.send({
                        data: "failed",
                        status: 500
                    });
                }
                res.send({
                    data: "success",
                    status: 200
                });
            }
        } else {
            res.sendStatus(500);
        }
    });


    function callback(messages) {
        if (config.callback_url !== '') {
            axios.post(config.callback_url, messages, {
                    headers: config.callback_headers
                })
                .then((response) => {
                    console.log(response)
                });
        }
    }

    async function loginTokopedia(page) {
        let mng = "https://developer.tokopedia.com/console/" + config.fs_id + "/shop-management";
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (page.url() !== mng) {
            //login handler here
            await page.waitForSelector('#email', {
                visible: true
            })
            await page.evaluate(() => document.querySelector('#login-step-one-form > button').click());
            await page.type('#email', config.email, {
                delay: 60
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.evaluate(() => document.querySelector('#login-step-one-form > button[type="submit"]').click());
            await page.waitForSelector('#password', {
                visible: true
            })
            await page.type('#password', config.password, {
                delay: 60
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.evaluate(() => document.querySelector('#login-submit').click());
            await new Promise(resolve => setTimeout(resolve, 3000));
            if (page.url() !== 'https://developer.tokopedia.com/console') {
                console.log("need to input OTP from email");
                await page.waitForSelector('#cotp__method--ga', {
                    visible: true
                })
                await page.evaluate(() => document.querySelector('#cotp__method--ga').click());
                let token = totp(config.secret);
                await page.waitForSelector('#otp-number-input-1', {
                    visible: true
                })
                await page.type('#otp-number-input-1', token, {
                    delay: 50
                });
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
})();