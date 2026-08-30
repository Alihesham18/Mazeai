# Directus Team content handoff

## Current backend status

Completed on 2026-08-30 against the configured local Directus 11.17.4 instance. The two collections, their fields and relations, two published members, eight translations, two image files, and least-privilege public read permissions are active. The setup is reproducible with `npm run directus:setup-team` and can be audited without mutations using `npm run directus:setup-team -- --verify-only`.

The application integration in `src/lib/directus/team.ts` reads the live anonymous API. Its localized safe failure state remains available for genuine backend failures; it does not substitute hardcoded people.

## Verified source basis

- Current company Team page: <https://synergymazeai.com/>. It lists Mahyar Teymournezhad as `Founder/CEO` and Prof. Dr. Özgür Koray Şahingöz as `Akademik Danışman`. The LinkedIn destinations on that old implementation are swapped and must not be copied.
- Mahyar Teymournezhad LinkedIn identity: <https://www.linkedin.com/in/mahyarteymournezhad>
- Prof. Dr. Özgür Koray Şahingöz LinkedIn identity: <https://www.linkedin.com/in/sahingoz>
- Biruni University profile: <https://en.biruni.edu.tr/leadership/vice-chancellor/prof-dr-ozgur-koray-sahingoz>
- Biruni University CV/research record: <https://biravesis.biruni.edu.tr/osahingoz/Cv?isCultureTr=False>

The two local portraits were downloaded from the company-published Team cards, not LinkedIn:

- Mahyar: <https://i.hizliresim.com/ocs43r5.jpeg> → `public/images/team/mahyar-teymournezhad.jpg`
- Özgür: <https://i.hizliresim.com/8gegyyg.jpeg> → `public/images/team/ozgur-koray-sahingoz.jpg`

The company has publicly selected and published these images for the two profiles. Independent copyright ownership or a separate reusable-license grant could not be verified. Confirm internal authorization before production publication. The local files remain as idempotent setup and rollback sources; the production frontend uses the Directus file relation.

## Collections and fields

Create `team_members` with a UUID primary key and these fields:

| Field          | Directus type/interface  | Required | Notes                                                                                   |
| -------------- | ------------------------ | -------- | --------------------------------------------------------------------------------------- |
| `id`           | UUID / input             | yes      | generated primary key                                                                   |
| `status`       | string / status          | yes      | choices `draft`, `published`; default `draft`                                           |
| `sort`         | integer / input          | no       | smaller values first                                                                    |
| `slug`         | string / input           | yes      | unique, indexed, max 120                                                                |
| `full_name`    | string / input           | yes      | max 160                                                                                 |
| `photo`        | UUID / file-image        | no       | M2O to `directus_files.id`                                                              |
| `linkedin_url` | string / input           | no       | max 500; HTTPS person-profile URL                                                       |
| `category`     | string / select-dropdown | yes      | `leadership`, `research_advisory`, `research`, `engineering`, `education`, `operations` |
| `expertise`    | JSON / tags              | yes      | canonical English expertise labels; localized labels remain in translations             |
| `translations` | alias / translations     | yes      | O2M to `team_members_translations.team_member`                                          |

Create `team_members_translations` with an integer or UUID primary key:

| Field         | Directus type/interface    | Required | Notes                                                      |
| ------------- | -------------------------- | -------- | ---------------------------------------------------------- |
| `id`          | integer or UUID / input    | yes      | generated primary key                                      |
| `team_member` | UUID / select-dropdown-m2o | yes      | M2O to `team_members.id`, cascade on delete                |
| `language`    | string / select-dropdown   | yes      | `en`, `tr`, `ar`, `fa`; unique together with `team_member` |
| `job_title`   | string / input             | yes      | max 160                                                    |
| `bio`         | text / textarea or WYSIWYG | yes      | concise professional biography                             |
| `expertise`   | JSON / tags                | yes      | localized string array; maximum eight labels               |
| `photo_alt`   | string / input             | yes      | meaningful localized portrait alt text, max 240            |

