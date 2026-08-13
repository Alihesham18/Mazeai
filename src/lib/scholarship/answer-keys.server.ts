import "server-only";

const tenCorrectFirstOptions = Object.freeze(
  Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`q${index + 1}`, 0]))
) as Readonly<Record<string, number>>;

const scholarshipAnswerKeys: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "mobile-programming": tenCorrectFirstOptions,
  "data-science-machine-learning": tenCorrectFirstOptions,
  "web-development-dotnet": tenCorrectFirstOptions,
  cybersecurity: tenCorrectFirstOptions
};

export function getScholarshipAnswerKey(programSlug: string) {
  return scholarshipAnswerKeys[programSlug];
}
