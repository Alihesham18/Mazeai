import type { LocalizedText } from "@/types/content";

export interface ScholarshipQuestion {
  id: string;
  prompt: LocalizedText;
  options: readonly LocalizedText[];
}

export interface ScholarshipExam {
  programSlug: string;
  questions: readonly ScholarshipQuestion[];
}

const text = (en: string, tr?: string, ar?: string, fa?: string): LocalizedText => ({
  en,
  tr: tr ?? en,
  ar: ar ?? en,
  fa: fa ?? en
});

const q = (
  id: string,
  prompt: LocalizedText,
  options: readonly LocalizedText[]
): ScholarshipQuestion => ({ id, prompt, options });

export const scholarshipExamCopy = {
  back: text("Back to program", "Programa dön", "العودة إلى البرنامج", "بازگشت به برنامه"),
  label: text("Scholarship exam", "Bursluluk sınavı", "اختبار المنحة", "آزمون بورسیه"),
  intro: text(
    "Complete this short assessment to receive your scholarship eligibility result.",
    "Burs uygunluk sonucunuzu almak için bu kısa değerlendirmeyi tamamlayın.",
    "أكمل هذا التقييم القصير للحصول على نتيجة أهليتك للمنحة.",
    "برای دریافت نتیجه واجد شرایط بودن بورسیه، این ارزیابی کوتاه را تکمیل کنید."
  ),
  applicant: text("Applicant information", "Aday bilgileri", "معلومات المتقدم", "اطلاعات متقاضی"),
  fullName: text("Full name", "Ad soyad", "الاسم الكامل", "نام و نام خانوادگی"),
  email: text("Email", "E-posta", "البريد الإلكتروني", "ایمیل"),
  telephone: text("Telephone", "Telefon", "الهاتف", "تلفن"),
  progress: text("Exam progress", "Sınav ilerlemesi", "تقدم الاختبار", "پیشرفت آزمون"),
  question: text("Question", "Soru", "السؤال", "پرسش"),
  previous: text("Previous", "Önceki", "السابق", "قبلی"),
  next: text("Next", "Sonraki", "التالي", "بعدی"),
  submit: text("Submit exam", "Sınavı gönder", "إرسال الاختبار", "ارسال آزمون"),
  score: text("Score", "Puan", "النتيجة", "امتیاز"),
  completed: text("Exam completed", "Sınav tamamlandı", "اكتمل الاختبار", "آزمون تکمیل شد"),
  resultMessage: text(
    "Your assessment has been completed.",
    "Değerlendirmeniz tamamlandı.",
    "اكتمل تقييمك.",
    "ارزیابی شما تکمیل شد."
  ),
  percentage: text("Percentage", "Yüzde", "النسبة المئوية", "درصد"),
  scholarshipAward: text("Scholarship Award", "Burs İndirimi", "قيمة المنحة", "میزان بورسیه"),
  discountCode: text("Discount Code", "İndirim Kodu", "رمز الخصم", "کد تخفیف"),
  scholarshipDiscountReady: text(
    "Scholarship discount ready",
    "Burs indirimi hazır",
    "خصم المنحة جاهز",
    "تخفیف بورسیه آماده است"
  ),
  scholarshipDiscountUnavailable: text(
    "Your result was saved, but the scholarship discount is not available yet. Please try again from My Account.",
    "Sonucunuz kaydedildi ancak burs indirimi henüz kullanılamıyor. Lütfen Hesabım bölümünden tekrar deneyin.",
    "تم حفظ نتيجتك، لكن خصم المنحة غير متاح بعد. يرجى المحاولة مجددًا من حسابي.",
    "نتیجه شما ذخیره شد، اما تخفیف بورسیه هنوز در دسترس نیست. لطفاً از حساب من دوباره تلاش کنید."
  ),
  redeemFromProfile: text(
    "Redeem this code from your profile",
    "Bu kodu profilinizden kullanın",
    "استبدل هذا الرمز من ملفك الشخصي",
    "این کد را از نمایه خود فعال کنید"
  ),
  copyCode: text("Copy Code", "Kodu Kopyala", "نسخ الرمز", "کپی کد"),
  copied: text("Copied!", "Kopyalandı!", "تم النسخ!", "کپی شد!"),
  resultSaved: text(
    "Your result has been saved to My Account.",
    "Sonucunuz Hesabım bölümüne kaydedildi.",
    "تم حفظ نتيجتك في حسابي.",
    "نتیجه شما در حساب من ذخیره شد."
  ),
  eligible: text("Eligible", "Uygun", "مؤهل", "واجد شرایط"),
  notEligible: text("Not Eligible", "Uygun Değil", "غير مؤهل", "واجد شرایط نیست"),
  underReview: text("Under Review", "İnceleniyor", "قيد المراجعة", "در حال بررسی"),
  completedStatus: text("Completed", "Tamamlandı", "مكتمل", "تکمیل شده"),
  submitting: text("Submitting...", "Gönderiliyor...", "جارٍ الإرسال...", "در حال ارسال..."),
  submissionFailed: text(
    "Exam submission failed. Please try again.",
    "Sınav gönderilemedi. Lütfen tekrar deneyin.",
    "تعذر إرسال الاختبار. يرجى المحاولة مرة أخرى.",
    "ارسال آزمون ناموفق بود. دوباره تلاش کنید."
  ),
  sessionExpired: text(
    "Your session has expired. Please log in again.",
    "Oturumunuz sona erdi. Lütfen yeniden giriş yapın.",
    "انتهت جلستك. يرجى تسجيل الدخول مجددا.",
    "نشست شما منقضی شده است. دوباره وارد شوید."
  ),
  invalidSubmission: text(
    "Invalid exam submission. Review your answers and try again.",
    "Geçersiz sınav gönderimi. Yanıtlarınızı kontrol edip tekrar deneyin.",
    "إرسال الاختبار غير صالح. راجع إجاباتك وحاول مرة أخرى.",
    "ارسال آزمون نامعتبر است. پاسخ‌ها را بررسی کرده و دوباره تلاش کنید."
  ),
  loginToTakeExam: text(
    "Log in to take the scholarship exam",
    "Bursluluk sınavına girmek için giriş yapın",
    "سجل الدخول لإجراء اختبار المنحة",
    "برای شرکت در آزمون بورسیه وارد شوید"
  ),
  validation: text(
    "Please complete your contact information and answer every question before submitting.",
    "Lütfen göndermeden önce iletişim bilgilerinizi tamamlayın ve tüm soruları cevaplayın.",
    "يرجى إكمال معلومات الاتصال والإجابة عن جميع الأسئلة قبل الإرسال.",
    "لطفا پیش از ارسال، اطلاعات تماس را تکمیل کنید و به همه پرسش‌ها پاسخ دهید."
  ),
  takeTest: text(
    "Take the Scholarship Test",
    "Bursluluk Testine Gir",
    "ابدأ اختبار المنحة",
    "شرکت در آزمون بورسیه"
  )
} satisfies Record<string, LocalizedText>;

