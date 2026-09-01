/** Persian UI copy matching Telegram Android `LoginActivity` / locale fa. */

export const COPY = {
  yourNumber: 'شماره تلفن شما',
  startText: 'لطفاً کد کشور خود را تأیید نموده و شماره تلفن خود را وارد کنید.',
  country: 'کشور',
  phoneNumber: 'شماره تلفن',
  wrongCountry: 'کشور اشتباه',
  syncContacts: 'همگام‌سازی مخاطبین',
  syncOn: 'مخاطبین این دستگاه به این حساب کاربری اضافه خواهند شد.',
  syncOff: 'مخاطبین این دستگاه به این حساب کاربری اضافه نخواهند شد.',
  confirmNumber: 'آیا این شماره درست است؟',
  edit: 'ویرایش',
  yes: 'بله',
  ok: 'باشه',
  cancel: 'لغو',
  done: 'تمام',
  problem: 'مشکل پیش آمد',
  chooseCountry: 'کشور را انتخاب کنید',
  invalidPhone: 'شماره تلفن نامعتبر است.',
  bannedPhone: 'این شماره تلفن مسدود شده است.',
  wrongNumberFormat: 'قالب شماره نادرست است',
  shortNumber: (country: string, number: string) =>
    `شماره ${number} برای ${country} خیلی کوتاه به‌نظر می‌رسد.`,
  botHelp: 'کمک بگیرید',
  noMail: 'برنامهٔ ایمیل نصب نیست.',
  sentSmsTitle: 'کد را وارد کنید',
  sentAppTitle: 'پیام‌های تلگرام خود را بررسی کنید',
  sentSms: (n: string) =>
    `ما پیامکی حاوی کد فعال‌سازی به شماره تلفن شما ${n} ارسال کرده‌ایم.`,
  sentApp: (n: string) =>
    `ما کد را به برنامه تلگرام برای شماره تلفن ${n} در دستگاه دیگرتان ارسال کرده‌ایم.`,
  sentCall: (n: string) => `تلگرام با شماره ${n} تماس می‌گیرد و کد را اعلام می‌کند.`,
  yourCode: 'کد شما',
  flashCall: 'منتظر تماس باشید. تلفن را جواب ندهید؛ تماس خودکار قطع می‌شود.',
  missedTitle: 'تماس بی‌پاسخ',
  missedSub:
    'تلگرام با شمارهٔ شما تماس می‌گیرد. تماس را جواب ندهید. چهار رقم آخر تماس، کد ورود است.',
  missedSub2: 'شمارهٔ تماس را با پیش‌شمارهٔ زیر مقایسه کنید.',
  sendCodeSms: 'ارسال کد به صورت پیامک',
  requestVoiceCall: 'درخواست تماس صوتی',
  voiceCallTimerBefore: 'شما می‌توانید ظرف',
  voiceCallTimerAfter: 'درخواست تماس صوتی کنید',
  callText: (clock: string) => `تماس تلفنی در ${clock}`,
  smsTimer: (clock: string) => `ارسال پیامک در ${clock}`,
  sendingSms: 'در حال ارسال پیامک…',
  calling: 'در حال تماس…',
  didNotGetCode: 'کد را دریافت نکردید؟',
  didNotGetCodeSms: 'کد را با پیامک دریافت نکردید؟',
  didNotGetCodePhone: 'کد را با تماس دریافت نکردید؟',
  didNotGetCodeFragment: 'کد را از Fragment دریافت نکردید؟',
  sentFragment: (n: string) => `کد را در Fragment برای شماره ${n} باز کنید.`,
  openFragment: 'باز کردن Fragment',
  codeExpired: 'کد منقضی شده است.',
  phoneFlood: 'تلاش‌های زیادی برای این شماره انجام شده است.',
  noMailInstalled: 'برنامهٔ ایمیل نصب نیست.',
  emptyName: 'لطفاً نام را وارد کنید.',
  wrongPassword: 'گذرواژه نادرست است.',
  passwordsMismatch: 'گذرواژه‌ها یکسان نیستند.',
  permissionCall: 'تلگرام برای تأیید شماره به اجازهٔ تماس نیاز دارد.',
  permissionCallLog: 'تلگرام برای تأیید شماره به اجازهٔ گزارش تماس نیاز دارد.',
  accountSwitch: 'تعویض حساب',
  updateApp: 'نسخهٔ برنامه را به‌روز کنید.',
  resetCancelled: 'بازنشانی حساب لغو شد چون اخیراً تأیید شده است.',
  skipEmail: 'رد کردن',
  verificationCode: 'کد تأیید',
  smsFee1Title: 'پیامک در این کشور هزینه دارد',
  smsFee1Text: 'اپراتور برای پیامک ورود هزینه می‌گیرد.',
  smsFee2Title: 'پس از پرداخت کد می‌آید',
  smsFee2Text: 'کد ورود بلافاصله با پیامک برایتان ارسال می‌شود.',
  smsFee3Title: 'با پرمیوم پیامک رایگان است',
  smsFee3Text: 'تلگرام پرمیوم این هزینه را پوشش می‌دهد.',
  editNumber: 'ویرایش شماره',
  editNumberInfo: (n: string) =>
    `آیا می‌خواهید شماره خود را ویرایش کنید؟\n\n${n}\n\nدر صورتی که شماره بالا درست است، لطفاً منتظر کد تأیید بمانید.`,
  stopVerification: 'آیا می‌خواهید فرآیند تأیید را متوقف کنید؟',
  didNotGetInfo: (n: string) =>
    `اگر کد به ${n} نرسید، از طریق تماس یا پیام تلگرام دوباره تلاش کنید.`,
  help: 'کمک',
  wrongCode: 'کد نامعتبر است.',
  wrongCodeTitle: 'کد اشتباه',
  floodWait: (t: string) => `تلاش‌های زیادی انجام شده. لطفاً ${t} صبر کنید.`,
  seconds: (n: number) => `${n} ثانیه`,
  minutes: (n: number) => `${n} دقیقه`,
  passwordHeader: 'گذرواژه شما',
  passwordText:
    'تأیید دو مرحله‌ای فعال شد. حساب کاربری شما با یک گذرواژه اضافه محافظت می‌شود.',
  enterPassword: 'گذرواژه را وارد کنید',
  forgotPassword: 'گذرواژه را فراموش کرده‌اید؟',
  restoreEmailTitle: 'کد بازیابی فرستاده شد',
  restoreEmailSent: (p: string) => `کد بازیابی به ${p} فرستاده شد.`,
  restoreEmailInfo: 'کد ۶ رقمی فرستاده‌شده به ایمیلتان را وارد کنید.',
  enterCode: 'کد را وارد کنید',
  noEmailTitle: 'بازیابی ممکن نیست',
  noEmailText:
    'چون ایمیل بازیابی تنظیم نشده، فقط پس از انتظار می‌توانید حساب را بازنشانی کنید.',
  resetAccount: 'بازنشانی حساب',
  resetStatus: 'می‌توانید حساب را پس از این مدت بازنشانی کنید',
  resetWarning: 'هشدار بازنشانی حساب',
  resetWarningText:
    'اگر حساب را بازنشانی کنید، همهٔ گفتگوها و مخاطبین ابری پاک می‌شوند.',
  resetNow: 'بازنشانی',
  setNewPassword: 'گذرواژهٔ جدید',
  newPassHint1: 'گذرواژهٔ جدید را وارد کنید.',
  newPassHint2: 'یک راهنما برای گذرواژه بنویسید (اختیاری).',
  firstPassword: 'گذرواژهٔ جدید',
  secondPassword: 'تکرار گذرواژه',
  passwordHint: 'راهنمای گذرواژه',
  profileInfo: 'اطلاعات پروفایل',
  registerText: 'نام و یک عکس پروفایل وارد کنید.',
  firstName: 'نام',
  lastName: 'نام خانوادگی',
  tos: 'با ثبت‌نام، با شرایط استفاده موافقت می‌کنید.',
  tosTitle: 'شرایط استفاده',
  accept: 'می‌پذیرم',
  decline: 'نمی‌پذیرم',
  tosDecline: 'اگر نپذیرید نمی‌توانید در تلگرام ثبت‌نام کنید.',
  signUp: 'ثبت‌نام',
  addEmailTitle: 'یک ایمیل ورود انتخاب کنید',
  addEmailSub:
    'شما کدهای ورود به حساب کاربری تلگرام را به جای پیامک، از طریق ایمیل دریافت خواهید کرد. لطفاً آدرس ایمیلی که به آن دسترسی دارید را وارد نمایید.',
  yourEmail: 'ایمیل شما',
  googleSignIn: 'ورود به حساب کاربری',
  loginOr: 'یا',
  checkEmail: 'ایمیلتان را بررسی کنید',
  checkYourEmail: (e: string) => `کد را به ${e} فرستادیم.`,
  resendCode: 'ارسال دوبارهٔ کد',
  cantAccessEmail: 'به ایمیل دسترسی ندارید؟',
  wordTitle: 'کلمه را وارد کنید',
  phraseTitle: 'عبارت را وارد کنید',
  smsWord: 'کلمه',
  smsPhrase: 'عبارت',
  wordInfo: 'کلمهٔ آمده در پیامک را وارد کنید.',
  phraseInfo: 'عبارت آمده در پیامک را وارد کنید.',
  paste: 'چسباندن',
  smsFeeTitle: 'برای دریافت کد باید هزینهٔ پیامک را بپردازید',
  smsFeeCta: 'ادامه',
  loginOk: 'ورود با موفقیت انجام شد',
  alreadyLoggedIn: 'این شماره از قبل وارد شده است.',
  signUpRequired:
    'این شماره در تلگرام ثبت نشده است. ابتدا در برنامهٔ رسمی تلگرام ثبت‌نام کنید.',
  wrongAccount: 'این شماره متعلق به حساب تلگرامی که اپ را باز کرده نیست.',
  recaptcha:
    'تلگرام تأیید امنیتی reCAPTCHA خواسته که در مینی‌اپ پشتیبانی نمی‌شود.',
  googleUnavailable: 'ورود با گوگل در مینی‌اپ در دسترس نیست. ایمیل را وارد کنید.',
  emailInvalid: 'آدرس ایمیل نامعتبر است.',
  wordBeginning: (start: string) => `کلمه با «${start}» شروع می‌شود.`,
  phraseBeginning: (start: string) => `عبارت با «${start}» شروع می‌شود.`,
  hours: (n: number) => `${n} ساعت`,
  serverError: 'ارتباط با تلگرام برقرار نشد.',
  stopLoadingTitle: 'توقف بارگذاری؟',
  stopLoading: 'هنوز منتظر پاسخ سرور هستیم. می‌خواهید صبر کنید یا متوقف کنید؟',
  waitMore: 'بیشتر صبر می‌کنم',
  stop: 'توقف',
  continue: 'ادامه',
  search: 'جستجو',
  close: 'بستن',
} as const;

