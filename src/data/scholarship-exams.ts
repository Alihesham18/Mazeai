import type { LocalizedText } from "@/types/content";

export interface ScholarshipQuestion {
  prompt: LocalizedText;
  options: readonly LocalizedText[];
  answer: number;
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
  prompt: LocalizedText,
  options: readonly LocalizedText[],
  answer: number
): ScholarshipQuestion => ({ prompt, options, answer });

export const scholarshipExamCopy = {
  back: text("Back to program", "Programa dön", "العودة إلى البرنامج", "بازگشت به برنامه"),
  label: text("Scholarship exam", "Bursluluk sınavı", "اختبار المنحة", "آزمون بورسیه"),
  intro: text(
    "Complete this short assessment so the SynergyMazeAI team can review your scholarship eligibility. Your result is calculated locally in this browser until a submission backend is connected.",
    "Burs uygunluğunuzun değerlendirilebilmesi için bu kısa değerlendirmeyi tamamlayın. Bir gönderim altyapısı bağlanana kadar sonucunuz bu tarayıcıda yerel olarak hesaplanır.",
    "أكمل هذا التقييم القصير حتى يتمكن فريق SynergyMazeAI من مراجعة أهليتك للمنحة. يتم حساب نتيجتك محليا في هذا المتصفح إلى أن يتم ربط نظام إرسال خلفي.",
    "این ارزیابی کوتاه را تکمیل کنید تا تیم SynergyMazeAI بتواند واجد شرایط بودن شما برای بورسیه را بررسی کند. تا زمان اتصال زیرساخت ارسال، نتیجه شما فقط در همین مرورگر محاسبه می‌شود."
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
    "Your assessment has been completed. The SynergyMazeAI team will review your result and contact you regarding scholarship eligibility.",
    "Değerlendirmeniz tamamlandı. SynergyMazeAI ekibi sonucunuzu inceleyecek ve burs uygunluğu hakkında sizinle iletişime geçecektir.",
    "اكتمل تقييمك. سيراجع فريق SynergyMazeAI نتيجتك ويتواصل معك بشأن أهلية المنحة.",
    "ارزیابی شما تکمیل شد. تیم SynergyMazeAI نتیجه شما را بررسی می‌کند و درباره واجد شرایط بودن برای بورسیه با شما تماس خواهد گرفت."
  ),
  localOnly: text(
    "This exam is not connected to a server yet. Your answers were scored locally and were not sent or stored.",
    "Bu sınav henüz bir sunucuya bağlı değildir. Cevaplarınız yerel olarak puanlandı; gönderilmedi veya saklanmadı.",
    "هذا الاختبار غير متصل بخادم بعد. تم حساب إجاباتك محليا ولم تُرسل أو تُخزن.",
    "این آزمون هنوز به سرور متصل نیست. پاسخ‌های شما به صورت محلی امتیازدهی شد و ارسال یا ذخیره نشد."
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
      q(text("Which Python library is commonly used for tabular data analysis?"), [text("pandas"), text("Flask"), text("Pygame"), text("Beautiful Soup")], 0),
      q(text("What does a training dataset help a machine learning model do?"), [text("Learn patterns from examples"), text("Store passwords"), text("Render CSS"), text("Compress images only")], 0),
      q(text("Which metric is commonly used for regression problems?"), [text("Mean Absolute Error"), text("Class name"), text("Screen width"), text("Port number")], 0),
      q(text("What is overfitting?"), [text("Doing well on training data but poorly on new data"), text("Using too little memory"), text("Sorting data alphabetically"), text("Removing all features")], 0),
      q(text("Why is a test dataset useful?"), [text("It evaluates performance on unseen data"), text("It replaces model training"), text("It creates a logo"), text("It hides source code")], 0),
      q(text("Which step often turns raw columns into useful model inputs?"), [text("Feature engineering"), text("DNS lookup"), text("Font loading"), text("Manual billing")], 0),
      q(text("Which tool can package an ML application into a portable container?"), [text("Docker"), text("Excel"), text("Photoshop"), text("SMTP")], 0),
      q(text("What does API deployment allow a model to do?"), [text("Serve predictions to applications"), text("Delete all data"), text("Change monitor brightness"), text("Disable validation")], 0),
      q(text("Which task belongs to data visualization?"), [text("Plotting trends and distributions"), text("Encrypting passwords only"), text("Buying a domain"), text("Compiling Sass")], 0),
      q(text("What should be checked before trusting a model result?"), [text("Validation and evaluation results"), text("Button color only"), text("File name length"), text("Laptop brand")], 0)
    ]
  },
  "mobile-programming": {
    programSlug: "mobile-programming",
    questions: [
      q(text("What is a variable used for in programming?"), [text("Storing a value"), text("Deleting an app store"), text("Changing a phone case"), text("Blocking every function")], 0),
      q(text("Which structure repeats code while a condition remains true?"), [text("Loop"), text("Image"), text("Font"), text("Route name only")], 0),
      q(text("What does an if statement help a program do?"), [text("Make a decision"), text("Remove all screens"), text("Publish automatically"), text("Change hardware")], 0),
      q(text("What is a function?"), [text("A reusable block of code"), text("A phone battery"), text("An app screenshot"), text("A store review")], 0),
      q(text("Which language is commonly used with React Native?"), [text("JavaScript"), text("SQL only"), text("HTML only"), text("Markdown only")], 0),
      q(text("What is React Native used for?"), [text("Building mobile applications"), text("Training database servers only"), text("Creating invoices"), text("Replacing the internet")], 0),
      q(text("What is state in a user interface?"), [text("Data that can change while the screen is running"), text("A fixed image file"), text("A store category"), text("A phone charger")], 0),
      q(text("What is the main purpose of API integration in a mobile app?"), [text("Connecting to external data or services"), text("Removing navigation"), text("Disabling testing"), text("Changing screen glass")], 0),
      q(text("Which device feature provides location information?"), [text("GPS"), text("Speaker"), text("Wallpaper"), text("Brightness")], 0),
      q(text("What should happen before publishing an app?"), [text("Testing and debugging"), text("Deleting all forms"), text("Removing all navigation"), text("Ignoring errors")], 0)
    ]
  },
  "web-development-dotnet": {
    programSlug: "web-development-dotnet",
    questions: [
      q(text("Which language is commonly used with .NET for backend development?"), [text("C#"), text("CSS"), text("Bash only"), text("Markdown")], 0),
      q(text("What is a variable used for?"), [text("Storing a value"), text("Opening a bank account"), text("Hiding all code"), text("Changing DNS automatically")], 0),
      q(text("What does a loop do?"), [text("Repeats a block of code"), text("Deletes a database"), text("Creates a logo"), text("Stops all requests")], 0),
      q(text("What does OOP stand for?"), [text("Object-Oriented Programming"), text("Online Output Page"), text("Open Office Protocol"), text("Original Order Plan")], 0),
      q(text("What is HTTP mainly used for?"), [text("Communication between clients and web servers"), text("Drawing icons only"), text("Encrypting local folders only"), text("Changing screen resolution")], 0),
      q(text("Which database language is commonly used to query relational data?"), [text("SQL"), text("CSS"), text("SVG"), text("YAML only")], 0),
      q(text("What is an API endpoint?"), [text("A URL where software can request or send data"), text("A visual font"), text("A laptop shortcut"), text("A password hint")], 0),
      q(text("What does MVC help organize?"), [text("Application responsibilities"), text("Monitor cables"), text("Image compression only"), text("Keyboard layouts")], 0),
      q(text("What is Entity Framework Core commonly used for?"), [text("Working with databases from .NET applications"), text("Editing videos"), text("Changing browser tabs"), text("Creating icons only")], 0),
      q(text("Why is authentication used in web applications?"), [text("To verify a user's identity"), text("To make every page public"), text("To remove the database"), text("To disable forms")], 0)
    ]
  },
  cybersecurity: {
    programSlug: "cybersecurity",
    questions: [
      q(text("What does the CIA triad stand for in cybersecurity?"), [text("Confidentiality, Integrity, Availability"), text("Code, Internet, API"), text("Cache, Input, Array"), text("Cloud, Identity, App")], 0),
      q(text("What is phishing?"), [text("A deceptive attempt to steal information"), text("A secure backup method"), text("A database index"), text("A password manager feature")], 0),
      q(text("Which practice helps protect user accounts?"), [text("Using strong unique passwords"), text("Sharing passwords in chat"), text("Disabling updates"), text("Using one password everywhere")], 0),
      q(text("What is malware?"), [text("Software designed to cause harm or unauthorized access"), text("A network cable"), text("A browser bookmark"), text("A safe coding style")], 0),
      q(text("What does an IP address identify?"), [text("A device or network interface on a network"), text("A document title"), text("A screen color"), text("A programming loop")], 0),
      q(text("Which protocol is commonly used for encrypted web browsing?"), [text("HTTPS"), text("TXT"), text("PNG"), text("CSV")], 0),
      q(text("What is vulnerability scanning used for?"), [text("Finding potential security weaknesses"), text("Designing logos"), text("Charging a laptop"), text("Removing all logs")], 0),
      q(text("What is multi-factor authentication?"), [text("Using more than one proof of identity"), text("Using only a username"), text("Sharing one code publicly"), text("Turning off login checks")], 0),
      q(text("Which action follows ethical cybersecurity principles?"), [text("Testing only with permission"), text("Accessing systems without consent"), text("Publishing stolen passwords"), text("Bypassing rules for practice")], 0),
      q(text("What is a firewall commonly used for?"), [text("Filtering network traffic"), text("Editing images"), text("Writing CSS only"), text("Replacing backups")], 0)
    ]
  }
};

export function getScholarshipExam(slug: string): ScholarshipExam | undefined {
  return scholarshipExams[slug];
}