Configure the `translations` O2M alias using `team_members_translations.team_member`. English is the controlled application fallback when a requested translation is missing. If English is missing, the application checks the other supported locales in routing order and rejects records with no usable title and biography.

## Public permissions

For the Directus Public role grant only:

1. `team_members`: read fields `id,status,sort,slug,full_name,photo,linkedin_url,category,expertise,translations` with item filter `{ "status": { "_eq": "published" } }`.
2. `team_members_translations`: read fields `id,team_member,language,job_title,bio,expertise,photo_alt`, restricted to translations whose parent is published. No create, update, or delete permission.
3. `directus_files`: read only the two Team file IDs required by the published records. Do not grant file mutation permissions.

Do not grant public create, update, or delete access to either Team collection. Keep drafts and all editing operations restricted to the existing authorized content-admin role. Do not add a browser-visible service token.

## Initial records

Create exactly these two published records. Upload the corresponding local JPEG to Directus Files and assign its generated file ID to `photo`.

### Mahyar Teymournezhad

```json
{
  "status": "published",
  "sort": 1,
  "slug": "mahyar-teymournezhad",
  "full_name": "Mahyar Teymournezhad",
  "linkedin_url": "https://www.linkedin.com/in/mahyarteymournezhad",
  "category": "leadership",
  "translations": [
    {
      "language": "en",
      "job_title": "Founder & CEO",
      "bio": "Mahyar Teymournezhad is the Founder and CEO of Synergy Maze AI, guiding the company's work across artificial intelligence, technology, research and development, and education.",
      "expertise": ["Leadership", "Artificial Intelligence", "R&D", "Strategy"],
      "photo_alt": "Portrait of Mahyar Teymournezhad"
    },
    {
      "language": "tr",
      "job_title": "Kurucu ve CEO",
      "bio": "Mahyar Teymournezhad, Synergy Maze AI'ın Kurucusu ve CEO'sudur; şirketin yapay zeka, teknoloji, araştırma-geliştirme ve eğitim alanlarındaki çalışmalarına yön verir.",
      "expertise": ["Liderlik", "Yapay Zeka", "Ar-Ge", "Strateji"],
      "photo_alt": "Mahyar Teymournezhad portresi"
    },
    {
      "language": "ar",
      "job_title": "المؤسس والرئيس التنفيذي",
      "bio": "مهیار تیمورنژاد هو مؤسس Synergy Maze AI ورئيسها التنفيذي، ويقود أعمال الشركة في الذكاء الاصطناعي والتكنولوجيا والبحث والتطوير والتعليم.",
      "expertise": ["القيادة", "الذكاء الاصطناعي", "البحث والتطوير", "الاستراتيجية"],
      "photo_alt": "صورة شخصية لمهیار تیمورنژاد"
    },
    {
      "language": "fa",
      "job_title": "بنیان‌گذار و مدیرعامل",
      "bio": "مهیار تیمورنژاد بنیان‌گذار و مدیرعامل Synergy Maze AI است و فعالیت‌های شرکت را در حوزه‌های هوش مصنوعی، فناوری، تحقیق‌وتوسعه و آموزش هدایت می‌کند.",
      "expertise": ["رهبری", "هوش مصنوعی", "تحقیق و توسعه", "راهبرد"],
      "photo_alt": "پرتره مهیار تیمورنژاد"
    }
  ]
}
```

### Prof. Dr. Özgür Koray Şahingöz

