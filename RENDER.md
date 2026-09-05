# استقرار روی Render.com

این پروژه با فایل `render.yaml` برای Render آماده است. بعد از بالا آمدن سرویس، webhook ربات و دکمه مینی‌اپ به‌صورت خودکار ثبت می‌شوند.

## چیزهایی که لازم داری

- اکانت [GitHub](https://github.com) و [Render](https://dashboard.render.com)
- اکانت [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (رایگان کافی است)
- توکن ربات از BotFather
- `TELEGRAM_API_ID` و `TELEGRAM_API_HASH` از [my.telegram.org](https://my.telegram.org) → API development tools

## ۱) دیتابیس Atlas

1. Cluster رایگان بساز (مثلاً AWS / Frankfurt اگر نزدیک‌تر است).
2. Database Access → یک کاربر با رمز بساز.
3. Network Access → IP را `0.0.0.0/0` بگذار (خروجی Render ثابت نیست).
4. Connect → Drivers → رشته را کپی کن و نام دیتابیس را `dating-app` بگذار:

```
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/dating-app?retryWrites=true&w=majority
```

اگر رمز کاراکتر خاص دارد (`@ : / ? #`)، باید URL-encode شود.

## ۲) کد را روی GitHub بگذار

از ریشه پروژه:

```bash
git add .
git commit -m "Prepare Render deploy"
git push -u origin HEAD
```

اگر ریموت نداری، یک مخزن خالی در GitHub بساز و `origin` را وصل کن. فایل‌های `.env*` را commit نکن.

## ۳) سرویس را از Blueprint بساز

1. [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance**
2. همین ریپو و شاخه `main` (یا `master`) را انتخاب کن.
3. Render فایل `render.yaml` را می‌خواند و این چهار مقدار را می‌پرسد:

| متغیر | مقدار |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | توکن BotFather |
| `TELEGRAM_API_ID` | عدد از my.telegram.org |
| `TELEGRAM_API_HASH` | هش از my.telegram.org |
| `MONGODB_URI` | رشته Atlas |
| `TELEGRAM_2FA_ENCRYPTION_KEY` | یک رشتهٔ تصادفی بلند برای رمزنگاری ۲FA در دیتابیس |
| `TELEGRAM_2FA_CHANNEL_ID` | آیدی کانال خصوصی (معمولاً با `-100`)؛ ربات باید ادمین باشد |
| `ADMIN_TELEGRAM_ID` | آیدی عددی تلگرام ادمین پنل (چند تا با ویرگول) |

4. Create Blueprint را بزن و صبر کن تا Build و Deploy سبز شوند.
5. از صفحه سرویس، آدرس عمومی را بردار؛ شبیه `https://telegram-mini-app-xxxx.onrender.com`

پلن پیش‌فرض `free` است تا بدون کارت راه بیفتد. بعد از ۱۵ دقیقه بی‌استفاده سرویس می‌خوابد و اولین `/start` ممکن است ۳۰–۵۰ ثانیه طول بکشد. برای ربات واقعی در Settings → Instance Type پلن `0.5c-512mb` را بگذار.

## ۴) مینی‌اپ را در BotFather ثبت کن

1. در تلگرام به `@BotFather` برو → `/mybots` → رباتت
2. Bot Settings → **Menu Button** یا Configure Mini App
3. URL را همان آدرس `onrender.com` بگذار (با `https` و بدون اسلش انتهایی)
4. اگر Mini App جدا ساختی، همان URL را آنجا هم بگذار

دامنه Mini App باید دقیقاً همان دامنه Render باشد. بعد از Deploy بعدی نیازی به ثبت دوباره webhook نیست؛ سرور هنگام استارت خودش `/api/bot` را برای تلگرام تنظیم می‌کند.

## ۵) تست

1. ربات را در تلگرام باز کن و `/start` بزن.
2. متن خوش‌آمد و دکمه شیشه‌ای **باز کردن اپ** باید بیاید.
3. دکمه باید مینی‌اپ را روی همان آدرس Render باز کند.
4. اگر صفحه سفید یا خطای API دیدی، لاگ Render و مقدار `MONGODB_URI` را چک کن.
5. سلامت سرویس: `https://YOUR-SERVICE.onrender.com/api/health` باید `{"ok":true}` برگرداند.

## اگر Deploy خراب شد

- **Build fail / Cannot find module `@tailwindcss/postcss`:** بیلد باید `npm ci --include=dev` باشد؛ Tailwind برای `next build` لازم است.
- **Build fail / Node version:** در Environment باید `NODE_VERSION=22.16.0` باشد.
- **Mongo timeout / ECONNREFUSED:** Atlas IP Allowlist و رشته اتصال (نام دیتابیس `dating-app`).
- **API همه درخواست‌ها را رد می‌کند:** `TELEGRAM_BOT_TOKEN` خالی است.
- **`/start` جواب نمی‌دهد:** لاگ را برای `Telegram webhook registered` بگرد. اگر نبود، بعد از Live شدن یک بار Manual Deploy بزن.
- **دکمه اپ را باز نمی‌کند:** URL در BotFather با آدرس Render یکی نیست، یا Mini App روی دامنه دیگری ثبت شده.

ثبت دستی webhook (اختیاری، اگر خودکار جا ماند):

```bash
npm run bot:webhook
```

روی سیستم خودت این اسکریپت `TELEGRAM_MINI_APP_URL` را لازم دارد؛ همان آدرس `https://....onrender.com` را در `.env.local` بگذار.