export type LoginPage =
  | 'phone'
  | 'sms'
  | 'app'
  | 'call'
  | 'flash'
  | 'missed'
  | 'fragment'
  | 'word'
  | 'phrase'
  | 'password'
  | 'recover'
  | 'resetWait'
  | 'newPass1'
  | 'newPass2'
  | 'email'
  | 'emailSetup'
  | 'emailCode'
  | 'pay'
  | 'success';

export type LoginAlert =
  | 'chooseCountry'
  | 'wrongCountry'
  | 'invalidPhone'
  | 'bannedPhone'
  | 'shortNumber'
  | 'wrongCode'
  | 'floodWait'
  | 'codeExpired'
  | 'phoneFlood'
  | 'noEmail'
  | 'noMail'
  | 'restoreEmail'
  | 'tos'
  | 'tosDecline'
  | 'alreadyLoggedIn'
  | 'stopLoading'
  | 'didNotGetCode'
  | 'resetWarning'
  | 'resetCancelled'
  | 'wrongPassword'
  | 'passwordsMismatch'
  | 'permissionCall'
  | 'permissionCallLog'
  | 'updateApp'
  | 'signUpRequired'
  | 'wrongAccount'
  | 'recaptcha'
  | 'googleUnavailable'
  | 'emailInvalid'
  | 'serverError'
  | 'editNumber'
  | 'stopVerification';