```json
{
  "status": "published",
  "sort": 2,
  "slug": "ozgur-koray-sahingoz",
  "full_name": "Prof. Dr. Özgür Koray Şahingöz",
  "linkedin_url": "https://www.linkedin.com/in/sahingoz",
  "category": "research_advisory",
  "translations": [
    {
      "language": "en",
      "job_title": "Academic Advisor",
      "bio": "Prof. Dr. Özgür Koray Şahingöz is MazeAI's Academic Advisor and a Professor of Computer Engineering at Biruni University. His academic work includes artificial intelligence, machine learning and computer engineering.",
      "expertise": ["Research", "Artificial Intelligence", "Academia", "Mentorship"],
      "photo_alt": "Portrait of Prof. Dr. Özgür Koray Şahingöz"
    },
    {
      "language": "tr",
      "job_title": "Akademik Danışman",
      "bio": "Prof. Dr. Özgür Koray Şahingöz, MazeAI'ın Akademik Danışmanı ve Biruni Üniversitesi Bilgisayar Mühendisliği profesörüdür. Akademik çalışmaları yapay zeka, makine öğrenmesi ve bilgisayar mühendisliğini kapsar.",
      "expertise": ["Araştırma", "Yapay Zeka", "Akademi", "Mentorluk"],
      "photo_alt": "Prof. Dr. Özgür Koray Şahingöz portresi"
    },
    {
      "language": "ar",
      "job_title": "المستشار الأكاديمي",
      "bio": "الأستاذ الدكتور أوزغور كوراي شاهينغوز هو المستشار الأكاديمي لـ MazeAI وأستاذ هندسة الحاسوب في جامعة بيروني. تشمل أعماله الأكاديمية الذكاء الاصطناعي وتعلّم الآلة وهندسة الحاسوب.",
      "expertise": ["البحث", "الذكاء الاصطناعي", "العمل الأكاديمي", "الإرشاد"],
      "photo_alt": "صورة شخصية للأستاذ الدكتور أوزغور كوراي شاهينغوز"
    },
    {
      "language": "fa",
      "job_title": "مشاور دانشگاهی",
      "bio": "پروفسور دکتر اوزگور کورای شاهین‌گوز مشاور دانشگاهی MazeAI و استاد مهندسی کامپیوتر در دانشگاه بیرونی است. فعالیت دانشگاهی او هوش مصنوعی، یادگیری ماشین و مهندسی کامپیوتر را دربر می‌گیرد.",
      "expertise": ["پژوهش", "هوش مصنوعی", "دانشگاه", "راهنمایی علمی"],
      "photo_alt": "پرتره پروفسور دکتر اوزگور کورای شاهین‌گوز"
    }
  ]
}
```

## Verification after setup

1. Read `/items/team_members` anonymously with the same field selection used by `src/lib/directus/team.ts`; verify exactly two records and four translations per record.
2. Change one record to `draft` and verify it disappears anonymously, then restore it to `published`.
3. Confirm each Directus asset URL loads anonymously and that the file IDs are set on the corresponding records.
4. Run the validation commands listed in the main handoff report, then open all four locale routes in both themes.

## Applied IDs and verification result

- Team records: Mahyar `30389b06-b6f3-4472-a8de-d9f6297601e4`; Özgür `edaeb2ca-cb09-4d4f-9f78-2be0f981b57c`.
- Files: Mahyar `59ad15ca-108c-459a-95c4-4a38e37afe0d`; Özgür `4b92c767-f2a4-4e9c-9fd6-5fc572c8da8c`.
- Public read permission IDs: `team_members` 78, `team_members_translations` 79, `directus_files` 80.
- Translation IDs:
  - Mahyar: EN `40d553b6-5a78-46c0-8d27-048e96e98d2c`, TR `8eec29f6-2717-4d1f-aabc-f48a3b8e8fde`, AR `a24c4fdd-737a-4725-8834-931939beae9b`, FA `030424a3-7ace-48d2-8c39-2ccb5c392783`.
  - Özgür: EN `180dca20-217d-4ef9-a2fb-6fd1566da3b4`, TR `33662b0a-273a-46dd-8e97-90f402fdbf00`, AR `96d3e511-336a-48ad-bbfc-aaf2af2a2ec9`, FA `5609a208-3ddd-49d4-bc77-e3b0d8a32df7`.
- Anonymous verification returned exactly two published members with four translations each. Both image assets were readable, the draft sentinel was hidden, and anonymous create/update/delete calls were denied.
- The real-backend and fixture-backed Playwright runs both passed the four-locale, light/dark, responsive, RTL, portrait, link, image, and reduced-motion checks.
