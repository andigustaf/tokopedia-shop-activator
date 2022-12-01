# tokopedia-shop-activator
This script will add tokopedia domain on shop console


# Prerequisite
you need to add your credential to the credential.json, you can see the format in the credential.example.json.

for acquiring the TOTP secret you need to register a phone number in your tokopedia account, then you can activate the 2FA google authenticator settings, the secret will be shown below the qr code.

CAUTION, https://accounts.tokopedia.com/api/authorize will return 403 if you're using certain user-agent, and doesn't let you log in with some error. i'd suggest you to use other user-agent, just try using `headless : false`  to debug.

if built in puppeteer browser does not work, use other browser by changing the `executablePath` of puppeteer, for example `executablePath: "/usr/bin/chromium"`

# Running

`node server.js`

it will run on 0.0.0.0:3000
the script will wait for the UI to load

# REST API

There are 3 endpoints in this script
 - `/helloworld` this endpoint will add your tokopedia domain to the tokopedia developer dashboard.
 
 the payload are
```
{
    "domain": "tokopedia domain",
    "identifier": "some identifier for the callback"
}
```
example request
```
curl --location --request POST 'http://localhost:3000/helloworld' \
--header 'user-agent: marco-polo-2110' \
--header 'Content-Type: application/json' \
--data-raw '{
    "domain": "domain",
    "identifier": id
}'
```
tokopedia domain are the path of the shops url
for example if 'https://tokopedia.com/testing' then "testing" would be the domain.

the response will be 
```
{
    "data": {
        status: 200,
        message: "email sent",
        shopId: TOKOPEDIA_SHOP_ID,
        shopName: TOKOPEDIA_SHOP_NAME,
        identifier: identifier,
        domain: args
    },
    "status": 200
}
```
CAUTION if you add the same shop domain twice and the user hasn't confirm the email the response would be still success but tokopedia WILL NOT RESEND the email. so either you need to resend it manually or the user accept the confirmation via Tokopedia Seller center in the pengaturan pihak ketika section.


if failed 
```
{
    "data": {
        "status": 500,
        "message": "Error from tokopedia when activating : Shop Domain Not Found",
        "code": 2,
        "identifier": identifier,
        "domain": "testing for activation"
    },
    "status": 200
}
```
the error code would be [0,1,2]
 - "0" would be "Shop Type Is Not Official Store or Power Merchant", since tokopedia requiring seller to be a PM or OS to use 3rd party enabler.
 - "1" would be "Shop has been connected to another app of your organization", this means the domain that you tried to add is already integrated to the fs_id of one of your applications.
- "2" would be "Shop Domain Not Found", this means the domain that you tried to add is not found, either typo or has been changed.

if there  are changes in the UI, the error would be 
```
{
    data : "failed",
    status : 500
}
```


there are 2 more endpoint 

 - `/hellosekai` this endpoint is for deleting shop domain integration from the tokopedia dashboard (CURRENTLY NOT WORKING, tokopedia search function on the dashboard is not working properly to be used for production)
  - `/gutentag` this endpoint is for resending email confirmation for the shop domain integration (CURRENTLY NOT WORKING, tokopedia search function on the dashboard is not working properly to be used for production)


