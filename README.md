###Quick Start

```bash
[c]npm install dnspod-ddns2 -g
ddns --login_email=[your_login_email_of_dnspod] --login_password=[your_login_password_of_dnspod]
```

###Scope

Currently, it only supports ```A record``` modify.

###Options

####--login_email(required)

Your login email of your account on [dnspod](https://www.dnspod.cn).

####--login_password(required)

Your login password of your account.

####--domain_name

Your domain name. If not explicitly specified, it will default to the first domain of your domain list returned. *However, it it recommended to be specified.*

####--timeout

The updating frequency which defaults to 30 seconds. If your want it to run in every 5 minutes, just add ```--timeout=300```.