export const scholarshipExams: Record<string, ScholarshipExam> = {
  "data-science-machine-learning": {
    programSlug: "data-science-machine-learning",
    questions: [
      q("q1", text("Which Python library is commonly used for tabular data analysis?"), [
        text("pandas"),
        text("Flask"),
        text("Pygame"),
        text("Beautiful Soup")
      ]),
      q("q2", text("What does a training dataset help a machine learning model do?"), [
        text("Learn patterns from examples"),
        text("Store passwords"),
        text("Render CSS"),
        text("Compress images only")
      ]),
      q("q3", text("Which metric is commonly used for regression problems?"), [
        text("Mean Absolute Error"),
        text("Class name"),
        text("Screen width"),
        text("Port number")
      ]),
      q("q4", text("What is overfitting?"), [
        text("Doing well on training data but poorly on new data"),
        text("Using too little memory"),
        text("Sorting data alphabetically"),
        text("Removing all features")
      ]),
      q("q5", text("Why is a test dataset useful?"), [
        text("It evaluates performance on unseen data"),
        text("It replaces model training"),
        text("It creates a logo"),
        text("It hides source code")
      ]),
      q("q6", text("Which step often turns raw columns into useful model inputs?"), [
        text("Feature engineering"),
        text("DNS lookup"),
        text("Font loading"),
        text("Manual billing")
      ]),
      q("q7", text("Which tool can package an ML application into a portable container?"), [
        text("Docker"),
        text("Excel"),
        text("Photoshop"),
        text("SMTP")
      ]),
      q("q8", text("What does API deployment allow a model to do?"), [
        text("Serve predictions to applications"),
        text("Delete all data"),
        text("Change monitor brightness"),
        text("Disable validation")
      ]),
      q("q9", text("Which task belongs to data visualization?"), [
        text("Plotting trends and distributions"),
        text("Encrypting passwords only"),
        text("Buying a domain"),
        text("Compiling Sass")
      ]),
      q("q10", text("What should be checked before trusting a model result?"), [
        text("Validation and evaluation results"),
        text("Button color only"),
        text("File name length"),
        text("Laptop brand")
      ])
    ]
  },
  "mobile-programming": {
    programSlug: "mobile-programming",
    questions: [
      q("q1", text("What is a variable used for in programming?"), [
        text("Storing a value"),
        text("Deleting an app store"),
        text("Changing a phone case"),
        text("Blocking every function")
      ]),
      q("q2", text("Which structure repeats code while a condition remains true?"), [
        text("Loop"),
        text("Image"),
        text("Font"),
        text("Route name only")
      ]),
      q("q3", text("What does an if statement help a program do?"), [
        text("Make a decision"),
        text("Remove all screens"),
        text("Publish automatically"),
        text("Change hardware")
      ]),
      q("q4", text("What is a function?"), [
        text("A reusable block of code"),
        text("A phone battery"),
        text("An app screenshot"),
        text("A store review")
      ]),
      q("q5", text("Which language is commonly used with React Native?"), [
        text("JavaScript"),
        text("SQL only"),
        text("HTML only"),
        text("Markdown only")
      ]),
      q("q6", text("What is React Native used for?"), [
        text("Building mobile applications"),
        text("Training database servers only"),
        text("Creating invoices"),
        text("Replacing the internet")
      ]),
      q("q7", text("What is state in a user interface?"), [
        text("Data that can change while the screen is running"),
        text("A fixed image file"),
        text("A store category"),
        text("A phone charger")
      ]),
      q("q8", text("What is the main purpose of API integration in a mobile app?"), [
        text("Connecting to external data or services"),
        text("Removing navigation"),
        text("Disabling testing"),
        text("Changing screen glass")
      ]),
      q("q9", text("Which device feature provides location information?"), [
        text("GPS"),
        text("Speaker"),
        text("Wallpaper"),
        text("Brightness")
      ]),
      q("q10", text("What should happen before publishing an app?"), [
        text("Testing and debugging"),
        text("Deleting all forms"),
        text("Removing all navigation"),
        text("Ignoring errors")
      ])
    ]
  },
  "web-development-dotnet": {
    programSlug: "web-development-dotnet",
    questions: [
      q("q1", text("Which language is commonly used with .NET for backend development?"), [
        text("C#"),
        text("CSS"),
        text("Bash only"),
        text("Markdown")
      ]),
      q("q2", text("What is a variable used for?"), [
        text("Storing a value"),
        text("Opening a bank account"),
        text("Hiding all code"),
        text("Changing DNS automatically")
      ]),
      q("q3", text("What does a loop do?"), [
        text("Repeats a block of code"),
        text("Deletes a database"),
        text("Creates a logo"),
        text("Stops all requests")
      ]),
      q("q4", text("What does OOP stand for?"), [
        text("Object-Oriented Programming"),
        text("Online Output Page"),
        text("Open Office Protocol"),
        text("Original Order Plan")
      ]),
      q("q5", text("What is HTTP mainly used for?"), [
        text("Communication between clients and web servers"),
        text("Drawing icons only"),
        text("Encrypting local folders only"),
        text("Changing screen resolution")
      ]),
      q("q6", text("Which database language is commonly used to query relational data?"), [
        text("SQL"),
        text("CSS"),
        text("SVG"),
        text("YAML only")
      ]),
      q("q7", text("What is an API endpoint?"), [
        text("A URL where software can request or send data"),
        text("A visual font"),
        text("A laptop shortcut"),
        text("A password hint")
      ]),
      q("q8", text("What does MVC help organize?"), [
        text("Application responsibilities"),
        text("Monitor cables"),
        text("Image compression only"),
        text("Keyboard layouts")
      ]),
      q("q9", text("What is Entity Framework Core commonly used for?"), [
        text("Working with databases from .NET applications"),
        text("Editing videos"),
        text("Changing browser tabs"),
        text("Creating icons only")
      ]),
      q("q10", text("Why is authentication used in web applications?"), [
        text("To verify a user's identity"),
        text("To make every page public"),
        text("To remove the database"),
        text("To disable forms")
      ])
    ]
  },
  cybersecurity: {
    programSlug: "cybersecurity",
    questions: [
      q("q1", text("What does the CIA triad stand for in cybersecurity?"), [
        text("Confidentiality, Integrity, Availability"),
        text("Code, Internet, API"),
        text("Cache, Input, Array"),
        text("Cloud, Identity, App")
      ]),
      q("q2", text("What is phishing?"), [
        text("A deceptive attempt to steal information"),
        text("A secure backup method"),
        text("A database index"),
        text("A password manager feature")
      ]),
      q("q3", text("Which practice helps protect user accounts?"), [
        text("Using strong unique passwords"),
        text("Sharing passwords in chat"),
        text("Disabling updates"),
        text("Using one password everywhere")
      ]),
      q("q4", text("What is malware?"), [
        text("Software designed to cause harm or unauthorized access"),
        text("A network cable"),
        text("A browser bookmark"),
        text("A safe coding style")
      ]),
      q("q5", text("What does an IP address identify?"), [
        text("A device or network interface on a network"),
        text("A document title"),
        text("A screen color"),
        text("A programming loop")
      ]),
      q("q6", text("Which protocol is commonly used for encrypted web browsing?"), [
        text("HTTPS"),
        text("TXT"),
        text("PNG"),
        text("CSV")
      ]),
      q("q7", text("What is vulnerability scanning used for?"), [
        text("Finding potential security weaknesses"),
        text("Designing logos"),
        text("Charging a laptop"),
        text("Removing all logs")
      ]),
      q("q8", text("What is multi-factor authentication?"), [
        text("Using more than one proof of identity"),
        text("Using only a username"),
        text("Sharing one code publicly"),
        text("Turning off login checks")
      ]),
      q("q9", text("Which action follows ethical cybersecurity principles?"), [
        text("Testing only with permission"),
        text("Accessing systems without consent"),
        text("Publishing stolen passwords"),
        text("Bypassing rules for practice")
      ]),
      q("q10", text("What is a firewall commonly used for?"), [
        text("Filtering network traffic"),
        text("Editing images"),
        text("Writing CSS only"),
        text("Replacing backups")
      ])
    ]
  }
};

export function getScholarshipExam(slug: string): ScholarshipExam | undefined {
  return scholarshipExams[slug];
}
